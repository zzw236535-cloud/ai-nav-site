/* ============================================================
 * app.js — 应用主逻辑（路由 / 前台 / 广告 / 后台 / 统计）
 * 纯原生 JS，无构建、无依赖，双击 index.html 即可运行。
 * 数据持久化使用 localStorage。
 * ============================================================ */
(function () {
  'use strict';

  const D = window.NAV_DATA;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- 工具函数 ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const uid = (p) => (p || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  const nowDate = () => new Date().toISOString().slice(0, 10);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // 北京时间 YYYY-MM-DDTHH:mm
  function beijingNow() {
    const parts = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const g = (t) => parts.find(p => p.type === t).value;
    return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;
  }

  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), ms || 2200);
  }

  /* ---------- 状态与持久化 ---------- */
  const LS = {
    tools: 'nav.tools', cats: 'nav.cats', plans: 'nav.plans', subs: 'nav.subs',
    favs: 'nav.favs', stats: 'nav.stats', config: 'nav.config', auth: 'nav.auth'
  };
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : clone(fallback); }
    catch (e) { return clone(fallback); }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { toast('本地存储写入失败，可能空间已满'); }
  }

  const S = {
    tools: load(LS.tools, D.TOOLS),
    cats: load(LS.cats, D.CATEGORIES),
    plans: load(LS.plans, D.AD_PLANS),
    subs: load(LS.subs, []),
    favs: load(LS.favs, []),
    stats: load(LS.stats, []),            // {ts,date,slot,planId,type:'view'|'click'}
    config: load(LS.config, D.SITE_CONFIG),
    logged: load(LS.auth, false),
    // 运行时（不持久化）
    route: null,
    filters: { cat: '', q: '', sort: 'featured' },
    adChosen: {},        // 一次页面访问内广告素材保持稳定
    observers: []
  };
  const persist = {
    tools: () => save(LS.tools, S.tools), cats: () => save(LS.cats, S.cats),
    plans: () => save(LS.plans, S.plans), subs: () => save(LS.subs, S.subs),
    favs: () => save(LS.favs, S.favs), stats: () => save(LS.stats, S.stats),
    config: () => save(LS.config, S.config), auth: () => save(LS.auth, S.logged)
  };

  const activeTools = () => S.tools.filter(t => t.status === 'on');
  const activeCats = () => S.cats.filter(c => c.status === 'on').sort((a, b) => a.order - b.order);
  const catName = (id) => (S.cats.find(c => c.id === id) || {}).name || id;

  /* ---------- 广告引擎 ---------- */
  function planValid(p, now) {
    if (p.status !== 'active') return false;
    if (p.start && p.start > now) return false;     // 未来计划不上线
    if (p.end && p.end < now) return false;          // 到期下线
    return true;
  }
  function pickAd(slot, page) {
    const now = beijingNow();
    const key = slot + '|' + page;
    if (S.adChosen[key] !== undefined) return S.adChosen[key]; // 同一页面访问内保持不变
    const valid = S.plans.filter(p => p.slot === slot && p.page === page && planValid(p, now));
    let chosen = null;
    if (valid.length) {
      const max = Math.max(...valid.map(p => Number(p.priority) || 0));
      const top = valid.filter(p => (Number(p.priority) || 0) === max);
      chosen = top[Math.floor(Math.random() * top.length)];    // 同优先级等概率
    }
    S.adChosen[key] = chosen;
    return chosen;
  }
  function recordStat(planId, slot, type) {
    S.stats.push({ ts: Date.now(), date: beijingNow().slice(0, 10), slot, planId, type });
    if (S.stats.length > 5000) S.stats = S.stats.slice(-3000);
    persist.stats();
  }
  // 广告展示统计：至少 50% 面积可见连续 1 秒，同一页面实例只计一次
  function setupAdObserver() {
    S.observers.forEach(o => o.disconnect());
    S.observers = [];
    const timers = new WeakMap();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const el = e.target;
        if (e.intersectionRatio >= 0.5 && document.visibilityState === 'visible') {
          if (!timers.has(el)) {
            const t = setTimeout(() => {
              timers.delete(el);
              if (el.dataset.counted) return;
              el.dataset.counted = '1';
              recordStat(el.dataset.plan, el.dataset.slot, 'view');
            }, 1000);
            timers.set(el, t);
          }
        } else {
          const t = timers.get(el);
          if (t) { clearTimeout(t); timers.delete(el); }
        }
      });
    }, { threshold: [0, 0.5, 1] });
    $$('[data-ad-impression]').forEach(el => io.observe(el));
    S.observers.push(io);
  }

  // 广告位 HTML 片段
  function bannerHTML(slot, page, extraCls) {
    const p = pickAd(slot, page);
    if (!p) return '';
    const mobile = window.innerWidth <= 640;
    const size = mobile ? p.mobileSize : p.desktopSize;
    return `
      <div class="ad-banner ${extraCls || ''}" style="background:${esc(p.bg || 'linear-gradient(120deg,#232a3a,#2a2340)')}"
           data-ad-impression data-plan="${esc(p.id)}" data-slot="${esc(p.slot)}">
        <span class="ad-label">广告</span>
        <div class="ad-body">
          <div class="ad-kicker">${esc(p.brand || '赞助商')} · 推荐 &nbsp;|&nbsp; ${esc(size || '')}</div>
          <div class="ad-title">${esc(p.title)}</div>
          <div class="ad-desc">${esc(p.desc || '')}</div>
        </div>
        <span class="ad-cta btn btn-outline btn-sm">了解更多 →</span>
        <a class="ad-hit" href="${esc(p.link || '#')}" target="_blank" rel="noopener noreferrer sponsored"
           data-ad-click data-plan="${esc(p.id)}" data-slot="${esc(p.slot)}" aria-label="广告：${esc(p.title)}"></a>
      </div>`;
  }
  function sponsorCardHTML() {
    const p = pickAd('B', 'list');
    if (!p) return '';
    return `
      <div class="tool-card sponsor" data-ad-impression data-plan="${esc(p.id)}" data-slot="B">
        <span class="sponsor-badge">赞助</span>
        <div class="top">
          <div class="tool-logo" style="font-size:20px">${esc((p.brand || '广').slice(0, 1))}</div>
          <div class="tool-head">
            <div class="tool-name">${esc(p.title)}</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">${esc(p.brand || '赞助商')} · 广告</div>
          </div>
        </div>
        <div class="tool-summary">${esc(p.desc || '')}</div>
        <div class="tag-row"><span class="tag">广告 · 128×128 图标位</span></div>
        <div class="tool-foot"><a class="btn btn-outline btn-block" href="${esc(p.link || '#')}"
             target="_blank" rel="noopener noreferrer sponsored" data-ad-click data-plan="${esc(p.id)}" data-slot="B">访问赞助商 ↗</a></div>
      </div>`;
  }

  /* ---------- 工具卡片 ---------- */
  function favBtnHTML(id) {
    const on = S.favs.includes(id);
    return `<button class="fav-btn ${on ? 'faved' : ''}" data-fav="${esc(id)}" title="${on ? '取消收藏' : '收藏'}"
             aria-label="${on ? '取消收藏' : '收藏'}">${on ? '★' : '☆'}</button>`;
  }
  function toolCardHTML(t, withCat) {
    const tags = (t.tags || []).slice(0, 3).map(x => `<span class="tag">${esc(x)}</span>`).join('');
    const cats = withCat && t.cats ? t.cats.slice(0, 2).map(c => `<span class="tag cat-tag">${esc(catName(c))}</span>`).join('') : '';
    const verified = (t.verifiedAt || '') >= nowDate().slice(0, 4) + '-01' ? '<span class="verified" title="信息已核对">✓</span>' : '';
    return `
      <article class="tool-card">
        <div class="top">
          <div class="tool-logo">${esc(t.icon || '🔧')}</div>
          <div class="tool-head">
            <div class="tool-name"><a href="#/tool/${esc(t.id)}" data-link>${esc(t.name)}</a>${verified}</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">${esc((t.cats || []).map(catName).join(' · '))}</div>
          </div>
        </div>
        <div class="tool-summary">${esc(t.summary)}</div>
        <div class="tag-row">${cats}${tags}</div>
        <div class="tool-foot">
          <a class="btn btn-primary btn-sm" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">访问官网 ↗</a>
          <a class="btn btn-outline btn-sm" href="#/tool/${esc(t.id)}" data-link>详情</a>
          ${favBtnHTML(t.id)}
        </div>
      </article>`;
  }

  /* ---------- 列表筛选与排序 ---------- */
  function filteredTools(base) {
    const { cat, q, sort } = S.filters;
    let list = base.filter(t => {
      const okCat = !cat || (t.cats || []).includes(cat);
      const hay = [t.name, t.summary, t.detail, ...(t.tags || []), ...(t.cats || []).map(catName)].join(' ').toLowerCase();
      const okQ = !q || hay.includes(q.toLowerCase());
      return okCat && okQ;
    });
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    else if (sort === 'recent') list.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.order - b.order || 0);
    return list;
  }
  function filterBarHTML(showCats) {
    const cats = activeCats();
    const catChips = showCats
      ? `<div class="group"><span class="filter-label">分类</span>
           <span class="chip ${!S.filters.cat ? 'active' : ''}" data-filter-cat="">全部</span>
           ${cats.map(c => `<span class="chip ${S.filters.cat === c.id ? 'active' : ''}" data-filter-cat="${esc(c.id)}">${esc(c.name)}</span>`).join('')}
         </div>`
      : '';
    return `
      <div class="filter-bar">
        ${catChips}
        <div class="group" style="margin-left:auto">
          <span class="filter-label">排序</span>
          <select class="sort-select" id="sortSelect">
            <option value="featured" ${S.filters.sort === 'featured' ? 'selected' : ''}>精选优先</option>
            <option value="name" ${S.filters.sort === 'name' ? 'selected' : ''}>名称排序</option>
            <option value="recent" ${S.filters.sort === 'recent' ? 'selected' : ''}>最近收录</option>
          </select>
        </div>
      </div>`;
  }
  function resultsHTML(list, opts) {
    opts = opts || {};
    const meta = `<div class="result-meta">共 <b style="color:var(--accent)">${list.length}</b> 个工具${S.filters.q ? ` · 关键词「${esc(S.filters.q)}」` : ''}</div>`;
    if (!list.length) {
      return `<div class="empty"><div class="big">🔎</div><h3>没有找到匹配的工具</h3>
        <p>试试更换关键词，或清除分类筛选。</p>
        <div><button class="btn btn-primary" data-clear-filter>清除筛选</button>
        <a class="btn btn-outline" href="#/" data-link>返回全部工具</a></div></div>`;
    }
    const cards = list.map(t => toolCardHTML(t, opts.withCat !== false)).join('');
    const sponsor = opts.sponsor ? sponsorCardHTML() : '';
    // 赞助位插在列表首位
    return meta + `<div class="tool-grid">${sponsor}${cards}</div>`;
  }

  /* ============================================================
   * 视图渲染
   * ============================================================ */

  function viewHome() {
    const cats = activeCats();
    const featured = activeTools().filter(t => t.featured).slice(0, 6);
    const latest = [...activeTools()].sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || '')).slice(0, 6);
    $('#app').innerHTML = `
      <section class="hero">
        <div class="container">
          <span class="hero-badge">🤖 收录 ${activeTools().length} 款 AI 工具 · ${cats.length} 大分类</span>
          <h1>发现好用的 <span class="accent">AI 工具</span></h1>
          <p>按分类浏览、搜索或收藏，一站直达官网。所有推荐均可核对，广告清晰标识。</p>
          <form class="search-box" id="heroSearch">
            <span class="search-icon">🔍</span>
            <input type="search" id="heroSearchInput" placeholder="搜索工具名称、简介或标签，如「文生图」「代码补全」…" autocomplete="off">
            <button type="submit" class="btn btn-primary btn-lg">搜索</button>
          </form>
          <div class="hero-stats">
            <div class="hero-stat"><b>${activeTools().length}</b><span>收录工具</span></div>
            <div class="hero-stat"><b>${cats.length}</b><span>精选分类</span></div>
            <div class="hero-stat"><b>${S.favs.length}</b><span>我的收藏</span></div>
          </div>
        </div>
      </section>

      <div class="container">${bannerHTML('A', 'home')}</div>

      <section class="section-tight">
        <div class="container">
          <div class="section-head"><div><div class="section-title">按分类浏览</div><div class="section-sub">一个工具可归属多个分类</div></div>
            <a class="link-more" href="#/categories" data-link>查看全部分类 →</a></div>
          <div class="cat-scroll"><div class="cat-pills">
            ${cats.map(c => `<a class="cat-pill" href="#/category/${esc(c.id)}" data-link><span class="ico">${esc(c.icon)}</span><span class="txt"><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></span></a>`).join('')}
          </div></div>
        </div>
      </section>

      <section class="section-tight">
        <div class="container">
          <div class="section-head"><div><div class="section-title">✨ 精选工具</div><div class="section-sub">编辑推荐的高质量工具</div></div></div>
          <div class="tool-grid">${featured.map(t => toolCardHTML(t)).join('')}</div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head"><div><div class="section-title">🕒 最近收录</div><div class="section-sub">持续更新，欢迎提交新工具</div></div>
            <a class="link-more" href="#/submit" data-link>提交工具 →</a></div>
          <div class="tool-grid">${latest.map(t => toolCardHTML(t)).join('')}</div>
        </div>
      </section>`;
    updateFavCount();
  }

  function viewCategories() {
    const cats = activeCats();
    const counts = {};
    activeTools().forEach(t => (t.cats || []).forEach(c => counts[c] = (counts[c] || 0) + 1));
    $('#app').innerHTML = `
      <div class="container">
        <div class="page-intro"><h1>全部分类</h1><p>共 ${cats.length} 个一级分类，覆盖工作、学习与创作场景</p></div>
        <div class="cat-grid">
          ${cats.map(c => `<a class="cat-card" href="#/category/${esc(c.id)}" data-link>
            <div class="ico">${esc(c.icon)}</div>
            <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
            <div class="meta"><span>${(c.tags || []).slice(0, 3).map(esc).join(' · ')}</span><b>${counts[c.id] || 0} 款</b></div>
          </a>`).join('')}
        </div>
      </div>`;
  }

  function viewCategory(id) {
    const cat = S.cats.find(c => c.id === id && c.status === 'on');
    if (!cat) return viewNotFound('分类不存在或已下线');
    const base = activeTools().filter(t => (t.cats || []).includes(id));
    S.filters.cat = id;
    const list = filteredTools(base);
    $('#app').innerHTML = `
      <div class="container">
        <div class="page-intro" style="text-align:left;padding-bottom:14px">
          <a href="#/categories" data-link style="color:var(--accent);font-size:13px">← 全部分类</a>
          <h1 style="margin-top:12px">${esc(cat.icon)} ${esc(cat.name)}</h1>
          <p>${esc(cat.desc)} · 标签：${(cat.tags || []).map(esc).join('、')}</p>
        </div>
        ${bannerHTML('C', 'category')}
        ${filterBarHTML(false)}
        <div id="resultArea">${resultsHTML(list, { sponsor: true, withCat: false })}</div>
      </div>`;
    updateFavCount();
  }

  function viewSearch(q) {
    S.filters.cat = '';
    S.filters.q = q || '';
    const list = filteredTools(activeTools());
    $('#app').innerHTML = `
      <div class="container">
        <div class="page-intro" style="text-align:left;padding-bottom:14px">
          <h1>搜索结果</h1><p>覆盖名称、简介与标签</p>
        </div>
        ${filterBarHTML(true)}
        <div id="resultArea">${resultsHTML(list, { sponsor: true })}</div>
      </div>`;
    updateFavCount();
  }

  function viewTool(id) {
    const t = S.tools.find(x => x.id === id && x.status === 'on');
    if (!t) return viewNotFound('工具不存在或已下架');
    const related = activeTools().filter(x => x.id !== id && x.cats && x.cats.some(c => (t.cats || []).includes(c))).slice(0, 3);
    $('#app').innerHTML = `
      <div class="container"><div class="detail-wrap">
        <div class="breadcrumb"><a href="#/" data-link>首页</a><span class="sep">›</span>
          <a href="#/category/${esc(t.cats[0])}" data-link>${esc(catName(t.cats[0]))}</a><span class="sep">›</span><span>${esc(t.name)}</span></div>
        <div class="detail-hero">
          <div class="tool-logo">${esc(t.icon || '🔧')}</div>
          <div style="flex:1">
            <h1>${esc(t.name)} ${(t.verifiedAt || '') >= nowDate().slice(0, 4) + '-01' ? '<span class="verified" title="信息已核对">✓ 已核对</span>' : ''}</h1>
            <div class="one-line">${esc(t.summary)}</div>
            <div class="tag-row" style="margin:12px 0 0">${(t.cats || []).map(c => `<a class="tag cat-tag" href="#/category/${esc(c)}" data-link>${esc(catName(c))}</a>`).join('')}${(t.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
            <div class="detail-actions">
              <a class="btn btn-primary btn-lg" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">访问官网 ↗</a>
              <button class="btn btn-outline btn-lg" data-fav="${esc(t.id)}">${S.favs.includes(t.id) ? '★ 已收藏' : '☆ 收藏工具'}</button>
            </div>
          </div>
        </div>

        <div class="detail-card"><h2><span class="bar"></span>工具简介</h2><p>${esc(t.detail || t.summary)}</p></div>

        <div class="detail-card"><h2><span class="bar"></span>主要功能</h2>
          <div class="feature-list">${(t.features || []).map(f => `<div class="feature-item"><span class="dot">●</span><span>${esc(f)}</span></div>`).join('') || '<p>暂无功能说明</p>'}</div>
        </div>

        <div class="detail-card"><h2><span class="bar"></span>适用场景</h2>
          <div class="feature-list">${(t.scenes || []).map(f => `<div class="feature-item"><span class="dot">◆</span><span>${esc(f)}</span></div>`).join('') || '<p>暂无场景说明</p>'}</div>
        </div>

        <div class="detail-card"><h2><span class="bar"></span>基本信息</h2>
          <table class="info-table">
            <tr><td>官网</td><td><a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">${esc(t.url)} ↗</a></td></tr>
            <tr><td>所属分类</td><td>${(t.cats || []).map(catName).map(esc).join(' · ')}</td></tr>
            <tr><td>标签</td><td>${(t.tags || []).map(esc).join('、')}</td></tr>
            <tr><td>定价参考</td><td>${esc(t.pricing || '未核实，请以官网为准')}</td></tr>
            <tr><td>最近核对</td><td>${esc(t.verifiedAt || '未记录')}</td></tr>
          </table>
        </div>

        ${related.length ? `<div class="detail-card"><h2><span class="bar"></span>相关工具</h2><div class="tool-grid">${related.map(x => toolCardHTML(x)).join('')}</div></div>` : ''}

        ${bannerHTML('D', 'detail', 'ad-detail')}
      </div></div>`;
    updateFavCount();
  }

  function viewFavorites() {
    const favTools = activeTools().filter(t => S.favs.includes(t.id));
    $('#app').innerHTML = `
      <div class="container">
        <div class="page-intro"><h1>⭐ 我的收藏</h1><p>收藏仅保存在当前浏览器，刷新后仍保留</p></div>
        <div class="alert alert-info">💡 收藏数据保存在本机浏览器中。清理浏览器数据或更换设备后不会自动同步。</div>
        ${favTools.length ? `<div class="tool-grid">${favTools.map(t => toolCardHTML(t)).join('')}</div>`
          : `<div class="empty"><div class="big">⭐</div><h3>还没有收藏任何工具</h3><p>在工具卡片点击 ☆ 即可收藏。</p><a class="btn btn-primary" href="#/" data-link>去发现工具</a></div>`}
      </div>`;
  }

  function viewSubmit() {
    $('#app').innerHTML = `
      <div class="container"><div class="form-page">
        <div class="page-intro"><h1>提交工具</h1><p>发现好工具？提交后进入审核队列，核对官网与内容后再发布</p></div>
        <div class="form-card">
          <div class="alert alert-info">提交内容将由运营者核对官网链接与信息，审核通过后才会出现在导航中。请勿提交测试或无效链接。</div>
          <form id="submitForm">
            <div class="form-group"><label>工具名称 <span class="req">*</span></label>
              <input class="form-control" name="name" required maxlength="40" placeholder="例如：AI 写作助手"></div>
            <div class="form-group"><label>官网链接 <span class="req">*</span></label>
              <input class="form-control" name="url" type="url" required placeholder="https://example.com">
              <div class="form-hint">仅接受 http/https 网页地址</div></div>
            <div class="form-group"><label>所属分类 <span class="req">*</span>（可多选）</label>
              <div class="check-group">${activeCats().map(c => `<label class="check-item"><input type="checkbox" name="cats" value="${esc(c.id)}"> ${esc(c.name)}</label>`).join('')}</div></div>
            <div class="form-row">
              <div class="form-group"><label>标签（逗号分隔）</label><input class="form-control" name="tags" placeholder="中文对话, 免费"></div>
              <div class="form-group"><label>图标（Emoji，可选）</label><input class="form-control" name="icon" maxlength="4" placeholder="🤖"></div>
            </div>
            <div class="form-group"><label>一句话简介 <span class="req">*</span></label>
              <input class="form-control" name="summary" required maxlength="80" placeholder="一句话说明工具用途"></div>
            <div class="form-group"><label>补充说明</label>
              <textarea class="form-control" name="detail" placeholder="主要功能、适用场景等（选填）"></textarea></div>
            <button type="submit" class="btn btn-primary btn-lg btn-block">提交审核</button>
          </form>
        </div>
      </div></div>`;
  }

  function viewBusiness() {
    const c = S.config;
    $('#app').innerHTML = `
      <div class="container">
        <div class="page-intro"><h1>商务合作</h1><p>广告形式、素材规格与投放流程</p></div>
        <div class="biz-grid">
          <div class="biz-card">
            <h3>📐 广告位与素材规格</h3>
            <div class="table-scroll"><table class="slot-table">
              <thead><tr><th>位置</th><th>展示规则</th><th>电脑素材</th><th>手机素材</th></tr></thead>
              <tbody>${D.AD_SLOTS.map(s => `<tr><td class="slot-code">${s.code}</td><td>${esc(s.name)}<br><span style="color:var(--text-3);font-size:12px">${esc(s.desc)}</span></td><td>${esc(s.desktop)}</td><td>${esc(s.mobile)}</td></tr>`).join('')}</tbody>
            </table></div>
            <div class="alert alert-warn" style="margin-top:16px;margin-bottom:0">广告统一带「广告 / 赞助」标识，点击在新标签页打开。同页首屏最多一个主要横幅；素材电脑与手机分别预览后投放。</div>
          </div>
          <div class="biz-card">
            <h3>🔄 合作流程</h3>
            <div class="steps">
              <div class="step">确认广告位、投放页面与周期</div>
              <div class="step">按规格提供电脑与手机素材及目标链接</div>
              <div class="step">运营者审核素材与链接，设置排期</div>
              <div class="step">后台预览后定时上线，到期自动下线</div>
              <div class="step">按日期、广告位与计划查看效果报表</div>
            </div>
            <h3 style="margin-top:24px">📊 统计口径</h3>
            <p style="color:var(--text-2);font-size:13.5px;line-height:1.8">展示量：广告至少 50% 面积可见连续 1 秒记录，同一页面实例只计一次。点击量按明确点击去重。点击率＝点击量÷有效展示量。数据用于站内复盘，受拦截器与脚本禁用影响，不作为收入保证。</p>
          </div>
        </div>
        <div class="contact-box" style="margin-top:18px">
          <h3>📮 联系方式</h3>
          <div class="contact-line"><span>邮箱</span><b>${esc(c.contact.email)}</b></div>
          <div class="contact-line"><span>微信</span><b>${esc(c.contact.wechat)}</b></div>
          <div class="contact-line"><span>说明</span><b style="max-width:70%;text-align:right;font-weight:400;color:var(--text-2)">${esc(c.contact.note)}</b></div>
        </div>
      </div>`;
  }

  function viewNotFound(msg) {
    $('#app').innerHTML = `<div class="container"><div class="empty" style="margin-top:60px">
      <div class="big">🧭</div><h3>${esc(msg || '页面不存在')}</h3><a class="btn btn-primary" href="#/" data-link>返回首页</a>
    </div></div>`;
  }

  /* ============================================================
   * 后台管理
   * ============================================================ */
  const ADMIN_TABS = [
    { k: 'dash',      icon: '📊', name: '概览' },
    { k: 'tools',     icon: '🔧', name: '工具管理' },
    { k: 'cats',      icon: '🗂️', name: '分类管理' },
    { k: 'subs',      icon: '📥', name: '提交审核' },
    { k: 'ads',       icon: '📣', name: '广告管理' },
    { k: 'stats',     icon: '📈', name: '投放统计' },
    { k: 'settings',  icon: '⚙️', name: '站点设置' },
    { k: 'backup',    icon: '💾', name: '备份恢复' }
  ];
  let adminTab = 'dash';

  function statusPill(status) {
    const map = { on: ['st-on', '上架'], off: ['st-off', '下架'], draft: ['st-draft', '草稿'],
      pending: ['st-pending', '待投放'], active: ['st-active', '投放中'], paused: ['st-paused', '已暂停'], ended: ['st-ended', '已结束'] };
    const [cls, txt] = map[status] || ['st-draft', status];
    return `<span class="pill-status ${cls}">${txt}</span>`;
  }

  function viewAdmin() {
    if (!S.logged) return viewAdminLogin();
    $('#app').innerHTML = `
      <div class="container"><div class="admin-wrap">
        <div class="admin-layout">
          <aside class="admin-sidebar">
            <div class="side-head"><b>⚙️ 管理后台</b><span>AI 工具导航</span></div>
            <nav class="admin-nav">
              ${ADMIN_TABS.map(t => `<a data-admin-tab="${t.k}" class="${adminTab === t.k ? 'active' : ''}">${t.icon} ${t.name}</a>`).join('')}
            </nav>
            <div class="admin-logout"><a class="admin-nav" data-admin-logout>🚪 退出登录</a></div>
          </aside>
          <div class="admin-main" id="adminMain"></div>
        </div>
      </div></div>`;
    renderAdminTab();
  }

  function viewAdminLogin() {
    $('#app').innerHTML = `
      <div class="container"><div class="login-wrap"><div class="login-card">
        <h1>🔐 管理后台</h1><div class="sub">登录后管理内容、广告与统计</div>
        <form id="loginForm">
          <div class="form-group"><label>用户名</label><input class="form-control" name="username" value="admin" required autocomplete="username"></div>
          <div class="form-group"><label>密码</label><input class="form-control" name="password" type="password" required autocomplete="current-password" placeholder="演示密码 admin123"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">登录</button>
        </form>
        <div class="form-hint" style="text-align:center;margin-top:16px">演示账号：admin / admin123（仅前端演示，实际部署须后端鉴权）</div>
      </div></div></div>`;
  }

  function renderAdminTab() {
    const el = $('#adminMain');
    if (!el) return;
    switch (adminTab) {
      case 'dash': el.innerHTML = adminDash(); break;
      case 'tools': el.innerHTML = adminTools(); break;
      case 'cats': el.innerHTML = adminCats(); break;
      case 'subs': el.innerHTML = adminSubs(); break;
      case 'ads': el.innerHTML = adminAds(); break;
      case 'stats': el.innerHTML = adminStats(); break;
      case 'settings': el.innerHTML = adminSettings(); break;
      case 'backup': el.innerHTML = adminBackup(); break;
    }
  }

  function adminDash() {
    const views = S.stats.filter(s => s.type === 'view').length;
    const clicks = S.stats.filter(s => s.type === 'click').length;
    const pending = S.subs.filter(s => s.status === 'pending').length;
    const activeAds = S.plans.filter(p => planValid(p, beijingNow())).length;
    return `
      <div class="admin-head"><div><h2>概览</h2><div class="sub">站点内容与投放概况 · 北京时间 ${beijingNow().replace('T', ' ')}</div></div></div>
      <div class="stat-grid">
        <div class="stat-box"><div class="n">${activeTools().length}</div><div class="l">上架工具</div></div>
        <div class="stat-box"><div class="n">${activeCats().length}</div><div class="l">启用分类</div></div>
        <div class="stat-box"><div class="n">${pending}</div><div class="l">待审核提交</div></div>
        <div class="stat-box"><div class="n">${activeAds}</div><div class="l">投放中计划</div></div>
        <div class="stat-box"><div class="n">${views}</div><div class="l">广告展示量</div></div>
        <div class="stat-box"><div class="n">${clicks}</div><div class="l">广告点击量</div></div>
        <div class="stat-box"><div class="n">${S.favs.length}</div><div class="l">本机收藏</div></div>
        <div class="stat-box"><div class="n">${S.stats.length}</div><div class="l">统计事件总数</div></div>
      </div>
      <div class="alert alert-info">本后台为纯前端演示版，数据保存在浏览器 localStorage。正式上线须接入服务端鉴权、关系型数据库与文件存储，并按方案配置每天自动备份、广告独立接口与限频校验。</div>
      <div class="biz-card" style="margin-top:18px"><h3>✅ 运营者五项必会操作</h3>
        <div class="steps">
          <div class="step">新增一个工具（工具管理 → 新增工具）</div>
          <div class="step">修改分类（分类管理 → 编辑 / 上下架）</div>
          <div class="step">发布一条广告（广告管理 → 新建计划并设为投放中）</div>
          <div class="step">暂停或结束投放（广告管理 → 修改状态）</div>
          <div class="step">导出投放报表（投放统计 → 导出 CSV）</div>
        </div>
      </div>`;
  }

  function adminTools() {
    const rows = S.tools.map(t => `<tr>
      <td>${esc(t.icon || '🔧')} <b>${esc(t.name)}</b></td>
      <td>${(t.cats || []).map(catName).map(esc).join('、')}</td>
      <td>${t.featured ? '⭐ 是' : '—'}</td><td>${esc(t.verifiedAt || '—')}</td>
      <td>${statusPill(t.status)}</td>
      <td><div class="actions">
        <button class="icon-btn" data-edit-tool="${esc(t.id)}">编辑</button>
        <button class="icon-btn" data-toggle-tool="${esc(t.id)}">${t.status === 'on' ? '下架' : '上架'}</button>
        <button class="icon-btn del" data-del-tool="${esc(t.id)}">删除</button>
      </div></td></tr>`).join('');
    return `
      <div class="admin-head"><div><h2>工具管理</h2><div class="sub">共 ${S.tools.length} 条 · 上架 ${activeTools().length} 条</div></div>
        <button class="btn btn-primary" data-add-tool>＋ 新增工具</button></div>
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>工具</th><th>分类</th><th>精选</th><th>核对日期</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody>
      </table></div>`;
  }

  function adminCats() {
    const counts = {};
    S.tools.forEach(t => (t.cats || []).forEach(c => counts[c] = (counts[c] || 0) + 1));
    const rows = S.cats.slice().sort((a, b) => a.order - b.order).map(c => `<tr>
      <td>${esc(c.icon)} <b>${esc(c.name)}</b></td><td>${esc(c.desc)}</td>
      <td>${(c.tags || []).map(esc).join('、')}</td><td>${c.order}</td><td>${counts[c.id] || 0}</td>
      <td>${statusPill(c.status)}</td>
      <td><div class="actions">
        <button class="icon-btn" data-edit-cat="${esc(c.id)}">编辑</button>
        <button class="icon-btn" data-toggle-cat="${esc(c.id)}">${c.status === 'on' ? '停用' : '启用'}</button>
      </div></td></tr>`).join('');
    return `
      <div class="admin-head"><div><h2>分类管理</h2><div class="sub">顺序、名称与展示状态可调整</div></div>
        <button class="btn btn-primary" data-add-cat>＋ 新增分类</button></div>
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>分类</th><th>说明</th><th>标签</th><th>顺序</th><th>工具数</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody>
      </table></div>`;
  }

  function adminSubs() {
    const rows = S.subs.map(s => `<tr>
      <td><b>${esc(s.name)}</b></td><td><a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(s.url)}</a></td>
      <td>${(s.cats || []).map(catName).map(esc).join('、') || '—'}</td><td>${esc(s.submittedAt)}</td>
      <td>${statusPill(s.status)}</td>
      <td><div class="actions">
        ${s.status === 'pending' ? `<button class="icon-btn" data-sub-approve="${esc(s.id)}">通过</button>
          <button class="icon-btn" data-sub-reject="${esc(s.id)}">拒绝</button>` : ''}
        <button class="icon-btn del" data-sub-del="${esc(s.id)}">删除</button>
      </div></td></tr>`).join('');
    return `
      <div class="admin-head"><div><h2>提交审核</h2><div class="sub">待审核 ${S.subs.filter(s => s.status === 'pending').length} 条 · 通过后将生成工具条目</div></div></div>
      ${rows ? `<div class="table-scroll"><table class="data-table">
        <thead><tr><th>名称</th><th>官网</th><th>分类</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : '<div class="empty"><div class="big">📥</div><h3>暂无提交申请</h3></div>'}`;
  }

  function adminAds() {
    const slotName = (code) => (D.AD_SLOTS.find(s => s.code === code) || {}).name || code;
    const rows = S.plans.map(p => `<tr>
      <td class="slot-code">${esc(p.slot)} · ${esc(slotName(p.slot))}</td>
      <td><b>${esc(p.title)}</b><br><span style="color:var(--text-3);font-size:12px">${esc(p.brand || '')}</span></td>
      <td>${p.page}</td><td>${p.priority}</td>
      <td style="font-size:12px">${esc(p.start)}<br>→ ${esc(p.end)}</td>
      <td>${statusPill(p.status)}</td>
      <td><div class="actions">
        <button class="icon-btn" data-edit-ad="${esc(p.id)}">编辑</button>
        <button class="icon-btn" data-pause-ad="${esc(p.id)}">${p.status === 'active' ? '暂停' : (p.status === 'paused' ? '恢复' : '启用')}</button>
        <button class="icon-btn del" data-del-ad="${esc(p.id)}">删除</button>
      </div></td></tr>`).join('');
    return `
      <div class="admin-head"><div><h2>广告管理</h2><div class="sub">素材与排期统一维护 · 北京时间 · 到期自动下线</div></div>
        <button class="btn btn-primary" data-add-ad>＋ 新建计划</button></div>
      <div class="alert alert-info">展示规则：同页首屏最多一个主要横幅；同一广告位多条有效计划取优先级最高，相同则等概率；一次页面访问内素材不变，不自动轮播。无有效计划时广告位自动收起。</div>
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>广告位</th><th>计划</th><th>页面</th><th>优先级</th><th>起止时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function adminStats() {
    const group = {};
    S.stats.forEach(s => {
      const k = s.date + '|' + s.slot + '|' + s.planId;
      group[k] = group[k] || { date: s.date, slot: s.slot, planId: s.planId, views: 0, clicks: 0 };
      group[k][s.type === 'view' ? 'views' : 'clicks']++;
    });
    const rows = Object.values(group).sort((a, b) => b.date.localeCompare(a.date));
    const totalV = S.stats.filter(s => s.type === 'view').length;
    const totalC = S.stats.filter(s => s.type === 'click').length;
    const ctr = totalV ? (totalC / totalV * 100).toFixed(2) + '%' : '暂无数据';
    const planName = id => (S.plans.find(p => p.id === id) || {}).title || id;
    return `
      <div class="admin-head"><div><h2>投放统计</h2><div class="sub">按日期、广告位与计划查看 · 展示量 / 点击量 / 点击率</div></div>
        <button class="btn btn-outline" data-export-stats>⬇ 导出 CSV</button></div>
      <div class="stat-grid">
        <div class="stat-box"><div class="n">${totalV}</div><div class="l">有效展示量</div></div>
        <div class="stat-box"><div class="n">${totalC}</div><div class="l">点击量</div></div>
        <div class="stat-box"><div class="n">${ctr}</div><div class="l">点击率</div></div>
        <div class="stat-box"><div class="n">${rows.length}</div><div class="l">数据分组数</div></div>
      </div>
      ${rows.length ? `<div class="table-scroll"><table class="data-table">
        <thead><tr><th>日期</th><th>广告位</th><th>计划</th><th>展示</th><th>点击</th><th>点击率</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td>${esc(r.date)}</td><td class="slot-code">${esc(r.slot)}</td><td>${esc(planName(r.planId))}</td>
          <td>${r.views}</td><td>${r.clicks}</td><td>${r.views ? (r.clicks / r.views * 100).toFixed(2) + '%' : '暂无数据'}</td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty"><div class="big">📈</div><h3>暂无统计数据</h3><p>广告进入可视区 1 秒或点击后会计入。</p></div>'}
      <div class="alert alert-warn" style="margin-top:18px">统计口径：广告至少 50% 面积处于可视区域连续 1 秒且页面可见时记录展示，同一页面实例、广告位与素材只计一次；短时间重复点击去重。数据受拦截器与脚本禁用影响，不作为跨平台口径或收入保证。</div>`;
  }

  function adminSettings() {
    const c = S.config;
    return `
      <div class="admin-head"><div><h2>站点设置</h2><div class="sub">站点信息与商务联系方式</div></div></div>
      <form id="settingsForm" class="form-card" style="border:0;padding:0">
        <div class="form-group"><label>站点名称</label><input class="form-control" name="name" value="${esc(c.name)}"></div>
        <div class="form-group"><label>站点口号</label><input class="form-control" name="slogan" value="${esc(c.slogan)}"></div>
        <div class="form-group"><label>站点描述</label><textarea class="form-control" name="description">${esc(c.description)}</textarea></div>
        <div class="form-group"><label>关键词</label><input class="form-control" name="keywords" value="${esc(c.keywords)}"></div>
        <div class="form-row">
          <div class="form-group"><label>商务邮箱</label><input class="form-control" name="email" value="${esc(c.contact.email)}"></div>
          <div class="form-group"><label>商务微信</label><input class="form-control" name="wechat" value="${esc(c.contact.wechat)}"></div>
        </div>
        <div class="form-group"><label>联系说明</label><textarea class="form-control" name="note">${esc(c.contact.note)}</textarea></div>
        <button type="submit" class="btn btn-primary">保存设置</button>
      </form>`;
  }

  function adminBackup() {
    return `
      <div class="admin-head"><div><h2>备份恢复</h2><div class="sub">导出全部配置为 JSON，或导入恢复</div></div></div>
      <div class="alert alert-info">方案建议每天自动备份内容与广告配置，保留最近 30 天，并在交付前演练一次恢复。本站为本地演示，请定期手动导出备份文件妥善保存。</div>
      <div class="biz-grid">
        <div class="biz-card"><h3>⬇ 导出备份</h3><p style="color:var(--text-2);font-size:14px;margin-bottom:16px">导出工具、分类、广告计划、提交记录、站点设置与统计数据。</p>
          <button class="btn btn-primary" data-backup-export>导出 JSON 备份</button></div>
        <div class="biz-card"><h3>⬆ 导入恢复</h3><p style="color:var(--text-2);font-size:14px;margin-bottom:16px">从备份文件恢复，将覆盖当前所有数据。</p>
          <input type="file" id="backupFile" accept="application/json" class="form-control" style="margin-bottom:12px">
          <button class="btn btn-outline" data-backup-import>导入并恢复</button></div>
      </div>
      <div class="biz-card" style="margin-top:18px"><h3>♻️ 恢复演示数据</h3>
        <p style="color:var(--text-2);font-size:14px;margin-bottom:16px">恢复 initial 的种子数据（会覆盖当前修改）。</p>
        <button class="btn btn-danger" data-reset-data>重置为初始数据</button></div>`;
  }

  /* ---------- 后台弹窗表单 ---------- */
  function openModal(title, bodyHTML, onSave, wide) {
    closeModal();
    const mask = document.createElement('div');
    mask.className = 'modal-mask'; mask.id = 'modalMask';
    mask.innerHTML = `<div class="modal ${wide ? 'wide' : ''}">
      <div class="modal-head"><h3>${title}</h3><button class="modal-close" data-modal-close>×</button></div>
      <form id="modalForm"><div class="modal-body">${bodyHTML}</div>
        <div class="modal-foot"><button type="button" class="btn btn-outline" data-modal-close>取消</button>
        <button type="submit" class="btn btn-primary">保存</button></div></form>
    </div>`;
    document.body.appendChild(mask);
    $('#modalForm', mask).addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      if (onSave(fd, e.target) !== false) closeModal();
    });
    mask.addEventListener('click', (ev) => { if (ev.target === mask) closeModal(); });
  }
  function closeModal() { const m = $('#modalMask'); if (m) m.remove(); }

  function toolForm(t) {
    t = t || {};
    const cats = t.cats || [];
    return `
      <div class="form-row">
        <div class="form-group"><label>名称 <span class="req">*</span></label><input class="form-control" name="name" required value="${esc(t.name)}"></div>
        <div class="form-group"><label>图标 Emoji</label><input class="form-control" name="icon" maxlength="4" value="${esc(t.icon)}"></div>
      </div>
      <div class="form-group"><label>唯一路径 ID <span class="req">*</span>（英文，唯一）</label><input class="form-control" name="id" required ${t.id ? 'readonly' : ''} value="${esc(t.id)}"></div>
      <div class="form-group"><label>官网链接 <span class="req">*</span></label><input class="form-control" name="url" type="url" required value="${esc(t.url)}"></div>
      <div class="form-group"><label>所属分类（可多选）</label><div class="check-group">
        ${S.cats.map(c => `<label class="check-item"><input type="checkbox" name="cats" value="${esc(c.id)}" ${cats.includes(c.id) ? 'checked' : ''}> ${esc(c.name)}</label>`).join('')}</div></div>
      <div class="form-group"><label>标签（逗号分隔）</label><input class="form-control" name="tags" value="${esc((t.tags || []).join(', '))}"></div>
      <div class="form-group"><label>一句话简介 <span class="req">*</span></label><input class="form-control" name="summary" required value="${esc(t.summary)}"></div>
      <div class="form-group"><label>详细说明</label><textarea class="form-control" name="detail">${esc(t.detail)}</textarea></div>
      <div class="form-group"><label>主要功能（每行一条）</label><textarea class="form-control" name="features">${esc((t.features || []).join('\n'))}</textarea></div>
      <div class="form-group"><label>适用场景（每行一条）</label><textarea class="form-control" name="scenes">${esc((t.scenes || []).join('\n'))}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>定价信息</label><input class="form-control" name="pricing" value="${esc(t.pricing)}" placeholder="仅在核实后填写"></div>
        <div class="form-group"><label>最近核对日期</label><input class="form-control" name="verifiedAt" type="date" value="${esc(t.verifiedAt || nowDate())}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>收录日期</label><input class="form-control" name="addedAt" type="date" value="${esc(t.addedAt || nowDate())}"></div>
        <div class="form-group"><label>状态</label><select class="form-control" name="status"><option value="on" ${t.status !== 'off' ? 'selected' : ''}>上架</option><option value="off" ${t.status === 'off' ? 'selected' : ''}>下架</option></select></div>
      </div>
      <label class="check-item"><input type="checkbox" name="featured" ${t.featured ? 'checked' : ''}> 设为精选工具</label>`;
  }
  function parseLines(s) { return (s || '').split('\n').map(x => x.trim()).filter(Boolean); }
  function parseTags(s) { return (s || '').split(/[,，]/).map(x => x.trim()).filter(Boolean); }

  function saveToolFromForm(fd, form, existingId) {
    if (!/^[a-z0-9-_]+$/i.test(fd.id)) { toast('路径 ID 仅允许英文字母、数字、- 和 _'); return false; }
    if (!existingId && S.tools.some(t => t.id === fd.id)) { toast('该路径 ID 已存在'); return false; }
    const cats = Array.from(form.querySelectorAll('input[name="cats"]:checked')).map(i => i.value);
    const obj = {
      id: fd.id, name: fd.name, icon: fd.icon || '🔧', url: fd.url, cats, tags: parseTags(fd.tags),
      summary: fd.summary, detail: fd.detail || fd.summary, features: parseLines(fd.features), scenes: parseLines(fd.scenes),
      pricing: fd.pricing || '', featured: !!fd.featured, addedAt: fd.addedAt || nowDate(),
      verifiedAt: fd.verifiedAt || '', status: fd.status || 'on'
    };
    if (existingId) { const i = S.tools.findIndex(t => t.id === existingId); S.tools[i] = obj; }
    else S.tools.unshift(obj);
    persist.tools(); renderAdminTab(); toast(existingId ? '工具已更新' : '工具已新增');
  }

  function adForm(p) {
    p = p || {};
    return `
      <div class="form-row">
        <div class="form-group"><label>广告位 <span class="req">*</span></label><select class="form-control" name="slot">
          ${D.AD_SLOTS.map(s => `<option value="${s.code}" ${p.slot === s.code ? 'selected' : ''}>${s.code} · ${s.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>投放页面 <span class="req">*</span></label><select class="form-control" name="page">
          ${['home', 'category', 'list', 'detail'].map(v => `<option value="${v}" ${p.page === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>计划标题 <span class="req">*</span></label><input class="form-control" name="title" required value="${esc(p.title)}"></div>
      <div class="form-row">
        <div class="form-group"><label>品牌/赞助商</label><input class="form-control" name="brand" value="${esc(p.brand)}"></div>
        <div class="form-group"><label>目标链接 <span class="req">*</span></label><input class="form-control" name="link" type="url" required value="${esc(p.link || 'https://example.com')}"></div>
      </div>
      <div class="form-group"><label>广告描述</label><input class="form-control" name="desc" value="${esc(p.desc)}"></div>
      <div class="form-group"><label>背景样式（CSS gradient 或颜色）</label><input class="form-control" name="bg" value="${esc(p.bg || 'linear-gradient(120deg,#2b2350,#1b2440)')}"></div>
      <div class="form-row">
        <div class="form-group"><label>优先级（数字越大越高）</label><input class="form-control" name="priority" type="number" value="${esc(p.priority != null ? p.priority : 5)}"></div>
        <div class="form-group"><label>状态</label><select class="form-control" name="status">
          ${['draft', 'pending', 'active', 'paused', 'ended'].map(v => `<option value="${v}" ${p.status === v ? 'selected' : ''}>${{draft:'草稿',pending:'待投放',active:'投放中',paused:'已暂停',ended:'已结束'}[v]}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>开始时间（北京时间）</label><input class="form-control" name="start" type="datetime-local" value="${esc(p.start || beijingNow())}"></div>
        <div class="form-group"><label>结束时间（北京时间）</label><input class="form-control" name="end" type="datetime-local" value="${esc(p.end || '2027-12-31T23:59')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>电脑素材尺寸</label><input class="form-control" name="desktopSize" value="${esc(p.desktopSize || '1200×160')}"></div>
        <div class="form-group"><label>手机素材尺寸</label><input class="form-control" name="mobileSize" value="${esc(p.mobileSize || '750×240')}"></div>
      </div>
      <div class="alert alert-info" style="margin-bottom:0">预览审核：保存后请到对应页面确认展示效果；手机端素材单独预览。首版只接受结构化素材与链接，不开放脚本粘贴。</div>`;
  }

  /* ============================================================
   * 路由
   * ============================================================ */
  function parseHash() {
    let h = location.hash.replace(/^#/, '');
    if (!h) h = '/';
    // 支持 #/search?q=xxx
    let q = '';
    if (h.startsWith('/search')) {
      const i = h.indexOf('?');
      if (i >= 0) { try { q = new URLSearchParams(h.slice(i + 1)).get('q') || ''; } catch (e) {} }
      return { name: 'search', q };
    }
    const parts = h.split('/').filter(Boolean);
    if (parts[0] === 'tool' && parts[1]) return { name: 'tool', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'category' && parts[1]) return { name: 'category', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'categories') return { name: 'categories' };
    if (parts[0] === 'favorites') return { name: 'favorites' };
    if (parts[0] === 'submit') return { name: 'submit' };
    if (parts[0] === 'business') return { name: 'business' };
    if (parts[0] === 'admin') return { name: 'admin' };
    if (parts[0]) return { name: '404' };
    return { name: 'home' };
  }

  function render() {
    S.adChosen = {};                       // 新页面请求重新校验广告排期
    S.observers.forEach(o => o.disconnect()); S.observers = [];
    const r = parseHash();
    S.route = r;
    if (r.name !== 'search') S.filters.q = '';   // 离开搜索页时清空关键词，避免状态泄漏
    // 次级搜索条：非首页显示
    const sub = $('#subSearch');
    sub.hidden = (r.name === 'home' || r.name === 'admin');
    switch (r.name) {
      case 'home': viewHome(); break;
      case 'categories': viewCategories(); break;
      case 'category': viewCategory(r.id); break;
      case 'search': viewSearch(r.q); $('#subSearchInput').value = r.q || ''; break;
      case 'tool': viewTool(r.id); break;
      case 'favorites': viewFavorites(); break;
      case 'submit': viewSubmit(); break;
      case 'business': viewBusiness(); break;
      case 'admin': viewAdmin(); break;
      default: viewNotFound();
    }
    // 导航高亮
    $$('#mainNav a').forEach(a => {
      const n = a.getAttribute('data-nav');
      const active = (n === 'home' && r.name === 'home') ||
        (n === 'categories' && ['categories', 'category'].includes(r.name)) ||
        (n === 'favorites' && r.name === 'favorites') ||
        (n === 'submit' && r.name === 'submit') ||
        (n === 'business' && r.name === 'business');
      a.classList.toggle('active', active);
    });
    $('#mainNav').classList.remove('open');
    setupAdObserver();
    window.scrollTo(0, 0);
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function updateFavCount() {
    const el = $('#favCount');
    if (!el) return;
    el.textContent = S.favs.length;
    el.hidden = S.favs.length === 0;
  }

  /* ============================================================
   * 事件绑定（委托）
   * ============================================================ */
  document.addEventListener('click', (e) => {
    const t = e.target;

    // 广告点击记录（去重：同一 plan 短时间内只记一次）
    const adClickCache = document._adClickCache || (document._adClickCache = {});
    const adHit = t.closest('[data-ad-click]');
    if (adHit) {
      const key = adHit.dataset.plan;
      const last = adClickCache[key] || 0;
      if (Date.now() - last > 1500) { adClickCache[key] = Date.now(); recordStat(key, adHit.dataset.slot, 'click'); }
    }

    // data-link 交给 hashchange，无需额外处理
    if (t.closest('[data-link]')) { /* hashchange 触发渲染 */ }

    // 收藏切换
    const fav = t.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      const id = fav.getAttribute('data-fav');
      const i = S.favs.indexOf(id);
      if (i >= 0) { S.favs.splice(i, 1); toast('已取消收藏'); }
      else { S.favs.push(id); toast('已收藏到本机'); }
      persist.favs(); updateFavCount();
      // 就地更新按钮样式，避免整页刷新
      $$('[data-fav="' + CSS.escape(id) + '"]').forEach(b => {
        const on = S.favs.includes(id);
        if (b.classList.contains('fav-btn')) { b.classList.toggle('faved', on); b.textContent = on ? '★' : '☆'; b.title = on ? '取消收藏' : '收藏'; }
        else b.textContent = on ? '★ 已收藏' : '☆ 收藏工具';
      });
      return;
    }

    // 分类筛选
    const fc = t.closest('[data-filter-cat]');
    if (fc) {
      S.filters.cat = fc.getAttribute('data-filter-cat');
      const base = S.route && S.route.name === 'category'
        ? activeTools().filter(x => (x.cats || []).includes(S.route.id)) : activeTools();
      const area = $('#resultArea');
      if (area) area.innerHTML = resultsHTML(filteredTools(base), { sponsor: true, withCat: S.route.name !== 'category' });
      $$('[data-filter-cat]').forEach(c => c.classList.toggle('active', c.getAttribute('data-filter-cat') === S.filters.cat));
      setupAdObserver(); updateFavCount();
      return;
    }

    if (t.closest('[data-clear-filter]')) {
      S.filters.q = ''; S.filters.cat = ''; S.filters.sort = 'featured';
      $('#subSearchInput') && ($('#subSearchInput').value = '');
      go('#/'); return;
    }

    // 后台 tab
    const tab = t.closest('[data-admin-tab]');
    if (tab) {
      e.preventDefault();
      adminTab = tab.getAttribute('data-admin-tab');
      $$('[data-admin-tab]').forEach(a => a.classList.toggle('active', a === tab));
      renderAdminTab(); return;
    }
    if (t.closest('[data-admin-logout]')) {
      e.preventDefault();
      S.logged = false; persist.auth(); viewAdminLogin(); toast('已退出登录'); return;
    }
    if (t.closest('[data-modal-close]')) { closeModal(); return; }

    // ---- 工具 CRUD ----
    if (t.closest('[data-add-tool]')) {
      openModal('新增工具', toolForm(), (fd, form) => saveToolFromForm(fd, form)); return;
    }
    const et = t.closest('[data-edit-tool]');
    if (et) {
      const tool = S.tools.find(x => x.id === et.getAttribute('data-edit-tool'));
      openModal('编辑工具', toolForm(tool), (fd, form) => saveToolFromForm(fd, form, tool.id)); return;
    }
    const tg = t.closest('[data-toggle-tool]');
    if (tg) {
      const tool = S.tools.find(x => x.id === tg.getAttribute('data-toggle-tool'));
      tool.status = tool.status === 'on' ? 'off' : 'on'; persist.tools(); renderAdminTab(); toast('状态已更新'); return;
    }
    const dt = t.closest('[data-del-tool]');
    if (dt) {
      const id = dt.getAttribute('data-del-tool');
      if (confirm('确认删除该工具？此操作不可撤销。')) {
        S.tools = S.tools.filter(x => x.id !== id); persist.tools(); renderAdminTab(); toast('已删除');
      } return;
    }

    // ---- 分类 CRUD ----
    if (t.closest('[data-add-cat]')) {
      openModal('新增分类', catForm(), (fd, form) => saveCatFromForm(fd, form)); return;
    }
    const ec = t.closest('[data-edit-cat]');
    if (ec) {
      const cat = S.cats.find(x => x.id === ec.getAttribute('data-edit-cat'));
      openModal('编辑分类', catForm(cat), (fd, form) => saveCatFromForm(fd, form, cat.id)); return;
    }
    const tc = t.closest('[data-toggle-cat]');
    if (tc) {
      const cat = S.cats.find(x => x.id === tc.getAttribute('data-toggle-cat'));
      cat.status = cat.status === 'on' ? 'off' : 'on'; persist.cats(); renderAdminTab(); toast('状态已更新'); return;
    }

    // ---- 提交审核 ----
    const sa = t.closest('[data-sub-approve]');
    if (sa) {
      const sub = S.subs.find(x => x.id === sa.getAttribute('data-sub-approve'));
      sub.status = 'approved';
      if (!S.tools.some(x => x.id === sub.id)) {
        S.tools.unshift({ id: sub.id, name: sub.name, icon: sub.icon || '🔧', url: sub.url, cats: sub.cats || [],
          tags: sub.tags || [], summary: sub.summary, detail: sub.detail || sub.summary, features: [], scenes: [],
          pricing: '', featured: false, addedAt: nowDate(), verifiedAt: nowDate(), status: 'on' });
        persist.tools();
      }
      persist.subs(); renderAdminTab(); toast('已通过并生成工具'); return;
    }
    const sr = t.closest('[data-sub-reject]');
    if (sr) { const s = S.subs.find(x => x.id === sr.getAttribute('data-sub-reject')); s.status = 'rejected'; persist.subs(); renderAdminTab(); toast('已拒绝'); return; }
    const sd = t.closest('[data-sub-del]');
    if (sd) { S.subs = S.subs.filter(x => x.id !== sd.getAttribute('data-sub-del')); persist.subs(); renderAdminTab(); return; }

    // ---- 广告 CRUD ----
    if (t.closest('[data-add-ad]')) {
      openModal('新建广告计划', adForm(), (fd) => saveAdFromForm(fd), true); return;
    }
    const ea = t.closest('[data-edit-ad]');
    if (ea) { const p = S.plans.find(x => x.id === ea.getAttribute('data-edit-ad')); openModal('编辑广告计划', adForm(p), (fd) => saveAdFromForm(fd, p.id), true); return; }
    const pa = t.closest('[data-pause-ad]');
    if (pa) {
      const p = S.plans.find(x => x.id === pa.getAttribute('data-pause-ad'));
      p.status = p.status === 'active' ? 'paused' : 'active'; persist.plans(); renderAdminTab(); toast('投放状态已更新'); return;
    }
    const da = t.closest('[data-del-ad]');
    if (da) { if (confirm('确认删除该广告计划？')) { S.plans = S.plans.filter(x => x.id !== da.getAttribute('data-del-ad')); persist.plans(); renderAdminTab(); } return; }

    // ---- 统计导出 / 备份 ----
    if (t.closest('[data-export-stats]')) { exportStatsCSV(); return; }
    if (t.closest('[data-backup-export]')) { exportBackup(); return; }
    if (t.closest('[data-backup-import]')) { importBackup(); return; }
    if (t.closest('[data-reset-data]')) {
      if (confirm('确认重置为初始数据？当前所有修改将丢失。')) { resetData(); toast('已重置为初始数据'); } return;
    }

    // 移动端菜单
    if (t.closest('#menuToggle')) { $('#mainNav').classList.toggle('open'); return; }
  });

  function catForm(c) {
    c = c || {};
    return `
      <div class="form-row">
        <div class="form-group"><label>分类 ID <span class="req">*</span>（英文）</label><input class="form-control" name="id" required ${c.id ? 'readonly' : ''} value="${esc(c.id)}"></div>
        <div class="form-group"><label>图标 Emoji</label><input class="form-control" name="icon" maxlength="4" value="${esc(c.icon || '📁')}"></div>
      </div>
      <div class="form-group"><label>名称 <span class="req">*</span></label><input class="form-control" name="name" required value="${esc(c.name)}"></div>
      <div class="form-group"><label>说明</label><input class="form-control" name="desc" value="${esc(c.desc)}"></div>
      <div class="form-group"><label>示例标签（逗号分隔）</label><input class="form-control" name="tags" value="${esc((c.tags || []).join(', '))}"></div>
      <div class="form-row">
        <div class="form-group"><label>顺序</label><input class="form-control" name="order" type="number" value="${esc(c.order != null ? c.order : S.cats.length + 1)}"></div>
        <div class="form-group"><label>状态</label><select class="form-control" name="status"><option value="on" ${c.status !== 'off' ? 'selected' : ''}>启用</option><option value="off" ${c.status === 'off' ? 'selected' : ''}>停用</option></select></div>
      </div>`;
  }
  function saveCatFromForm(fd, form, existingId) {
    if (!/^[a-z0-9-_]+$/i.test(fd.id)) { toast('分类 ID 仅允许英文、数字、- 和 _'); return false; }
    if (!existingId && S.cats.some(c => c.id === fd.id)) { toast('该分类 ID 已存在'); return false; }
    const obj = { id: fd.id, name: fd.name, icon: fd.icon || '📁', desc: fd.desc, tags: parseTags(fd.tags), order: Number(fd.order) || 99, status: fd.status };
    if (existingId) S.cats[S.cats.findIndex(c => c.id === existingId)] = obj; else S.cats.push(obj);
    persist.cats(); renderAdminTab(); toast('分类已保存');
  }
  function saveAdFromForm(fd, existingId) {
    const old = existingId ? S.plans.find(p => p.id === existingId) : {};
    const obj = Object.assign({}, old, {
      slot: fd.slot, page: fd.page, title: fd.title, brand: fd.brand, desc: fd.desc, link: fd.link,
      bg: fd.bg, priority: Number(fd.priority) || 0, status: fd.status, start: fd.start, end: fd.end,
      desktopSize: fd.desktopSize, mobileSize: fd.mobileSize
    });
    if (existingId) S.plans[S.plans.findIndex(p => p.id === existingId)] = obj; else S.plans.unshift(Object.assign({ id: uid('ad') }, obj));
    persist.plans(); S.adChosen = {}; renderAdminTab(); toast('广告计划已保存');
  }

  /* ---------- 表单提交 ---------- */
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.id === 'heroSearch' || form.id === 'subSearchForm') {
      e.preventDefault();
      const input = form.querySelector('input[type="search"]');
      const q = input.value.trim();
      go('#/search?q=' + encodeURIComponent(q));
      return;
    }
    if (form.id === 'loginForm') {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      if (fd.username === D.ADMIN_ACCOUNT.username && fd.password === D.ADMIN_ACCOUNT.password) {
        S.logged = true; persist.auth(); viewAdmin(); toast('登录成功');
      } else toast('用户名或密码错误');
      return;
    }
    if (form.id === 'submitForm') {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const cats = Array.from(form.querySelectorAll('input[name="cats"]:checked')).map(i => i.value);
      if (!cats.length) { toast('请至少选择一个分类'); return; }
      const url = fd.url.trim();
      if (!/^https?:\/\//i.test(url)) { toast('官网链接须以 http:// 或 https:// 开头'); return; }
      S.subs.unshift({ id: uid('sub'), name: fd.name.trim(), url, cats, tags: parseTags(fd.tags), icon: fd.icon || '🔧',
        summary: fd.summary.trim(), detail: fd.detail || '', status: 'pending', submittedAt: beijingNow().replace('T', ' ') });
      persist.subs(); form.reset(); toast('提交成功，已进入审核队列');
      return;
    }
    if (form.id === 'settingsForm') {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      S.config = { name: fd.name, slogan: fd.slogan, description: fd.description, keywords: fd.keywords,
        contact: { email: fd.email, wechat: fd.wechat, note: fd.note } };
      persist.config(); toast('站点设置已保存'); return;
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'sortSelect') {
      S.filters.sort = e.target.value;
      const base = S.route && S.route.name === 'category'
        ? activeTools().filter(x => (x.cats || []).includes(S.route.id)) : activeTools();
      const area = $('#resultArea');
      if (area) area.innerHTML = resultsHTML(filteredTools(base), { sponsor: true, withCat: S.route.name !== 'category' });
      setupAdObserver(); updateFavCount();
    }
  });
  window.addEventListener('hashchange', render);

  /* ---------- 导出 / 备份 ---------- */
  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportStatsCSV() {
    const group = {};
    S.stats.forEach(s => {
      const k = s.date + '|' + s.slot + '|' + s.planId;
      group[k] = group[k] || { date: s.date, slot: s.slot, planId: s.planId, views: 0, clicks: 0 };
      group[k][s.type === 'view' ? 'views' : 'clicks']++;
    });
    const rows = [['日期', '广告位', '计划ID', '展示量', '点击量', '点击率']];
    Object.values(group).forEach(r => rows.push([r.date, r.slot, r.planId, r.views, r.clicks, r.views ? (r.clicks / r.views * 100).toFixed(2) + '%' : '暂无数据']));
    const csv = '\uFEFF' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    download('广告投放报表_' + nowDate() + '.csv', csv, 'text/csv;charset=utf-8');
    toast('报表已导出');
  }
  function exportBackup() {
    const data = { version: 1, exportedAt: new Date().toISOString(), tools: S.tools, cats: S.cats,
      plans: S.plans, subs: S.subs, favs: S.favs, stats: S.stats, config: S.config };
    download('ai-nav-backup-' + nowDate() + '.json', JSON.stringify(data, null, 2), 'application/json');
    toast('备份已导出');
  }
  function importBackup() {
    const file = $('#backupFile').files[0];
    if (!file) { toast('请先选择备份文件'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!d.tools || !d.cats) throw new Error('格式不正确');
        S.tools = d.tools; S.cats = d.cats; S.plans = d.plans || []; S.subs = d.subs || [];
        S.favs = d.favs || []; S.stats = d.stats || []; S.config = d.config || D.SITE_CONFIG;
        persist.tools(); persist.cats(); persist.plans(); persist.subs(); persist.favs(); persist.stats(); persist.config();
        render(); toast('数据已恢复');
      } catch (err) { toast('导入失败：' + err.message); }
    };
    reader.readAsText(file);
  }
  function resetData() {
    S.tools = clone(D.TOOLS); S.cats = clone(D.CATEGORIES); S.plans = clone(D.AD_PLANS);
    S.subs = []; S.favs = []; S.stats = []; S.config = clone(D.SITE_CONFIG);
    persist.tools(); persist.cats(); persist.plans(); persist.subs(); persist.favs(); persist.stats(); persist.config();
    render();
  }

  /* ---------- 启动 ---------- */
  // 同步页面标题与站点配置
  document.title = S.config.name + ' · 发现好用的 AI 工具';
  $('#footerDesc').textContent = S.config.description;
  render();
})();

