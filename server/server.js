/* 手启心言 · 可选后端服务
 * 静态站点本身已完整可运行（浏览器直连 OpenAI 兼容接口）；
 * 本服务用于需要“后端代理 + 服务端知识库/会话存储”的部署形态（如学校服务器、云主机）。
 *
 * 用法：
 *   cd server
 *   npm install          # 仅需 express 一个依赖
 *   LLM_API_KEY=sk-xxx LLM_BASE_URL=https://api.deepseek.com/v1 LLM_MODEL=deepseek-chat node server.js
 *   打开 http://localhost:8080
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

const LLM = {
  key: process.env.LLM_API_KEY || '',
  base: (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
  model: process.env.LLM_MODEL || 'deepseek-chat',
};

const KB_DIR = path.join(__dirname, 'kb');
fs.mkdirSync(KB_DIR, { recursive: true });

/* ── 模型代理：/api/chat ──
 * body: { system, messages:[{role,content|content[]}] }
 * 转发到 OpenAI 兼容接口（流式），浏览器无需暴露 Key */
app.post('/api/chat', async (req, res) => {
  if (!LLM.key) return res.status(500).json({ error: '服务端未配置 LLM_API_KEY' });
  try {
    const upstream = await fetch(LLM.base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM.key}` },
      body: JSON.stringify({
        model: LLM.model,
        temperature: 0.4,
        stream: true,
        messages: [{ role: 'system', content: req.body.system }, ...req.body.messages],
      }),
    });
    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status).json({ error: `上游接口 ${upstream.status}` });
    }
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const reader = upstream.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

/* ── 知识库：教案/规则文档的服务端挂载点 ──
 * 把团队整理好的结构化课例（JSON/MD）放入 server/kb/ 即可被检索引用。
 * GET /api/kb?type=lesson|rule|doc 列出；GET /api/kb/:file 读取。
 * 后续可在此扩展向量检索（embeddings）或对接学校 HiAgent 平台。 */
app.get('/api/kb', (req, res) => {
  const type = String(req.query.type || '');
  const files = fs.readdirSync(KB_DIR).filter((f) => !type || f.startsWith(type + '-'));
  res.json({ files });
});
app.get('/api/kb/:file', (req, res) => {
  const safe = path.basename(req.params.file);
  const p = path.join(KB_DIR, safe);
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'not found' });
  res.type('text/plain; charset=utf-8').send(fs.readFileSync(p, 'utf8'));
});

/* ── 会话存储（服务端存档，跨设备同步用；纯演示可不用） ── */
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
app.get('/api/sessions', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'))); }
  catch { res.json([]); }
});
app.post('/api/sessions', (req, res) => {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(req.body || [], null, 1));
  res.json({ ok: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`手启心言 server → http://localhost:${PORT}`));
