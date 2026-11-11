/* ═══════════════════════════════════════════════════════════
   手启心言 · A2A / SSE 服务
   ───────────────────────────────────────────────────────────
   给比赛系统填一个 SSE URL 就能接入。三种响应格式，靠路径或 ?fmt= 切换：
     /sse            默认 text  —— data: 纯文本增量（最宽容，先试这个）
     /sse/openai     OpenAI 兼容 chunk —— data: {"choices":[{"delta":{"content"}}]}
     /sse/a2a        A2A 0.3 JSON-RPC 事件流
   另提供标准 A2A 入口：
     GET  /.well-known/agent-card.json   能力名片
     GET  /.well-known/agent.json        旧版路径，同一份内容
     POST /a2a                           JSON-RPC（message/send、SendMessage 等）
   本地：node a2a/server.mjs        阿里云 FC Web 函数：监听 9000 端口即可
   ═══════════════════════════════════════════════════════════ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/* 本地仓库里资源在 ../assets，打包上云后可能同级，两处都找 */
const ROOT = [path.resolve(HERE, '..'), HERE]
  .find((p) => fs.existsSync(path.join(p, 'assets/js/prompt.js'))) || path.resolve(HERE, '..');

/* ── 复用站点同一份提示词与知识库 ── */
const { SYS_PROMPT, MODE_PROMPTS, projectContext } = require(path.join(ROOT, 'assets/js/prompt.js'));
const DB = new Function('window', fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8') + '\nreturn DB;')({});

const PORT = Number(process.env.PORT || 9000);
const HOST = process.env.HOST || '0.0.0.0';
const TOKEN = process.env.A2A_TOKEN || '';
const LLM = {
  baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
  model: process.env.LLM_MODEL || 'deepseek-chat',
  key: process.env.LLM_API_KEY || 'sk-1539db3c2e3b47a8adcebc8599abd9b8',
};

const SKILLS = [
  {
    id: 'course-design',
    name: '课前·低资源课程适配',
    description: '输入儿童年龄、人数、课时、现有材料与场地，输出四阶模式的实施方案，含低成本材料替代、步骤卡、提问卡与课堂组织建议。',
    tags: ['课程设计', '低资源', '乡镇学校', '四阶模式'],
    examples: ['12个孩子，6—12岁混龄，只有旧报纸、剪刀和胶水，90分钟，帮我设计一节课'],
    mode: 'plan',
  },
  {
    id: 'expression-scaffold',
    name: '课中·物成言立表达支架',
    description: '围绕儿童已经完成的真实作品，生成层层递进的开放问题，支持儿童命名、讲述与题诗。',
    tags: ['表达支架', '提问设计', '儿童讲述'],
    examples: ['孩子用泥巴捏了个笑嘻嘻的小人，说"这是我爷爷"，我该怎么引导他讲出来？'],
    mode: 'scaffold',
  },
  {
    id: 'reflection-iterate',
    name: '课后·三维课堂迭代',
    description: '依据教师输入的课堂观察或教学反思，按身体参与—环境参与—生成性三维框架给出下一节课的调整建议。',
    tags: ['课堂诊断', '教学反思', '迭代优化'],
    examples: ['今天这节课孩子们光顾着捏泥巴没人愿意说话，帮我诊断一下'],
    mode: 'iterate',
  },
  {
    id: 'open-chat',
    name: '自由对话',
    description: '四阶模式、材料替代、作品编码、研究工具等通用问答。',
    tags: ['问答', '项目知识'],
    examples: ['什么是四阶模式？'],
    mode: 'free',
  },
];

function agentCard(origin) {
  const base = origin || 'http://127.0.0.1:' + PORT;
  return {
    protocolVersion: '0.3.0',
    name: '手启心言',
    description: '面向乡镇学校的具身化创意表达课程实施智能体：把一节普通手工活动转化为具有身体参与、材料互动、语言生成与持续迭代的创意表达课程。',
    url: base + '/a2a',
    preferredTransport: 'JSONRPC',
    version: '1.0.0',
    provider: { organization: '华中师范大学文学院「以手启思，以身达意」项目组', url: base + '/' },
    documentationUrl: base + '/',
    capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: false },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: SKILLS.map((s) => ({ id: s.id, name: s.name, description: s.description, tags: s.tags, examples: s.examples })),
  };
}

/* ── 消息解析：兼容平台可能的各种字段名 ── */
const TEXT_KEYS = ['q', 'query', 'message', 'prompt', 'input', 'text', 'content', 'question'];

function pickText(url, body) {
  for (const k of TEXT_KEYS) {
    const v = url.searchParams.get(k);
    if (v) return v;
  }
  if (!body) return '';
  if (typeof body === 'string') return body.trim();
  if (body.message?.parts) return body.message.parts.map((p) => p.text || '').join('').trim();
  if (Array.isArray(body.messages)) {
    const last = [...body.messages].reverse().find((m) => m.role === 'user');
    if (last) return typeof last.content === 'string' ? last.content : JSON.stringify(last.content);
  }
  for (const k of TEXT_KEYS) if (typeof body[k] === 'string' && body[k]) return body[k];
  if (body.params?.message?.parts) return body.params.message.parts.map((p) => p.text || '').join('').trim();
  return '';
}

function pickMode(url, body, text) {
  const explicit = url.searchParams.get('skill') || url.searchParams.get('mode');
  if (explicit && MODE_PROMPTS[explicit]) return explicit;
  const skillId = body?.skill || body?.params?.skill;
  const bySkill = SKILLS.find((s) => s.id === skillId);
  if (bySkill) return bySkill.mode;
  if (/设计|教案|课程包|课时|安排一节课|上一节课/.test(text)) return 'plan';
  if (/引导|提问|讲述|讲出来|题诗|命名|不会说/.test(text)) return 'scaffold';
  if (/诊断|反思|改进|下节课|调整/.test(text)) return 'iterate';
  return 'free';
}

function history(url, body) {
  if (Array.isArray(body?.messages)) {
    return body.messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-8).map((m) => ({ role: m.role, content: String(m.content ?? '') }));
  }
  const h = url.searchParams.get('history');
  if (!h) return [];
  try {
    const arr = JSON.parse(h);
    return Array.isArray(arr) ? arr.slice(-8) : [];
  } catch { return []; }
}

function buildMessages({ text, mode, past }) {
  const sys = SYS_PROMPT + '\n\n' + projectContext(DB) + (mode !== 'free' && MODE_PROMPTS[mode] ? '\n\n' + MODE_PROMPTS[mode] : '');
  return [{ role: 'system', content: sys }, ...past, { role: 'user', content: text }];
}

/* ── 上游模型（OpenAI 兼容流式） ── */
async function* streamLLM(messages, signal) {
  const res = await fetch(LLM.baseUrl.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + LLM.key },
    body: JSON.stringify({ model: LLM.model, messages, stream: true, temperature: 0.7 }),
    signal,
  });
  if (!res.ok) throw new Error('upstream ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const j = JSON.parse(payload);
        const delta = j.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* 忽略非 JSON 心跳 */ }
    }
  }
}

/* ── SSE 输出 ── */
function sseHead(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
  });
}
const sseSend = (res, data, event) => {
  if (event) res.write('event: ' + event + '\n');
  res.write('data: ' + (typeof data === 'string' ? data : JSON.stringify(data)) + '\n\n');
};

async function answer(req, res, { text, mode, past, fmt, id }) {
  sseHead(res);
  res.write(': connected\n\n');
  const started = Date.now();
  let full = '';

  if (fmt === 'a2a') {
    sseSend(res, { jsonrpc: '2.0', id, result: { kind: 'task', id: 'task-' + id, contextId: 'ctx-' + id, status: { state: 'working', timestamp: new Date().toISOString() } } }, 'message');
  }
  if (fmt === 'openai') {
    sseSend(res, { id: 'chatcmpl-' + id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: LLM.model, choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }] });
  }

  const ac = new AbortController();
  req.on('close', () => ac.abort());
  const hb = setInterval(() => res.write(': ping\n\n'), 15000);

  try {
    for await (const delta of streamLLM(buildMessages({ text, mode, past }), ac.signal)) {
      full += delta;
      if (fmt === 'openai') sseSend(res, { id: 'chatcmpl-' + id, object: 'chat.completion.chunk', created: Math.floor(started / 1000), model: LLM.model, choices: [{ index: 0, delta: { content: delta }, finish_reason: null }] });
      else if (fmt === 'a2a') sseSend(res, { jsonrpc: '2.0', id, result: { kind: 'artifact-update', taskId: 'task-' + id, artifact: { artifactId: 'a-' + id, parts: [{ kind: 'text', text: delta }] } } }, 'message');
      else sseSend(res, delta.split('\n').map((l) => l || ' ').join('\ndata: '));
    }
    if (fmt === 'openai') {
      sseSend(res, { id: 'chatcmpl-' + id, object: 'chat.completion.chunk', created: Math.floor(started / 1000), model: LLM.model, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] });
      sseSend(res, '[DONE]');
    } else if (fmt === 'a2a') {
      sseSend(res, { jsonrpc: '2.0', id, result: { kind: 'task', id: 'task-' + id, contextId: 'ctx-' + id, status: { state: 'completed', timestamp: new Date().toISOString() }, artifacts: [{ artifactId: 'a-' + id, parts: [{ kind: 'text', text: full }] }] } }, 'message');
    } else {
      sseSend(res, '', 'done');
    }
  } catch (err) {
    const msg = err?.name === 'AbortError' ? '' : '（服务异常：' + err.message + '）';
    if (msg) {
      if (fmt === 'openai') sseSend(res, { id: 'chatcmpl-' + id, object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: msg }, finish_reason: 'stop' }] });
      else sseSend(res, msg, fmt === 'a2a' ? 'message' : undefined);
    }
  } finally {
    clearInterval(hb);
    res.end();
  }
}

/* ── 平台只填 URL 时的探测流：先自报家门，再保持心跳 ── */
function announce(req, res, origin) {
  sseHead(res);
  const card = agentCard(origin);
  sseSend(res, { name: card.name, description: card.description, skills: card.skills.map((s) => ({ id: s.id, name: s.name })) }, 'metadata');
  sseSend(res, '手启心言已就绪：把教师的问题用 q / message / prompt 任一参数传入即可获得 SSE 流式回答。', 'message');
  sseSend(res, '', 'done');
  res.end();
}

/* ── JSON-RPC（A2A 0.3 与 1.0 方法名都接） ── */
async function jsonrpc(req, res, body, origin, url) {
  const id = body?.id ?? 1;
  const method = body?.method || '';
  const send = (result) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
  };
  const SEND = ['message/send', 'SendMessage', 'tasks/send'];
  const STREAM = ['message/stream', 'SendStreamingMessage'];

  if (method === 'agent/getAuthenticatedExtendedCard' || method === 'GetAgentCard') return send(agentCard(origin));

  if (SEND.includes(method) || STREAM.includes(method)) {
    const text = pickText(url, body);
    if (!text) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32602, message: 'message.parts 为空' } }));
    }
    if (SEND.includes(method)) {
      const mode = pickMode(url, body, text);
      let full = '';
      try {
        for await (const d of streamLLM(buildMessages({ text, mode, past: [] }))) full += d;
      } catch (e) { full = '（服务异常：' + e.message + '）'; }
      return send({
        kind: 'task', id: 'task-' + id, contextId: 'ctx-' + id,
        status: { state: 'completed', timestamp: new Date().toISOString() },
        artifacts: [{ artifactId: 'a-' + id, parts: [{ kind: 'text', text: full }] }],
      });
    }
    return answer(req, res, { text, mode: pickMode(url, body, text), past: [], fmt: 'a2a', id });
  }

  if (method === 'tasks/get' || method === 'GetTask' || method === 'tasks/cancel' || method === 'CancelTask') {
    return send({ kind: 'task', id: body?.params?.id || 'unknown', status: { state: method.includes('cancel') || method.includes('Cancel') ? 'canceled' : 'completed', timestamp: new Date().toISOString() } });
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: '未实现的方法：' + method } }));
}

/* ── 路由 ── */
const server = http.createServer(async (req, res) => {
  const origin = 'http://' + (req.headers.host || '127.0.0.1:' + PORT);
  const url = new URL(req.url, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
    return res.end();
  }

  const unauthorized = () => {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'missing or invalid token' }));
  };
  if (TOKEN) {
    const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || url.searchParams.get('token') || '';
    if (got !== TOKEN) return unauthorized();
  }

  if (req.method === 'GET' && (url.pathname === '/.well-known/agent-card.json' || url.pathname === '/.well-known/agent.json' || url.pathname === '/agent-card.json')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' });
    return res.end(JSON.stringify(agentCard(origin), null, 2));
  }

  if (url.pathname === '/' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ ok: true, service: '手启心言 A2A', sse: origin + '/sse', card: origin + '/.well-known/agent-card.json', formats: ['text', 'openai', 'a2a'] }));
  }

  let body = null;
  if (req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (raw) { try { body = JSON.parse(raw); } catch { body = raw; } }
  }

  if (url.pathname === '/a2a' || (req.method === 'POST' && url.pathname === '/')) {
    return jsonrpc(req, res, body, origin, url);
  }

  const m = url.pathname.match(/^\/sse(?:\/(text|openai|a2a))?$/);
  if (m) {
    const fmt = m[1] || url.searchParams.get('fmt') || 'text';
    const text = pickText(url, body);
    if (!text) return announce(req, res, origin);
    const id = String(Date.now());
    return answer(req, res, { text, mode: pickMode(url, body, text), past: history(url, body), fmt, id });
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'not found', try: ['/sse', '/sse/openai', '/sse/a2a', '/a2a', '/.well-known/agent-card.json'] }));
});

server.listen(PORT, HOST, () => {
  console.log('[手启心言 A2A] listening on http://' + HOST + ':' + PORT);
  console.log('  SSE      : /sse            （默认 text，可 /sse/openai、/sse/a2a）');
  console.log('  AgentCard: /.well-known/agent-card.json');
  console.log('  JSON-RPC : /a2a');
  console.log('  LLM      : ' + LLM.model + ' @ ' + LLM.baseUrl);
});
