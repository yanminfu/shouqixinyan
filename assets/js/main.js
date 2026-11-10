/* 公共交互：SVG 图标库、侧栏渲染、进入动画、数据页渲染器 */
(function () {
  const I = (path, extra) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${path}</svg>`;

  window.ICONS = {
    hand: I('<path d="M18 11V6.5a1.5 1.5 0 0 0-3 0V11m0-5.5v-2a1.5 1.5 0 0 0-3 0V11m0-7.5a1.5 1.5 0 0 0-3 0V12m-3-4.5a1.5 1.5 0 0 1 3 0V15m-3-3.5a1.5 1.5 0 0 1 3 0V17a6 6 0 0 1-6 6h-1.4a2 2 0 0 1-1.6-.8L3.6 18.6a1.8 1.8 0 0 1 2.9-2.1L9 19"/>'),
    spark: I('<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2m0-12.8-2.2 2.2M7.8 16.2l-2.2 2.2"/><circle cx="12" cy="12" r="3.2"/>'),
    bot: I('<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4m0 0h-2m2 0h2"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/><path d="M2 13v3m20-3v3"/>'),
    palette: I('<path d="M12 3a9 9 0 1 0 0 18h1.2a2.8 2.8 0 0 0 1.9-4.9 2.8 2.8 0 0 1 2-4.7H19a3 3 0 0 0 3-3c0-3-4.5-5.4-10-5.4z"/><circle cx="7.5" cy="10.5" r="1.1" fill="currentColor"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1.1" fill="currentColor"/>'),
    book: I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
    ruler: I('<path d="M3 17 17 3l4 4L7 21l-4-4z"/><path d="m8 16 1.5-1.5M11 13l1.5-1.5M14 10l1.5-1.5M17 7l1.5-1.5"/>'),
    lib: I('<path d="m4 4 6 3v13l-6-3V4z"/><path d="m20 4-6 3v13l6-3V4z"/><path d="M10 7h4v13h-4z"/>'),
    send: I('<path d="M12 19V5m0 0-6 6m6-6 6 6"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    copy: I('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    check: I('<path d="M20 6 9 17l-5-5"/>'),
    download: I('<path d="M12 4v12m0 0 5-5m-5 5-5-5"/><path d="M4 19h16"/>'),
    refresh: I('<path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/>'),
    clip: I('<path d="m21.4 11.05-8.5 8.51a5.5 5.5 0 0 1-7.78-7.78l8.5-8.51a3.67 3.67 0 0 1 5.19 5.19l-8.5 8.5a1.83 1.83 0 0 1-2.59-2.59l7.93-7.93"/>'),
    chat: I('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
    home: I('<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z"/><path d="M9 22V12h6v10"/>'),
    gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    trash: I('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>'),
    x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
    scissors: I('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>'),
    leaf: I('<path d="M11 20A7 7 0 0 1 4 13c0-4 3-8 9-9 5-1 7-1 7-1s0 2-1 7c-1 6-5 9-8 10z"/><path d="M4 21c4-4 6-6 10-9"/>'),
    pen: I('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
    heart: I('<path d="M19 14c1.5-1.5 2-3 2-4.5A4.5 4.5 0 0 0 16.5 5c-1.7 0-3 .9-4.5 2.5C10.5 5.9 9.2 5 7.5 5A4.5 4.5 0 0 0 3 9.5c0 1.5.5 3 2 4.5l7 7z"/>'),
    eye: I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
    users: I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    bulb: I('<path d="M9 18h6m-5 3h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>'),
    star: I('<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'),
    package: I('<path d="M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>'),
    msgHeart: I('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/>'),
    note: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8m8 4H8m2-8H8"/>'),
    cap: I('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>'),
  };

  /* ── 侧栏 ── */
  const NAV = [
    { href: 'index.html', label: '项目首页', icon: 'home' },
    { href: 'agent.html', label: '手启心言', icon: 'bot', badge: '智能体' },
    { href: 'works.html', label: '作品数据库', icon: 'palette' },
    { href: 'lessons.html', label: '教案库', icon: 'book' },
    { href: 'tools.html', label: '研究工具库', icon: 'ruler' },
    { href: 'refs.html', label: '文献库', icon: 'lib' },
    { href: 'changelog.html', label: '更新日志', icon: 'refresh' },
  ];

  window.renderRail = function (active, opts) {
    opts = opts || {};
    const links = NAV.map((n) => `
      <a class="rail-link ${active === n.href ? 'active' : ''}" href="${n.href}">
        ${ICONS[n.icon]}<span>${n.label}</span>${n.badge ? `<span class="rail-badge">${n.badge}</span>` : ''}
      </a>`).join('');
    const news = ((window.DB && DB.news) || []).slice(0, 3).map((x) => `
      <div class="rn-item"><b>${MD.esc(x.title)}</b><span>${x.src} · ${x.date}</span></div>`).join('');
    return `
      <aside class="rail">
        <a class="rail-brand" href="index.html">
          <div class="brand-mark">${ICONS.hand}</div>
          <div><div class="brand-name">手启心言</div><div class="brand-sub">具身化创意表达课程智能体</div></div>
        </a>
        ${opts.newChat ? `<button class="rail-newchat" id="railNewChat">${ICONS.plus} 开启新对话</button>` : ''}
        ${opts.historySlot ? '<nav class="rail-history" id="railHistory"><h6>对话记录</h6><div id="histList"></div></nav>' : `<nav class="rail-nav">${links}</nav>`}
        ${opts.navLinks !== false && opts.historySlot ? `<nav class="rail-nav" style="border-top:1px dashed var(--line);padding-top:10px;margin-top:4px">${links}</nav>` : ''}
        <div class="rail-news">
          <h6><span class="pulse"></span>美育快讯</h6>
          ${news}
          <div class="rn-note">素材来自公开教育新闻，仅作教研参考</div>
        </div>
        <div class="rail-foot">
          <b>华中师范大学文学院</b><br>
          文欣杯项目实践衍生品<br>
          指导老师：江雪
        </div>
      </aside>`;
  };

  window.renderMobileTop = function (active) {
    return `<div class="mobile-top">
      <a href="index.html" class="brand-mark">${ICONS.hand}</a><b>手启心言</b>
      <nav>${NAV.map((n) => `<a href="${n.href}" class="${active === n.href ? 'active' : ''}">${n.label.replace('数据库', '').replace('研究工具库', '工具')}</a>`).join('')}</nav>
    </div>`;
  };

  /* ── 进入动画（scroll 驱动，不依赖 IntersectionObserver，兼容所有环境） ── */
  window.initReveal = function () {
    const els = Array.from(document.querySelectorAll('.rv'));
    if (!els.length) return;
    const check = () => {
      const line = window.innerHeight * 0.94;
      els.forEach((el) => {
        if (!el.classList.contains('in') && el.getBoundingClientRect().top < line) el.classList.add('in');
      });
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    setTimeout(check, 400);
  };

  /* ── 页脚 ── */
  window.renderFooter = function () {
    return `<footer class="footer"><div class="wrap">
      <div class="footer-grid">
        <div>
          <div class="brand-line"><div class="brand-mark" style="width:36px;height:36px;border-radius:11px">${ICONS.hand}</div>
            <div><b class="serif" style="letter-spacing:.12em">手启心言</b><div style="font-size:11px;color:var(--ink-faint)">面向乡镇学校的具身化创意表达课程实施智能体</div></div></div>
          <p>本作品为文学院「文欣杯」项目《以手启思，以身达意》的实践衍生品，服务缺乏专业美育师资的乡镇托管班教师与支教志愿者。站内作品均已化名，素材来自项目组真实实践。</p>
        </div>
        <div class="footer-links">
          <div><h5>站内</h5>
            <a href="agent.html">手启心言智能体</a><a href="works.html">作品数据库</a>
            <a href="lessons.html">教案库</a><a href="tools.html">研究工具库</a><a href="refs.html">文献库</a>
            <a href="changelog.html">更新日志</a>
          </div>
          <div><h5>项目</h5>
            <a href="index.html#four">四阶课程模式</a><a href="index.html#dims">三维观察框架</a>
            <a href="index.html#flow">课前·课中·课后</a><a href="index.html#sites">三地实践</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 手启心言项目组 · 华中师范大学文学院</span>
        <span>比赛版本 v4.0 · 2026.11.09</span>
      </div>
    </div></footer>`;
  };

  /* ── 数据页渲染 ── */
  window.renderWorks = function () {
    const grid = document.getElementById('worksGrid');
    const state = { site: '全部', type: '全部', sort: '默认' };

    function apply() {
      let list = DB.works.filter((w) =>
        (state.site === '全部' || w.site === state.site) &&
        (state.type === '全部' || w.type === state.type));
      if (state.sort === '独创性') list = [...list].sort((a, b) => b.coding.独创性 - a.coding.独创性);
      if (state.sort === '意象') list = [...list].sort((a, b) => b.coding.意象 - a.coding.意象);
      document.getElementById('worksCount').textContent = `共 ${list.length} 件`;
      grid.innerHTML = list.map((w) => `
        <article class="card card-hover work-card rv">
          <div class="work-top"><span class="work-id">${w.id} · ${w.date}</span></div>
          <h3>《${w.title}》</h3>
          <div class="work-meta">${w.site} ｜ ${w.author}（${w.grade}）｜ ${w.type}</div>
          <div class="work-mat">材料：${w.materials}</div>
          <div class="work-voice">${MD.esc(w.voice)}</div>
          <div class="work-code">${Object.entries(w.coding).map(([k, v]) => `
            <div class="code-cell"><span>${k}</span><div class="code-bar"><i data-w="${v * 20}"></i></div></div>`).join('')}
          </div>
          <div class="work-tags">${w.tags.map((t) => `<span class="work-tag">${t}</span>`).join('')}</div>
        </article>`).join('') || '<div class="empty-tip">没有符合条件的作品</div>';
      requestAnimationFrame(() => grid.querySelectorAll('.code-bar i').forEach((i) => { i.style.width = i.dataset.w + '%'; }));
      grid.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
    }

    const bar = document.getElementById('worksFilter');
    bar.innerHTML = `
      <span class="filter-label">地点</span>
      ${['全部', ...DB.siteNames].map((s) => `<button class="fchip ${s === '全部' ? 'on' : ''}" data-k="site" data-v="${s}">${s}</button>`).join('')}
      <span class="filter-label" style="margin-left:10px">课型</span>
      ${['全部', ...DB.workTypes].map((s) => `<button class="fchip ${s === '全部' ? 'on' : ''}" data-k="type" data-v="${s}">${s}</button>`).join('')}
      <span class="filter-label" style="margin-left:10px">排序</span>
      ${['默认', '独创性', '意象'].map((s) => `<button class="fchip ${s === '默认' ? 'on' : ''}" data-k="sort" data-v="${s}">${s}</button>`).join('')}
      <span class="filter-count" id="worksCount"></span>`;
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('.fchip'); if (!b) return;
      state[b.dataset.k] = b.dataset.v;
      bar.querySelectorAll(`.fchip[data-k="${b.dataset.k}"]`).forEach((x) => x.classList.toggle('on', x === b));
      apply();
    });
    apply();
  };

  window.renderLessons = function () {
    const wrap = document.getElementById('lessonList');
    wrap.innerHTML = DB.lessons.map((l, idx) => `
      <article class="card card-hover lesson-card rv rv-d${(idx % 3) + 1}">
        <div class="lesson-head">
          <span class="lesson-id">${l.id}</span>
          <div style="flex:1;min-width:220px">
            <h3>《${l.title}》</h3>
            <div class="lesson-metas">
              <span class="chip chip-teal">${l.type}</span><span class="chip">${l.grades}</span><span class="chip chip-amber">${l.duration}</span>
            </div>
          </div>
        </div>
        <div class="lesson-goal"><b>课程目标：</b>${l.goal}</div>
        <div class="lesson-steps">${l.steps.map((s, i) => `
          <div class="lstep"><i>环节 ${['一', '二', '三', '四'][i]}</i><b>${s.name}</b><p>${s.detail}</p></div>`).join('')}
        </div>
        <div class="lesson-mats">${l.materials.map((m) => `<span class="chip">${m}</span>`).join('')}</div>
        <div class="lesson-tip"><b>实施提示：</b>${l.tip}</div>
      </article>`).join('');
    initReveal();
  };

  window.renderTools = function () {
    const grid = document.getElementById('toolsGrid');
    const icons = { 观察量表: 'eye', 编码规程: 'lib', 测验工具: 'bulb', 问卷: 'note', 访谈提纲: 'chat', 规程: 'ruler' };
    const stMap = { 研制中: 'st-doing', 已引进: 'st-done', 待启动: 'st-todo' };
    grid.innerHTML = DB.tools.map((t, i) => `
      <article class="card card-hover tool-card rv rv-d${(i % 2) + 1}">
        <div class="tool-head">
          <div class="tool-ico">${ICONS[icons[t.kind] || 'ruler']}</div>
          <h3>${t.name}</h3>
          <span class="tool-status ${stMap[t.status]}">${t.status}</span>
        </div>
        <p>${t.desc}</p>
        <ul class="tool-items">${t.items.map((x) => `<li>${x}</li>`).join('')}</ul>
      </article>`).join('');
    initReveal();
  };

  window.renderRefs = function () {
    const wrap = document.getElementById('refsWrap');
    const kinds = ['具身认知', '创造力测评', '双重编码', '政策文件'];
    const colors = { 具身认知: 'var(--teal)', 创造力测评: 'var(--terra)', 双重编码: 'var(--amber)', 政策文件: 'var(--teal-mid)' };
    let no = 1;
    wrap.innerHTML = kinds.map((k) => {
      const list = DB.references.filter((r) => r.kind === k);
      return `<div class="refs-group rv">
        <h3><span class="n" style="background:${colors[k]}">${k}</span>共 ${list.length} 条</h3>
        ${list.map((r) => `<div class="ref-item"><span class="no">[${no++}]</span><span>${r.cite}</span></div>`).join('')}
      </div>`;
    }).join('');
    initReveal();
  };
})();
