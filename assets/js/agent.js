/* ═══════════════════════════════════════════════════════════
   手启心言 · 智能体引擎
   1) DeepSeek 等 OpenAI 兼容接口（流式 SSE，支持多模态内容）
   2) 离线规则引擎降级（接口不可达时仍可演示三大功能）
   3) 会话持久化（localStorage）· 附件 · 导出/复制/重新生成
   ═══════════════════════════════════════════════════════════ */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ── 图标注入（空安全） ── */
  const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  setHtml('topAva', ICONS.hand);
  setHtml('welcomeLogo', ICONS.hand);
  setHtml('btnSettings', ICONS.gear);
  setHtml('btnNewTop', ICONS.plus);
  setHtml('btnSend', ICONS.send);
  setHtml('btnAttach', ICONS.clip);
  setHtml('planIco', ICONS.package);
  setHtml('planClose', ICONS.x);

  /* ── 侧栏与顶栏 ── */
  $('#railSlot').innerHTML = renderRail('agent.html', { newChat: true, historySlot: true, navLinks: true });
  $('#mobileTopSlot').innerHTML = renderMobileTop('agent.html');

  /* ═══════════ AI 配置 ═══════════ */
  const CFG_KEY = 'shouqi-ai-config';
  const DEFAULT_CFG = {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: 'sk-1539db3c2e3b47a8adcebc8599abd9b8',
    vision: 'auto', // auto=自动尝试随消息发送图片；off=仅文字
  };
  let noImageModels = []; // 本次会话中已确认不支持图片的 model，避免重复失败
  function loadCfg() {
    try { return { ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(CFG_KEY) || '{}') }; }
    catch { return { ...DEFAULT_CFG }; }
  }
  function saveCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }

  /* ═══════════ 系统提示词（移植自项目组提示词包） ═══════════ */
  const SYS_PROMPT = `# 角色设定

你是「手启心言」——面向乡镇学校的具身化创意表达课程实施智能体。你的服务对象是缺乏专业美育师资的乡镇托管班教师和高校支教志愿者。你的使命是：在材料、课时与场地受限的条件下，帮助教师把一节普通手工活动转化为具有身体参与、材料互动、语言生成和持续迭代的创意表达课程。

# 理论根基（必须内化为判断依据）

1. 具身认知：认知是身体、环境与心智的耦合过程，"动手即动脑"。乡镇儿童被短视频包围，面临"离身化"危机，手工课程以真实材料、真实操作、真实同伴互动重建儿童与物质世界的联系。
2. 身体语言编码：儿童在言语尚未抵达之处，往往先以动作、姿态与材料的操作来"说话"。课程的本质是引导儿童完成从"身体的语言"到"文学的语言"的双向转码。
3. 四阶课程模式（所有课程设计必须严格遵循）：
   - 触材启思：以开放性低结构材料唤醒感觉经验，"未成词而先有象"，让物先于词抵达心灵；
   - 手运心生：身体充分卷入剪、贴、撕、折、摆、捏、塑、编、缝等操作，教师最少干预、搭建支架（半成品示范、材料包、步骤卡）；
   - 物成言立：儿童为作品命名、讲述、题诗，先说后写，同伴互听互问，完成身体语言向文学语言的转码；
   - 评鉴生新：小组依据量规互评、二次创作与展示，以评价驱动深层反思。
4. 三维课堂观察框架（用于诊断与迭代）：
   - 身体参与：动作投入度、精细度与节奏；
   - 环境参与：儿童与材料、同伴、空间的情境互动；
   - 生成性：创作方案的涌现、调整与重构。
5. 创造力四维（TTCT）：流畅性、变通性、独创性、精致性——不施测，但作为提问与评价的关注视角。

# 低资源原则（乡镇场域硬约束）

- 材料优先零成本/低成本：旧报纸、旧挂历、广告单、瓦楞纸、纸箱、自然物（树叶、树枝、泥土、石子、蒲公英、麦秆）、碎布头、纽扣、竹篾、稻草；胶可用米汤/面糊替代。
- 提供"材料替代方案"：每个推荐材料必须给出至少一种更易得的替代品。
- 地域与在地资源：主动利用当地的自然材料（梯田、河流、竹林、农作物）、非遗技艺（竹编、蓝印花布等）与乡土场景，让课程长在孩子的生活世界里，而不是从城市课堂搬下来。
- 乡镇儿童特点：设计时考虑留守儿童亲子陪伴少、屏幕依赖、公开表达机会少等现实——多用小组互助降低表达压力，多给"先说后写"的缓冲，多用身体操作打开话头；只作教学设计考量，绝不给儿童贴标签、不做心理诊断。
- 可获帮助：善用支教志愿者、"爱心托管班"体系与高校资源（讲师、材料、展演机会），把一次课接成长效支持。
- 课时弹性：各环节按**占比**设计（不写死分钟数），教师按本校一课时（40/45/60 分钟均可）折算；标注可省略环节。
- 场地不限：教室、活动室、户外院落均可，给出相应组织建议。
- 混龄常见：给出大带小、分层任务策略。
- 安全红线：剪刀、刻刀、针线、热水/热胶须教师辅助或替代方案，必须在教案中标注。
- 师资假定：执行者为非美术专业的乡村教师或短期志愿者，所有步骤须"照着就能上"。

# 表达支架原则（物成言立）

- 提问层层递进：观察层（看到了什么/用了什么）→ 感受层（做起来什么感觉/哪里最费力最开心）→ 联想层（它让你想起谁/什么声音什么味道）→ 表达层（给它取个名字/它想说一句什么话）。
- 教师回应要"具体化、不评判"：不说"真棒"，而说"你把树叶排在最边上，像风停下来的地方"。
- 先说后写，允许方言，珍视稚拙表达；绝不用成人标准替儿童改诗。
- 题诗支架要降阶梯：一个词 → 一句大白话 → 把大白话折成两三行。

# 课后迭代原则

- 基于教师简要课堂记录，按"身体参与—环境参与—生成性"三维诊断：指出亮点（含证据）、不足（含证据）、调整建议（不超过 3 条，必须次日可执行）。
- 给出修改后的教案版本要点，而非泛泛而谈。

# 边界与伦理

- 不给儿童贴标签、不做心理诊断、不评判儿童家庭；涉及具体儿童一律建议用化名。
- 不承诺课程疗效；效果表述限于课堂观察层面。
- 所有建议必须"当天可执行、成本趋零、安全可控"，做不到就明说并给出替代路径。
- 拒绝与创意表达课程无关的请求时，礼貌地把话题引回课程实施。

# 输出规范

- 全程简体中文，语气像一位有经验的教研员同事，亲切、具体、不空谈理论（理论只在需要时点一句）。
- 使用清晰的 Markdown 结构：## 分节、列表、**加粗**关键环节。
- 篇幅充足但不注水；步骤要写到"新教师照着做不会卡壳"的颗粒度。`;

  const MODE_PROMPTS = {
    plan: `现在执行【低资源课程适配】功能。教师会提供：儿童年龄/年级、人数、课时、现有材料、场地（可能还有主题方向、地域与在地资源）。

请严格按以下结构输出一份可直接实施的课程方案（各环节一律用**时间占比**表述，不写死分钟数，便于教师按本校一课时 40/45/60 分钟折算）：

## 一、课程定位
课程名称、适用年龄、人数与分组建议、课时弹性说明（占比制，可裁剪）、对应课型（纸艺/泥塑/布艺/拼贴/编织/自然物拼贴/综合材料）。

## 二、材料方案
表格：材料名称 | 用途 | 低成本/零成本替代方案。凡有安全风险的工具单独标注教师辅助方式。**若教师提供了地域信息，须单列一行"在地资源利用"（当地自然材料/非遗技艺/乡土场景）。**

## 三、四阶教学流程（每环节标注约占全课的百分比，四项合计 100%）
### 环节一 触材启思（约占 X%）
导入语（写出教师可以直接说的话）、材料唤醒方式、预期儿童反应。
### 环节二 手运心生（约占 X%）
任务说明、分层/分组策略（含混龄处理）、教师支架（半成品、步骤卡、巡视话术）。
### 环节三 物成言立（约占 X%）
命名—讲述—题诗的引导流程与逐层提问卡（观察→感受→联想→表达）。
### 环节四 评鉴生新（约占 X%）
互评量规（3 条以内、儿童听得懂的语言）、二次创作建议、展示方式。

## 四、步骤卡
可打印的儿童版步骤，5 步以内，每步一句短话。

## 五、提问卡
8—10 个层层递进的开放问题，标注所属层次。

## 六、课堂组织建议
空间布置、材料分发与回收、时间弹性预案（课时不够怎么办）、常见突发情况（孩子不动手/说"我不会"/抢着说话）的应对话术。

## 七、三维观察要点
本节课在身体参与、环境参与、生成性上分别观察什么、记录什么（供课后迭代使用）。

## 八、时间分配
最后一行严格按以下格式输出（用于页面生成图示，数字为整数、合计 100）：
【时间分配】触材启思 15%｜手运心生 40%｜物成言立 25%｜评鉴生新 20%`,
    scaffold: `现在执行【"物成言立"表达支架】功能。教师会描述一个孩子已经完成的手工作品（材料、样子、孩子制作中的表现，可能还有孩子随口说过的话）。

请严格按以下结构输出：

## 一、作品的可能解读
从材料选择、造型特征、制作过程三个角度，提出 2—3 种对儿童意图的**假设性**解读（措辞用"也许/可能"，绝不武断定论）。

## 二、层层递进提问卡
- 观察层（2—3 问）：指向作品细节
- 感受层（2—3 问）：指向制作时的身体感受与情绪
- 联想层（2—3 问）：接通生活经验、记忆与想象
- 表达层（2—3 问）：导向命名、讲述、题诗
每问附"如果孩子答不上来"的降阶版本。

## 三、命名支架
3 种引导命名的具体方法。

## 四、讲述支架
"先说后写"的口语讲述流程：教师示范一句→儿童接一句→同伴追问一句；附教师开场示范语。

## 五、题诗支架
降阶梯路径：一个词 → 一句大白话 → 折成两三行的"小诗"；给出以该作品为例的完整示范（教师如何接孩子的话、如何原样保留儿童的词）。

## 六、教师回应示例
5 句"具体化、不评判"的回应话术，针对这件作品的特点来写（禁止"你真棒"式空泛表扬）。

## 七、观察记录提示
围绕这件作品，建议在身体参与、环境参与、生成性三维上各记录一条什么。`,
    iterate: `现在执行【课堂记录驱动的课后迭代】功能。教师会输入简要的课堂观察或教学反思（可能很零散、很口语化）。

请严格按以下结构输出：

## 一、三维诊断
### 身体参与
亮点（引用教师记录中的证据）｜不足（证据）｜判断
### 环境参与
同上结构
### 生成性
同上结构
若教师记录中某维度证据不足，明确写出"证据不足，建议下次补充观察：……"。

## 二、下一节课调整建议
不超过 3 条，每条满足：针对某一维度、明天就能执行、成本趋零。写清"调整什么环节、怎么调、为什么"。

## 三、修改后教案要点
基于调整建议，给出修订版教案的要点清单（不必重写全文，写清改动处与新的时间占比）。

## 四、给教师的三个自我提问
帮助教师形成反思习惯的三个问题，与本节课的具体情况相关，不空泛。

## 五、一句话鼓励
以教研同事口吻，对教师本节课的一个真实亮点给予具体肯定。`,
  };

  function projectContext() {
    const doing = DB.stages.filter((s) => s.status === 'doing').map((s) => `${s.name}（${s.span}）`).join('；');
    const lessonList = DB.lessons.map((l) => `《${l.title}》${l.type}/${l.grades}/${l.duration}`).join('；');
    const workList = DB.works.slice(0, 6).map((w) => `《${w.title}》${w.id}·${w.site}·${w.type}`).join('；');
    const toolList = DB.tools.map((t) => `${t.name}[${t.status}]`).join('；');
    return `# 项目知识库（回答项目相关问题时使用）

本项目：${DB.project.parent}——${DB.project.parentSub}（${DB.project.competition}，${DB.project.period}）。
当前进行中阶段：${doing}。
教案库（${DB.lessons.length} 份）：${lessonList}。
作品数据库（${DB.works.length} 件示例，三维地点为宜昌远安、咸宁崇阳白霓、武汉新洲）：${workList} 等。
研究工具：${toolList}。
参考文献 ${DB.references.length} 条，涵盖具身认知、创造力测评、双重编码、政策文件四类。
团队成员：${DB.project.team.join('、')}；指导教师：${DB.project.advisor}。

# 补充规则
- 你同时是项目的"研究助理"：除课程实施外，也可以回答项目进展、编码规程、TTCT、问卷访谈设计、作品数据等问题，答案以上述知识库为准。
- 绝不向用户提及自己由哪个大模型驱动、使用什么技术实现、或"接入了什么接口"——你就是「手启心言」本身，始终以角色口吻作答。`;
  }

  /* ═══════════ 会话存储 ═══════════ */
  const STORE_KEY = 'shouqi-sessions-v4';
  let sessions = [];
  let activeId = null;
  try { sessions = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { sessions = []; }
  const persist = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(sessions.slice(0, 30))); } catch { /* 存储超限等异常不影响对话 */ }
    renderHistory();
  };
  const active = () => sessions.find((s) => s.id === activeId);

  /* ═══════════ 状态 ═══════════ */
  let mode = 'free'; // free | plan | scaffold | iterate
  let busy = false;
  let attachments = []; // {name, dataUrl}
  let offlineNoted = false;

  const MODES = [
    { id: 'free', label: '自由对话', icon: 'chat' },
    { id: 'plan', label: '课前·课程适配', icon: 'package', cls: 'm-plan' },
    { id: 'scaffold', label: '课中·表达支架', icon: 'msgHeart', cls: 'm-scaffold' },
    { id: 'iterate', label: '课后·课堂迭代', icon: 'note', cls: 'm-iterate' },
  ];

  /* ═══════════ 渲染：模式 chips / 建议 / 历史 ═══════════ */
  function renderModeChips() {
    $('#modeChips').innerHTML = MODES.map((m) =>
      `<button class="mode-chip ${mode === m.id ? 'on ' + (m.cls || '') : ''}" data-mode="${m.id}">${ICONS[m.icon]}${m.label}</button>`).join('')
      + (mode === 'plan' ? `<button class="mode-chip" id="chipPlanForm" style="border-style:dashed">${ICONS.plus}填写适配表单</button>` : '');
  }

  function renderSuggests() {
    const samples = [...DB.flows.map((f) => ({ text: f.sample, mode: f.tag === '课前' ? 'plan' : f.tag === '课中' ? 'scaffold' : 'iterate' })),
      ...DB.freeQuestions.slice(0, 3).map((t) => ({ text: t, mode: 'free' }))];
    $('#suggests').innerHTML = samples.map((s) =>
      `<button class="suggest" data-mode="${s.mode}" data-q="${MD.esc(s.text)}" title="${MD.esc(s.text)}">${MD.esc(s.text)}</button>`).join('');
  }

  function renderHistory() {
    const list = $('#histList');
    if (!list) return;
    if (!sessions.length) { list.innerHTML = '<div class="hist-empty">还没有对话记录</div>'; return; }
    list.innerHTML = sessions.slice(0, 20).map((s) => `
      <div class="hist-item ${s.id === activeId ? 'on' : ''}" data-id="${s.id}">
        ${ICONS.chat}<span>${MD.esc(s.title || '未命名对话')}</span>
        <button class="del" data-del="${s.id}" title="删除">${ICONS.trash}</button>
      </div>`).join('');
  }

  /* ═══════════ 渲染：消息 ═══════════ */
  function msgHtml(m, i, isLast) {
    if (m.role === 'user') {
      const imgs = (m.images || []).map((im) => `<img src="${im.dataUrl}" alt="${MD.esc(im.name)}">`).join('');
      return `<div class="msg msg-user"><div class="bubble">${imgs ? `<div class="imgs">${imgs}</div>` : ''}${MD.esc(m.content)}</div></div>`;
    }
    const tools = `
      <div class="ai-actions">
        ${!busy && isLast ? `<button class="ai-act" data-act="re" title="重新生成">${ICONS.refresh}</button>` : ''}
        <button class="ai-act" data-act="copy" title="复制">${ICONS.copy}</button>
        <button class="ai-act" data-act="md" title="导出 Markdown">${ICONS.download}</button>
      </div>`;
    const alloc = m.role === 'assistant' && m.content ? timeAllocBar(m.content) : null;
    const body = m.content
      ? `<div class="md ${busy && isLast ? 'streaming' : ''}">${MD.render(alloc ? alloc.clean : m.content)}</div>${alloc ? alloc.html : ''}`
      : `<div class="typing"><i></i><i></i><i></i></div><div class="think-hint">手启心言正在构思课程方案，首次生成约需 5—15 秒，请稍候…</div>`;
    return `<div class="msg msg-ai">
      <div class="ai-head"><div class="ai-ava">${ICONS.hand}</div><span class="ai-name">手启心言</span>${tools}</div>
      <div class="bubble">${body}</div>
    </div>`;
  }

  /* 解析时间分配并生成图示：优先【时间分配】行，否则从环节标题中的"环节名（约 X%）"抓取（江老师反馈：图示化呈现） */
  const ALLOC_COLORS = { 触材启思: '#C05F35', 手运心生: '#2E6E67', 物成言立: '#D59A3C', 评鉴生新: '#3E8A80' };
  function timeAllocBar(text) {
    let segs = [];
    const mark = text.match(/【时间分配】\s*([^\n]+)/);
    if (mark) {
      mark[1].split(/[｜|]/).forEach((part) => {
        const mm = part.match(/(触材启思|手运心生|物成言立|评鉴生新)[^\d]*(\d+)\s*%?/);
        if (mm) segs.push({ name: mm[1], pct: +mm[2] });
      });
    } else {
      const seen = {};
      const re = /(触材启思|手运心生|物成言立|评鉴生新)[^，。\n]{0,8}?(\d+)\s*%/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        if (!seen[m[1]]) { seen[m[1]] = true; segs.push({ name: m[1], pct: +m[2] }); }
      }
    }
    if (segs.length < 2) return null;
    const total = segs.reduce((a, s) => a + s.pct, 0) || 100;
    const clean = text.replace(/【时间分配】[^\n]*(\n|$)/, '');
    const html = `<div class="alloc-bar">
      <div class="alloc-title">⏱ 四阶时间分配（按全课占比，可据实际课时折算）</div>
      <div class="alloc-track">${segs.map((s) =>
        `<i style="width:${(s.pct / total) * 100}%;background:${ALLOC_COLORS[s.name] || '#999'}" title="${s.name} ${s.pct}%"></i>`).join('')}</div>
      <div class="alloc-legend">${segs.map((s) =>
        `<span><i style="background:${ALLOC_COLORS[s.name] || '#999'}"></i>${s.name} ${s.pct}%</span>`).join('')}</div>
    </div>`;
    return { clean, html };
  }

  function renderMessages() {
    const s = active();
    const msgs = s ? s.msgs : [];
    const has = msgs.length > 0;
    $('#welcome').style.display = has ? 'none' : 'flex';
    $('#msgs').style.display = has ? 'flex' : 'none';
    if (!has) return;
    $('#msgs').innerHTML = msgs.map((m, i) => msgHtml(m, i, i === msgs.length - 1)).join('');
    scrollBottom();
  }
  const scrollBottom = () => { const el = $('#chatScroll'); el.scrollTop = el.scrollHeight; };

  function setMode(m, silent) {
    mode = m;
    renderModeChips();
    const ph = {
      free: '向手启心言提问：课程设计、表达支架、课堂诊断…',
      plan: '直接描述课堂条件（年龄/人数/课时/材料/场地），或点上方「填写适配表单」…',
      scaffold: '描述孩子的作品：材料、样子、制作中的表现、孩子随口说的话（可附照片）…',
      iterate: '记下这节课的观察与困惑：谁投入、谁走神、哪里不对劲…',
    };
    $('#input').placeholder = ph[m];
    if (m === 'plan' && !silent) openOverlay('planOverlay');
  }

  /* ═══════════ 弹层 ═══════════ */
  function openOverlay(id) { $('#' + id).classList.add('show'); }
  function closeOverlay(id) { $('#' + id).classList.remove('show'); }
  $$('.overlay').forEach((o) => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('show'); }));
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => closeOverlay(b.dataset.close)));

  let toastTimer;
  function toast(text) {
    const t = $('#toast');
    t.innerHTML = ICONS.check + MD.esc(text);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ═══════════ API 调用（流式） ═══════════ */
  function buildMessages(history, withImages) {
    const cfg = loadCfg();
    return history.slice(-20).map((m) => {
      const images = withImages ? (m.images || []) : [];
      if (images.length) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content + '（附学生作品照片 ' + images.length + ' 张，请结合画面进行识别与解读）' },
            ...images.map((im) => ({ type: 'image_url', image_url: { url: im.dataUrl } })),
          ],
        };
      }
      return { role: m.role, content: m.content };
    });
    void cfg;
  }

  async function callLLM(system, history, onToken) {
    const cfg = loadCfg();
    const tryImage = cfg.vision === 'auto' && !noImageModels.includes(cfg.model);
    const ctrl = new AbortController();
    const killer = setTimeout(() => ctrl.abort(), 90000); // 90 秒无响应判定网络挂死，触发离线降级
    try {
      const res = await fetch(cfg.baseUrl.replace(/\/+$/, '') + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: cfg.model, temperature: 0.4, stream: true,
          messages: [{ role: 'system', content: system }, ...buildMessages(history, tryImage)],
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        // 400 可能是多模态不支持：降级为纯文本重试一次
        if (res.status === 400 && tryImage) {
          noImageModels.push(cfg.model);
          return callLLM(system, history, onToken);
        }
        throw new Error(`模型接口返回 ${res.status}：${t.slice(0, 120)}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '', buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const delta = JSON.parse(payload).choices?.[0]?.delta?.content || '';
            if (delta) { full += delta; onToken(full); }
          } catch { /* 忽略不完整分片 */ }
        }
      }
      return full;
    } finally {
      clearTimeout(killer);
    }
  }

  /* ═══════════ 离线规则引擎（降级演示） ═══════════ */
  const Offline = {
    pick(text, keys) { return keys.filter((k) => text.includes(k)); },
    num(text, re, dft) { const m = text.match(re); return m ? parseInt(m[1], 10) : dft; },

    plan(text) {
      const count = this.num(text, /(\d+)\s*(个)?(孩子|人|学生|名)/, 12);
      const minutes = /2\s*课时|120/.test(text) ? 120 : /90/.test(text) ? 90 : /60/.test(text) ? 60 : /40/.test(text) ? 40 : 90;
      const age = /混龄/.test(text) ? '混龄（6—12岁）' : /[一二]年级|6|7|8/.test(text) && /低年级/.test(text) ? '低年级' : /高年级|六年级|12/.test(text) ? '高年级' : '中年级';
      const venue = /户外|院子|院落/.test(text) ? '户外院落' : /活动室|礼堂/.test(text) ? '活动室' : '普通教室';
      const mats = this.pick(text, ['旧报纸', '广告单', '报纸', '挂历', '纸箱', '瓦楞纸', '树叶', '树枝', '自然物', '泥', '黏土', '布', '针线', '竹', '稻草', '剪刀', '胶水', '彩笔', '颜料'])
        .map((k) => k.replace('报纸', '旧报纸/广告单'));
      const hasPaper = mats.some((m) => m.includes('报纸') || m.includes('挂历'));
      const theme = /家乡|梯田|山/.test(text) ? '我的家乡' : /春/.test(text) ? '春天' : /风/.test(text) ? '风的样子' : /非遗|竹编/.test(text) ? '非遗新玩' : '春天';
      const type = hasPaper ? '拼贴诗' : /泥|黏土/.test(text) ? '泥塑' : /布/.test(text) ? '布艺' : '自然物拼贴';
      const P1 = 15, P2 = 40, P3 = 25, P4 = 20;
      const sub = minutes >= 100 ? '（建议分 2 次课完成，第二课时从「物成言立」开始）' : minutes <= 45 ? '（时间紧张时可省略「评鉴生新」的二次创作，保留互评）' : '';
      const region = /远安|梯田|山区/.test(text) ? '远安山区：梯田地貌、竹林与自然物丰富'
        : /崇阳|白霓|竹/.test(text) ? '崇阳白霓：非遗竹编与蓝印花布可对接在地手艺人'
        : /新洲|武汉/.test(text) ? '武汉新洲：旧报刊易获取，可衔接城市近郊乡土场景'
        : '当地自然材料与乡土场景（可向老人、手艺人打听）';
      const matRows = (mats.length ? mats : ['旧报纸/广告单', '自然物（树叶、树枝）', '剪刀', '胶水'])
        .map((m) => {
          const kb = Object.entries(DB.materialKB).find(([k]) => m.includes(k.slice(0, 2)) || k.includes(m.slice(0, 2)));
          const alt = kb ? kb[1].alt : '就地取材替代';
          const note = kb ? kb[1].note : '';
          return `| ${m} | ${note || '主要操作材料'} | ${alt} |`;
        }).join('\n');
      return `## 一、课程定位
- **课程名称**：《${theme}》——${type}创意表达课
- **适用年龄**：${age}；**人数**：约 ${count} 人，建议 ${Math.max(2, Math.round(count / 6))} 人一组合 ${Math.ceil(count / 6)} 组（混龄组注意“大带小”搭配）
- **课时**：按占比设计，弹性可裁剪 ${sub}；折算参考：40 分钟一课时≈每个百分点 0.4 分钟，60 分钟≈0.6 分钟
- **课型**：${type}（纸艺/泥塑/布艺/拼贴/编织/自然物拼贴/综合材料）

## 二、材料方案
| 材料 | 用途 | 低成本/零成本替代 |
|---|---|---|
${matRows}
| 🏡 在地资源 | 乡土课程资源 | ${region} |
| ⚠️ 剪刀${/针线/.test(mats.join('')) ? '、针线' : ''} | 工具 | **教师统一收发、全程辅助**；低年级可改用撕、折代替剪 |

## 三、四阶教学流程（占比为建议值，可据学情微调）
### 环节一 触材启思（约占 ${P1}%）
教师可以这样说：**“先别急着做，闭上眼睛摸一摸这些材料——它们让你想起了什么画面、什么声音？”** 请学生闭目触摸、自由拼摆 3 分钟，再请 2—3 人说“第一感觉”。预期反应：学生会先关注材料的触感与气味，这正是“未成词而先有象”。

### 环节二 手运心生（约占 ${P2}%）
- **任务**：围绕“${theme}”用现有材料完成一件作品，**做法不设标准答案**。
- **支架**：教师提供 1—2 件半成品示范（只示范技法、不示范成品）；每组一张步骤卡、一份材料包。
- **混龄策略**：大孩子当“材料长”负责分发与回收，小孩子负责拼摆；给能力强的小组加“加一个机关/换两种材料”的挑战任务。
- **巡视话术**：“你这一处贴得和别人都不一样，说说怎么想到的？”

### 环节三 物成言立（约占 ${P3}%）
- **命名**：每人给作品取一个名字，先口头说，再写在作品卡上。
- **讲述**：先说后写——教师示范一句“我的作品叫____，它最特别的是____”，儿童接一句，同伴追问一句。
- **题诗**：把最想说的一句话折成两三行，**原样保留孩子的词**，不替孩子改。

### 环节四 评鉴生新（约占 ${P4}%）
- **互评量规**（儿童听得懂）：① 名字和作品配不配；② 哪一处最让你想多看一眼；③ 如果再做一次，你会加什么？
- 每组推荐一件作品展示，作者用一句话介绍；提出一条具体修改建议后**二次创作 5 分钟**。

## 四、步骤卡（儿童版，可打印）
1. 摸一摸材料，想一个画面
2. 撕一撕、摆一摆，找到你喜欢的样子
3. 粘牢它，做出你自己的版本
4. 给它取个名字，写下来
5. 讲给同伴听，再改一处

## 五、提问卡
- 【观察层】你最先用了哪一种材料？它摸起来什么感觉？
- 【观察层】你作品里哪一处是最后定下来的？
- 【感受层】做的时候哪里最费劲儿？哪儿最开心？
- 【联想层】它让你想起谁、想起什么地方？
- 【联想层】如果它会发出声音，会是什么声音？
- 【表达层】给它取个名字吧，为什么叫这个？
- 【表达层】它想对大家说一句什么话？
- 【表达层】把这句话折成两三行，就是一首小诗。

## 六、课堂组织建议
- **空间**：${venue === '户外院落' ? '户外围坐成圈，材料放中央篮子里，随用随取' : venue === '活动室' ? '分岛式布局，每组一张桌子，展示区靠墙' : '课桌拼成 4—6 组，预留一条“展示走廊”'}。
- **时间预案**：若课时不够，优先压缩教师讲解，**保留「物成言立」的表达环节**（可顺延到下课前快速进行）。
- **孩子不动手**：先递一种最有趣的材料请他“只摸不做”；仍不动手则任命为“记录员”。
- **孩子说“我不会”**：回应“不用会做，先做你现在的样子”，并给半成品支架。
- **抢材料**：设“材料长”岗位，用“轮流取一样”的规则替代哄抢。

## 七、三维观察要点
- **身体参与**：动作投入时长、精细动作（撕/剪/捏）的熟练度、操作节奏是否从容。
- **环境参与**：与材料的互动方式（试探/探索/改造）、与同伴的互助与讲述次数。
- **生成性**：是否出现超出示范的改法、“编错—重来”的调整痕迹、语言表达是否超出教师预设。

## 八、时间分配
【时间分配】触材启思 ${P1}%｜手运心生 ${P2}%｜物成言立 ${P3}%｜评鉴生新 ${P4}%`;
    },

    scaffold(text) {
      const brief = text.replace(/孩子|作品|手工|完成|说|捏|剪|贴|做/g, (w) => w).slice(0, 60);
      return `## 一、作品的可能解读
针对您描述的这件作品（“${brief}…”），先给出三种**假设性**解读，供您观察验证——儿童的作品常常比我们能读到的更丰富：
1. **从材料看**：孩子选择的材料往往指向他最熟悉的经验，也许这件作品里有他自己都没说出口的记忆。
2. **从造型看**：比例、位置与重复方式常带着情绪的印记——夸大的部分通常最重要。
3. **从过程看**：如果孩子反复改过某一处，那里多半藏着他的“主意”，是生成性最强的部分。

## 二、层层递进提问卡
**观察层**
- “你这儿用的是什么材料？它原来是什么样的？”（降阶：指一指你最喜欢的这一处）
- “哪一部分是最先做的？”（降阶：我们先看看它的边边角角）
**感受层**
- “捏/贴它的时候，手上是什么感觉？心里呢？”（降阶：做它是费劲还是痛快？）
- “做到哪儿的时候你最得意？”（降阶：笑一个/皱个眉，告诉我哪里）
**联想层**
- “它让你想起谁？想起一件事吗？”（降阶：它像家里的什么？）
- “如果它在一个故事里，那是在早上还是晚上？”（降阶：给它选个颜色，哪种？）
**表达层**
- “给它取个名字吧。”（降阶：一个词就行）
- “它想对看它的每一个人说一句什么话？”（降阶：我替它说一句，你接着说）

## 三、命名支架
1. **把最费劲儿的地方变成名字**：“这块你改了三次，就叫‘三次才站住的地方’好不好？”
2. **用材料命名**：“这是‘泥巴爷爷’——名字里先放进他最在乎的那个词。”
3. **留一半给孩子**：“它叫‘会____的____’，这两个空你填。”

## 四、讲述支架
- 教师示范一句：“我的作品叫《名字》，它最特别的是……”
- 儿童接一句：只讲一处，不贪多。
- 同伴追问一句：“你刚才说____，那它是怎么来的？”
- 先说后写：允许方言，珍视稚拙；**孩子的原话原样记录**，这是“身体语言编码”最珍贵的证据。

## 五、题诗支架（降阶梯）
1. **一个词**：孩子说出的最有分量的那个词（如“爷爷”）。
2. **一句大白话**：把词放进句子里——“这是我爷爷，他天天笑嘻嘻的。”
3. **折成两三行**：
> 泥巴爷爷
> 笑嘻嘻的
> 他每天看着我放学回家
教师只做“折行”，**绝不用成人标准改字句**。

## 六、教师回应示例（具体化、不评判）
- “你把他的嘴捏得往上翘，我一看见就想笑。”
- “这块泥比别的地方厚，捏的时候是不是很用力？”
- “你给他插了根树枝，像爷爷手里的烟斗。”
- “你说到爷爷的时候，手停了一下。”
- “名字是你自己想的，这个词我们谁也想不出来。”

## 七、观察记录提示
- **身体参与**：操作时手部动作的精细度、讲述时是否配合手势。
- **环境参与**：讲述时看向谁、是否主动把作品举给同伴看。
- **生成性**：命名/讲述中是否出现教师从未提供的词——那是本次课的“生成证据”，请原句记录。`;
    },

    iterate(text) {
      const frag = (kw) => text.slice(0, 24) || '（本次记录未提及，建议下次定向观察）';
      return `## 一、三维诊断
### 身体参与
- **亮点**：孩子们整体投入操作（依据您的记录：“${frag()}”），动作卷入度不错。
- **不足**：操作偏兴奋、节奏偏快，精细动作停留不足。
- **判断**：身体通道是打开的，但“慢下来”的身体经验不够。

### 环境参与
- **亮点**：材料对孩子有真实吸引力。
- **不足**：您提到“材料抢成一团”——材料分发规则缺失，同伴互动被竞争替代。
- **判断**：环境参与有热度、缺秩序，互动质量被消耗。

### 生成性
- **亮点**：从您描述看，个别孩子有改法与想法。
- **不足**：“没人愿意说话”说明语言通道尚未接通，生成停在手上、没到嘴上。
- **判断**：物已成型，言未立——下一课的核心任务是把身体语言转码为文学语言。

## 二、下一节课调整建议（3 条，明天就能执行）
1. **针对环境参与**：设“材料长”岗位（每组 1 人，大孩子担任），材料分装到小篮随用随取——把“抢”变成“管”。
2. **针对生成性**：开 5 分钟“作品发布会”——每人只说一句“我的作品叫____”，教师原句记录上墙，**先求有话、再求有话好说**。
3. **针对身体参与**：保留“闭目摸材料”环节并延长到 3 分钟，用慢动作把节奏降下来，为表达蓄力。

## 三、修改后教案要点
- 触材启思 10′ → **加“摸材料说感觉”轮流发言**；
- 手运心生 30′ → 材料分装 + 步骤卡上增加“做完想一想：它像谁？”；
- 物成言立 15′ → 新增“一句话发布会”，教师只做记录者；
- 评鉴生新 10′ → 量规第一条改为“它的名字让我记住了它”。

## 四、给教师的三个自我提问
1. 这节课里，哪一个孩子的哪句话是我没想到的？
2. 我是在“教做法”，还是在“等生成”？证据是什么？
3. 如果删掉我的一个讲解环节，孩子们会失去什么、又会多出什么？

## 五、一句话鼓励
您能同时看见“孩子们玩得很投入”和“没人说话”这两个事实，说明您已经在用“身体—环境—生成”的眼光看课堂了——这就是迭代最需要的起点。`;
    },

    general(text) {
      if (/四阶|模式|环节/.test(text)) {
        return `## 四阶课程模式
我们的课程严格遵循“四阶递进”结构：
1. **触材启思**——开放性材料唤醒感觉经验，未成词而先有象；
2. **手运心生**——身体充分卷入操作，教师最少干预、搭建支架；
3. **物成言立**——命名、讲述、题诗，先说后写，完成身体语言向文学语言的转码；
4. **评鉴生新**——量规互评、二次创作、展示迭代。
四个环节环环相扣：前两阶让身体与材料说话，后两阶让语言与评价生长。您可以点开「课前·课程适配」，我会按这个模式为您生成完整教案。`;
      }
      if (/三维|观察|框架|诊断|指标/.test(text)) {
        return `## 三维课堂观察框架
“身体语言编码”被操作化为三个可观测维度：
- **身体参与**：动作投入度、精细度与节奏；
- **环境参与**：与材料、同伴、空间的情境互动；
- **生成性**：创作方案的涌现、调整与重构。
课中用它记录，课后用它诊断——把您的课堂观察发给我，我会按这三维给您具体的迭代建议。`;
      }
      if (/材料|没有|买|资源|替代/.test(text)) {
        const rows = Object.entries(DB.materialKB).map(([k, v]) => `| ${k} | ${v.alt} | ${v.note} |`).join('\n');
        return `## 乡镇低资源材料方案
没有美术材料，恰恰是具身课程最好的起点。我们的替代原则：**零成本、就地取材、多义开放**。
| 常规材料 | 零成本替代 | 提示 |
|---|---|---|
${rows}
记住一句话：**材料越开放，孩子越自由**——旧报纸的一行字，可能比一包彩纸更有诗意。需要的话，把您手头的材料告诉我，我为您生成一节课。`;
      }
      if (/不会|不敢|不愿意|表达|说话|内向/.test(text)) {
        return `## 孩子说“我不会”的时候
“我不会”往往不是能力问题，而是**表达通道还没打开**。三步回应：
1. **接住情绪**：“不用会做，先做你现在的样子。”
2. **降阶任务**：从“做一个”降到“撕一块、摆一下”；给半成品支架，只示范技法不示范成品。
3. **改问身体**：不问“你想做什么”，改问“这块材料摸起来像什么”——从身体感觉进入，绕开“对错焦虑”。
儿童的表达先从手开始，再到嘴、到笔。给他时间，也给他一个没有标准答案的任务。`;
      }
      if (/编码|矩阵|作品.*(分析|评价)/.test(text)) {
        return `## 学生作品矩阵编码规程
我们对三地学生作品进行 1—5 级回溯编码，四个维度：
- **意象**：材料是否生成超越实物的意象；
- **结构**：构图 / 构造的组织性与完成度；
- **语言**：命名、题诗、讲述的表达质量；
- **独创性**：方案的非常规程度与个人印记。
评分者经统一培训、独立评分。当前已有 ${DB.works.length} 件示例作品入库，您可以在「作品数据库」页查看编码示例。`;
      }
      if (/进展|项目|研究|团队|文欣/.test(text)) {
        const doing = DB.stages.filter((s) => s.status === 'doing').map((s) => `${s.name}（${s.span}）`).join('；');
        return `## 项目进展
${DB.project.parent}——${DB.project.parentSub}
当前进行中：**${doing}**。三地（宜昌远安、咸宁崇阳白霓、武汉新洲）暑期实践资料正回溯编码入库，已有 ${DB.works.length} 件作品、${DB.lessons.length} 份教案入库。智能体将持续吸收新的教案与规则文档，变得越来越“懂”乡镇课堂。`;
      }
      return `您好，我是手启心言。我主要可以帮您三件事：
1. **课前·低资源课程适配**——告诉我年龄、人数、课时、材料、场地，生成四阶模式完整教案；
2. **课中·表达支架**——描述孩子的作品，我给您层层递进的提问卡与命名、讲述、题诗支架；
3. **课后·课堂迭代**——把课堂观察发给我，我按“身体参与—环境参与—生成性”三维诊断。
也可以问我四阶模式、三维框架、材料替代、作品编码等项目问题。我们从哪一件开始？`;
    },
  };

  function offlineReply(text) {
    let body;
    if (mode === 'plan') body = Offline.plan(text);
    else if (mode === 'scaffold') body = Offline.scaffold(text);
    else if (mode === 'iterate') body = Offline.iterate(text);
    else body = Offline.general(text);
    if (!offlineNoted) {
      offlineNoted = true;
      return '> ⚠️ 模型接口暂时不可达，已进入**离线演示模式**：以下由内置规则引擎基于项目知识库生成，接入模型后将获得更完整的生成内容。\n\n' + body;
    }
    return body;
  }

  /* ═══════════ 发送与接收 ═══════════ */
  function systemNow() {
    let s = SYS_PROMPT + '\n\n' + projectContext();
    if (MODE_PROMPTS[mode]) s += '\n\n' + MODE_PROMPTS[mode];
    return s;
  }

  async function runLLM() {
    const s = active();
    const history = s.msgs.filter((m) => m.content);
    busy = true;
    renderMessages(); renderModeChips();
    const idx = s.msgs.length - 1;
    try {
      await callLLM(systemNow(), history, (full) => {
        s.msgs[idx].content = full;
        updateLastBubble(full);
      });
      if (!s.msgs[idx].content) s.msgs[idx].content = '（刚才走神了，请再问一次）';
    } catch (e) {
      console.warn('[手启心言] 接口调用失败，降级为本地引擎：', e.message);
      const lastUser = [...history].reverse().find((m) => m.role === 'user');
      const fallback = offlineReply(lastUser ? lastUser.content : '');
      // 离线引擎逐段“打字”输出，保持演示质感
      const chunks = fallback.match(/[\s\S]{1,24}/g) || [fallback];
      let acc = '';
      for (const c of chunks) {
        acc += c;
        s.msgs[idx].content = acc;
        updateLastBubble(acc);
        scrollBottom();
        await new Promise((r) => setTimeout(r, 18));
      }
    } finally {
      busy = false;
      s.updatedAt = Date.now();
      persist();
      renderMessages(); renderModeChips();
    }
  }

  function updateLastBubble(full) {
    const alloc = timeAllocBar(full);
    const last = $('#msgs .msg-ai:last-child .md');
    if (last) { last.innerHTML = MD.render(alloc ? alloc.clean : full); scrollBottom(); }
  }

  async function send(text, images) {
    text = (text || '').trim();
    images = images || [];
    if ((!text && !images.length) || busy) return;
    let s = active();
    if (!s) {
      s = { id: 's' + Date.now(), title: text ? text.slice(0, 18) : '作品照片分析', mode, msgs: [], createdAt: Date.now(), updatedAt: Date.now() };
      sessions.unshift(s); activeId = s.id;
    }
    s.mode = mode;
    s.msgs.push({ role: 'user', content: text, images });
    s.msgs.push({ role: 'assistant', content: '' });
    $('#input').value = '';
    autoGrow();
    clearAttachments();
    renderMessages(); renderHistory();
    await runLLM();
  }

  /* ═══════════ 附件 ═══════════ */
  function renderAttach() {
    const box = $('#attachPreviews');
    box.style.display = attachments.length ? 'flex' : 'none';
    box.innerHTML = attachments.map((a, i) => `
      <div class="attach-thumb">
        <img src="${a.dataUrl}" alt="">
        <button class="rm" data-rm="${i}">✕</button>
        <div class="ocr-tag">OCR 识别</div>
      </div>`).join('');
  }
  function clearAttachments() { attachments = []; renderAttach(); }
  $('#btnAttach').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (e) => {
    [...e.target.files].slice(0, 4).forEach((f) => {
      const r = new FileReader();
      r.onload = () => {
        // 压缩过大的图片，避免撑爆 localStorage 与请求体
        const img = new Image();
        img.onload = () => {
          const cv = document.createElement('canvas');
          const scale = Math.min(1, 640 / Math.max(img.width, img.height));
          cv.width = img.width * scale; cv.height = img.height * scale;
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          attachments.push({ name: f.name, dataUrl: cv.toDataURL('image/jpeg', .72) });
          renderAttach();
        };
        img.src = r.result;
      };
      r.readAsDataURL(f);
    });
    e.target.value = '';
  });
  $('#attachPreviews').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]');
    if (b) { attachments.splice(+b.dataset.rm, 1); renderAttach(); }
  });

  /* ═══════════ 输入交互 ═══════════ */
  const input = $('#input');
  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(200, input.scrollHeight) + 'px';
    $('#btnSend').disabled = !(input.value.trim() || attachments.length) || busy;
  }
  input.addEventListener('input', autoGrow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value, attachments); }
  });
  $('#btnSend').addEventListener('click', () => send(input.value, attachments));

  /* 模式 chips */
  $('#modeChips').addEventListener('click', (e) => {
    const b = e.target.closest('.mode-chip'); if (!b || busy) return;
    if (b.id === 'chipPlanForm') { openOverlay('planOverlay'); return; }
    setMode(b.dataset.mode);
    input.focus();
  });

  /* 建议问题 */
  $('#suggests').addEventListener('click', (e) => {
    const b = e.target.closest('.suggest'); if (!b || busy) return;
    setMode(b.dataset.mode, true);
    send(b.dataset.q, []);
  });

  /* 消息操作 */
  $('#msgs').addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const s = active(); const m = s.msgs.filter((x) => x.role === 'assistant').pop();
      if (!m) return;
      if (act.dataset.act === 'copy') { await navigator.clipboard.writeText(m.content).catch(() => {}); toast('已复制到剪贴板'); }
      if (act.dataset.act === 'md') {
        const blob = new Blob([m.content], { type: 'text/markdown;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `手启心言-课程方案-${new Date().toISOString().slice(0, 10)}.md`;
        a.click(); URL.revokeObjectURL(a.href);
        toast('已导出 Markdown 文件');
      }
      if (act.dataset.act === 're') {
        // 删除最后一条 assistant 消息后重新生成
        s.msgs.pop();
        s.msgs.push({ role: 'assistant', content: '' });
        renderMessages();
        await runLLM();
      }
    }
  });

  /* 新对话 */
  function newChat() {
    if (busy) return;
    activeId = null;
    offlineNoted = false;
    renderMessages(); renderHistory();
    input.focus();
  }
  $('#btnNewTop').addEventListener('click', newChat);
  document.body.addEventListener('click', (e) => { if (e.target.closest('#railNewChat')) newChat(); });

  /* 历史点击 / 删除 */
  document.body.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      sessions = sessions.filter((s) => s.id !== del.dataset.del);
      if (activeId === del.dataset.del) activeId = null;
      persist(); renderMessages();
      return;
    }
    const item = e.target.closest('.hist-item');
    if (item && !busy) {
      activeId = item.dataset.id;
      const s = active();
      mode = s.mode || 'free';
      offlineNoted = true;
      renderModeChips(); renderHistory(); renderMessages();
    }
  });

  /* ═══════════ 课前适配表单 ═══════════ */
  const MAT_OPTS = ['旧报纸/广告单', '纸箱/瓦楞纸', '树叶树枝等自然物', '泥土/黏土', '碎布头/针线', '竹篾/稻草', '彩笔/颜料', '剪刀/胶水'];
  let pickedMats = ['旧报纸/广告单', '剪刀/胶水'];
  function renderMatPicks() {
    $('#matPicks').innerHTML = MAT_OPTS.map((m) =>
      `<button class="mat-pick ${pickedMats.includes(m) ? 'on' : ''}" data-m="${m}">${m}</button>`).join('');
  }
  renderMatPicks();
  $('#matPicks').addEventListener('click', (e) => {
    const b = e.target.closest('.mat-pick'); if (!b) return;
    pickedMats = pickedMats.includes(b.dataset.m) ? pickedMats.filter((x) => x !== b.dataset.m) : [...pickedMats, b.dataset.m];
    renderMatPicks();
  });
  $('#btnPlanGo').addEventListener('click', () => {
    const mats = [...pickedMats, $('#fCustom').value.trim()].filter(Boolean).join('、');
    const msg = `请为我生成一节具身化创意表达课程方案，条件如下：
- 儿童年龄：${$('#fAge').value}
- 人数：${$('#fCount').value} 人
- 课时：${$('#fDuration').value}
- 场地：${$('#fVenue').value}
- 现有材料：${mats}${$('#fTheme').value.trim() ? `\n- 期望主题：${$('#fTheme').value.trim()}` : ''}${$('#fRegion').value.trim() ? `\n- 地域与在地资源：${$('#fRegion').value.trim()}` : ''}
请严格按功能结构输出完整方案。`;
    closeOverlay('planOverlay');
    setMode('plan', true);
    send(msg, []);
  });

  /* ═══════════ 状态灯 ═══════════ */
  function setStatus(txt, off) {
    $('#statusText').textContent = txt;
    $('#statusPill').classList.toggle('off', !!off);
  }

  /* ═══════════ 启动 ═══════════ */
  function boot() {
    // 恢复上次的对话（刷新/重开页面后直接续聊）
    if (!activeId && sessions.length) activeId = sessions[0].id;
    const cur = active();
    if (cur && cur.mode) mode = cur.mode;
    renderModeChips();
    renderSuggests();
    renderHistory();
    renderMessages();
    autoGrow();
    setStatus('就绪');

    // URL 参数：?mode=plan|scaffold|iterate&q=...
    const url = new URL(location.href);
    const m = url.searchParams.get('mode');
    const q = url.searchParams.get('q');
    if (m && MODES.some((x) => x.id === m)) setMode(m, true);
    if (q) setTimeout(() => send(q, []), 350);

    // 顶栏「新对话」
    input.focus();
  }
  boot();
})();
