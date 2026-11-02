// Điều phối giao diện: nhận snapshot (từ server thật hoặc bộ giả lập), vẽ hai bảng bên và đưa dữ liệu cho văn phòng.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SHIRTS = ['#e46f4f', '#3f8fd8', '#46b07e', '#d9a62c', '#9a6fd6', '#e0607f', '#2fb3b0', '#7f8b99'];
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); };
  const ICONS = {
    bash: '<svg viewBox="0 0 24 24"><path d="m5 7 5 5-5 5M12 18h7"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    read: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>',
    web: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    agent: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    done: '<svg viewBox="0 0 24 24"><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2"/></svg>',
    attention: '<svg viewBox="0 0 24 24"><path d="M12 3 2 20h20zM12 10v4M12 17h.01"/></svg>',
    task: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    think: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    plan: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    tool: '<svg viewBox="0 0 24 24"><path d="M14 6a4 4 0 0 0 5 5l-8 8-3-3 8-8z"/></svg>',
    idle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',
  };
  const FILTER_KINDS = { bash: ['bash'], edit: ['edit'], read: ['read'], web: ['web'], agent: ['agent'] };

  let state = { sessions: [], events: [], approvals: [], machine: null, mode: 'demo', now: Date.now() };
  let selected = null, filter = 'all', query = '', mode = null, es = null, avatar = false;
  const seenApprovals = new Set();

  // ---------------------------------------------------------------- data source
  function useDemo() {
    if (es) { es.close(); es = null; }
    mode = 'demo';
    window.DemoFeed.start(onSnapshot);
    setBadge();
  }
  function useLive(onFail) {
    window.DemoFeed.stop();
    let got = false;
    try { es = new EventSource('api/stream'); } catch { return onFail && onFail(); }
    const timer = setTimeout(() => { if (!got) { es && es.close(); es = null; onFail && onFail(); } }, 2500);
    es.onmessage = (e) => {
      got = true; clearTimeout(timer); mode = 'live'; setBadge();
      try { onSnapshot(JSON.parse(e.data)); } catch {}
    };
    es.onerror = () => { if (!got) { clearTimeout(timer); es && es.close(); es = null; onFail && onFail(); } else { $('liveText').textContent = 'mất kết nối, đang thử lại…'; } };
    es.onopen = () => { $('liveText').textContent = 'đang nhận dữ liệu'; };
  }
  function setBadge() {
    const b = $('modeBadge');
    b.textContent = mode === 'live' ? 'Trực tiếp · Claude Code' : 'DEMO · dữ liệu giả lập';
    b.classList.toggle('live', mode === 'live');
  }

  function onSnapshot(snap) {
    state = snap;
    for (const a of snap.approvals) {
      if (!seenApprovals.has(a.id)) { seenApprovals.add(a.id); if (seenApprovals.size > 2 || mode === 'live') toast(`${nameOf(a.sessionId)} xin quyền: ${a.summary}`); }
    }
    window.Office.setSessions(snap.sessions, selected);
    if (snap.machine) {
      const pct = (snap.machine.memUsed / snap.machine.memTotal) * 100;
      window.Office.setRam(pct);
      $('machineName').textContent = snap.machine.name;
      $('machineMem').textContent = `RAM ${Math.round(pct)}% · ${(snap.machine.memUsed / 2 ** 30).toFixed(1)} GB`;
      $('machineBar').style.width = pct + '%';
    }
    renderSessions();
    renderStats();
    renderFeed();
    const waiting = snap.approvals.length;
    document.title = waiting ? `(${waiting}) My Office` : 'My Office';
  }
  const nameOf = (id) => state.sessions.find((s) => s.id === id)?.name || 'Phiên';

  // ---------------------------------------------------------------- left panel
  function fmtDur(ms) {
    const m = Math.max(0, Math.floor(ms / 60000));
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  }
  function ago(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 1) return '< 1 phút';
    if (m < 60) return `${m} phút`;
    return `${Math.floor(m / 60)} giờ`;
  }
  function renderSessions() {
    const now = Date.now();
    const list = state.sessions.filter((s) => !query || (s.name + ' ' + s.cwd + ' ' + (s.title || '')).toLowerCase().includes(query));
    const groups = [
      ['waiting', 'Cần bạn duyệt', 'warn'],
      ['working', 'Đang làm', ''],
      ['idle', 'Đang nghỉ', ''],
    ];
    const counts = { working: 0, waiting: 0, idle: 0 };
    state.sessions.forEach((s) => counts[s.status]++);
    $('cWorking').textContent = counts.working; $('cWaiting').textContent = counts.waiting; $('cIdle').textContent = counts.idle;
    const helpers = state.sessions.reduce((n, s) => n + s.helpers.length, 0);
    $('sessionSub').textContent = `${state.sessions.length} phiên · ${helpers} trợ lý đang chạy`;
    const maxCost = Math.max(0.01, ...state.sessions.map((s) => s.cost || 0));
    let html = '';
    for (const [st, label, cls] of groups) {
      const g = list.filter((s) => s.status === st);
      if (!g.length) continue;
      html += `<div class="group-label ${cls}">${label} <em>${g.length}</em></div>`;
      for (const s of g) {
        const color = SHIRTS[hash(s.name) % SHIRTS.length];
        const appr = state.approvals.find((a) => a.sessionId === s.id);
        const top = st === 'waiting' ? `chờ ${ago(now - (appr?.createdAt || now))}` : st === 'working' ? fmtDur(now - (s.startedAt || now)) : `nghỉ ${ago(now - (s.lastAt || now))}`;
        const dotCls = st === 'working' ? 'dot-good' : st === 'waiting' ? 'dot-warn' : 'dot-idle';
        html += `<button class="session ${st} ${selected === s.id ? 'selected' : ''}" data-id="${esc(s.id)}" type="button">
          <span class="avatar" style="background:${color}">${esc(s.name.slice(0, 1).toUpperCase())}<i class="st ${dotCls}"></i></span>
          <span class="s-main"><span class="s-name">${esc(s.name)}</span><span class="s-act">${st === 'waiting' ? '⚠ ' : ''}${esc(s.activity?.text || '')}</span></span>
          <span class="s-meta"><b>${esc(top)}</b><br>$${(s.cost || 0).toFixed(2)}</span>
          <span class="s-bar"><span style="width:${Math.max(6, ((s.cost || 0) / maxCost) * 100)}%"></span></span>
          ${s.helpers.map((h) => `<span class="helper-row">✦ <b>${esc(h.type)}</b> · ${esc(h.desc || 'đang làm')}</span>`).join('')}
        </button>`;
      }
    }
    if (!html) html = state.sessions.length
      ? '<p class="empty">Không có phiên nào khớp với từ khoá.</p>'
      : '<p class="empty">Chưa thấy phiên Claude Code nào trong 24 giờ qua. Mở một terminal và chạy <code>claude</code>, nhân viên mới sẽ bước ra từ thang máy.</p>';
    $('sessionList').innerHTML = html;
  }

  // ---------------------------------------------------------------- right panel
  function renderStats() {
    const t = { read: 0, edit: 0, bash: 0 }; let cost = 0;
    for (const s of state.sessions) { t.read += s.stats.read || 0; t.edit += s.stats.edit || 0; t.bash += s.stats.bash || 0; cost += s.cost || 0; }
    $('sTasks').textContent = state.sessions.length;
    $('sRead').textContent = t.read; $('sEdit').textContent = t.edit; $('sBash').textContent = t.bash;
    $('sCost').textContent = '$' + cost.toFixed(2);
    const n = state.approvals.length;
    const em = $('attnCount'); em.textContent = n; em.classList.toggle('zero', !n);
  }
  function hhmm(ts) { const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
  function renderFeed() {
    const pending = new Set(state.approvals.map((a) => a.id));
    let evs = state.events.slice().reverse();
    if (filter === 'attention') evs = evs.filter((e) => e.approvalId && pending.has(e.approvalId));
    else if (FILTER_KINDS[filter]) evs = evs.filter((e) => FILTER_KINDS[filter].includes(e.kind));
    if (selected) evs = evs.filter((e) => e.sessionId === selected);
    // yêu cầu duyệt còn treo luôn nổi lên đầu
    evs.sort((a, b) => (pending.has(b.approvalId) ? 1 : 0) - (pending.has(a.approvalId) ? 1 : 0));
    evs = evs.slice(0, 60);
    const html = evs.map((e) => {
      const open = e.approvalId && pending.has(e.approvalId);
      const cls = open ? 'attention' : e.status === 'working' && e === evs.find((x) => x.sessionId === e.sessionId) ? 'working' : '';
      const tag = open ? '' : e.status === 'helper' ? '<span class="tag helper">trợ lý</span>' : e.status === 'done' ? '<span class="tag done">xong</span>' : cls === 'working' ? '<span class="tag working">đang làm</span>' : '';
      return `<div class="ev ${cls}" data-sid="${esc(e.sessionId)}">
        <div class="ev-head">${open ? '<span style="color:var(--warn)">⚠</span>' : `<i class="dot ${e.status === 'helper' ? 'dot-helper' : e.status === 'done' ? 'dot-idle' : 'dot-good'}"></i>`}<span>${esc(nameOf(e.sessionId))}</span>${tag}<time>${hhmm(e.ts)}</time></div>
        <div class="ev-body">${ICONS[e.kind] || ICONS.tool}<span>${esc(e.text)}${e.detail ? ` · <i>${esc(e.detail)}</i>` : ''}</span></div>
        ${open ? `<div class="ev-actions"><button class="btn" data-open="${esc(e.approvalId)}" type="button">Mở để duyệt</button><button class="btn btn-primary" data-allow="${esc(e.approvalId)}" type="button">Duyệt</button><button class="btn btn-danger" data-deny="${esc(e.approvalId)}" type="button">Từ chối</button></div>` : ''}
      </div>`;
    }).join('');
    const feed = $('feed');
    const key = evs.map((e) => e.id + (pending.has(e.approvalId) ? 'p' : '')).join(',') + selected;
    if (feed.dataset.key === key) return;
    feed.dataset.key = key;
    feed.innerHTML = html || `<p class="empty">${selected ? 'Phiên này chưa có hoạt động khớp bộ lọc.' : 'Chưa có hoạt động nào.'}</p>`;
  }

  // ---------------------------------------------------------------- approvals
  function decide(id, behavior) {
    const a = state.approvals.find((x) => x.id === id);
    if (mode === 'live') {
      fetch(`api/approvals/${encodeURIComponent(id)}/decide`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ behavior }) })
        .catch(() => toast('Không gửi được quyết định. Kiểm tra server My Office còn chạy không.'));
    } else {
      window.DemoFeed.decide(id, behavior);
    }
    if (a) toast(behavior === 'allow' ? `Đã duyệt cho ${nameOf(a.sessionId)}` : `Đã từ chối yêu cầu của ${nameOf(a.sessionId)}`);
    closeModal();
  }
  function openApproval(id) {
    const a = state.approvals.find((x) => x.id === id);
    if (!a) return toast('Yêu cầu này đã được xử lý.');
    const s = state.sessions.find((x) => x.id === a.sessionId);
    const cmd = a.tool === 'Bash' ? a.input.command : JSON.stringify(a.input, null, 2);
    openModal(`${nameOf(a.sessionId)} xin quyền ${a.tool === 'Bash' ? 'chạy lệnh' : 'dùng ' + a.tool}`, `
      <dl class="kv">
        <dt>Việc đang làm</dt><dd>${esc(s?.title || s?.activity?.text || '–')}</dd>
        <dt>Thư mục</dt><dd class="mono">${esc(a.cwd || s?.cwd || '–')}</dd>
        <dt>Công cụ</dt><dd>${esc(a.tool)}</dd>
        <dt>Mô tả</dt><dd>${esc(a.summary)}</dd>
      </dl>
      <h4>Nội dung</h4>
      <pre class="code">${esc(cmd)}</pre>
      <div class="row">
        <button class="btn btn-primary" data-allow="${esc(a.id)}" type="button">Duyệt và chạy</button>
        <button class="btn btn-danger" data-deny="${esc(a.id)}" type="button">Từ chối</button>
      </div>
      <p class="muted">${mode === 'live' ? 'Quyết định được gửi thẳng về terminal của phiên này qua hook.' : 'Đây là dữ liệu giả lập. Khi chạy thật, quyết định sẽ gửi về terminal qua hook.'}</p>`);
  }

  // ---------------------------------------------------------------- modals
  function openModal(title, html) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modal').hidden = false;
    $('modalClose').focus();
  }
  function closeModal() { $('modal').hidden = true; }

  function openTimeline() {
    const now = Date.now();
    const span = 60 * 60 * 1000;
    const from = now - span;
    const colors = { bash: 'var(--info)', edit: 'var(--good)', read: 'var(--muted)', web: 'var(--helper)', agent: 'var(--helper)', attention: 'var(--warn)', done: 'var(--fg)', task: 'var(--accent)' };
    const rows = state.sessions.map((s) => {
      const ev = state.events.filter((e) => e.sessionId === s.id && e.ts >= from);
      const marks = ev.map((e) => `<i style="left:${((e.ts - from) / span) * 100}%;background:${colors[e.kind] || 'var(--muted)'}" title="${esc(hhmm(e.ts) + ' ' + e.text)}"></i>`).join('');
      return `<span class="tl-name">${esc(s.name)}</span><span class="tl-track">${marks}</span>`;
    }).join('');
    const waits = state.approvals.map((a) => `<li><b>${esc(nameOf(a.sessionId))}</b> chờ bạn ${ago(now - a.createdAt)}: ${esc(a.summary)}</li>`).join('');
    openModal('Dòng thời gian 60 phút qua', `
      <div class="legend"><span><i class="dot" style="background:var(--info)"></i>Lệnh</span><span><i class="dot" style="background:var(--good)"></i>Sửa file</span><span><i class="dot" style="background:var(--muted)"></i>Đọc</span><span><i class="dot" style="background:var(--helper)"></i>Web / trợ lý</span><span><i class="dot" style="background:var(--warn)"></i>Chờ duyệt</span><span><i class="dot" style="background:var(--accent)"></i>Nhận việc</span></div>
      <div class="tl">${rows || '<span class="muted">Chưa có phiên nào.</span>'}<span class="tl-axis"><span>${hhmm(from)}</span><span>${hhmm(from + span / 2)}</span><span>${hhmm(now)}</span></span></div>
      <h4>Đang chờ bạn</h4>
      ${waits ? `<ul>${waits}</ul>` : '<p class="muted">Không ai phải chờ. Tốt lắm, sếp.</p>'}`);
  }

  function openSummary() {
    const rows = state.sessions.slice().sort((a, b) => (b.cost || 0) - (a.cost || 0)).map((s) => {
      const st = s.stats;
      const actions = (st.read || 0) + (st.edit || 0) + (st.bash || 0) + (st.web || 0) + (st.agent || 0);
      return `<tr><td>${esc(s.name)}</td><td>${actions}</td><td>${st.edit || 0}</td><td>${st.bash || 0}</td><td>${st.agent || 0}</td><td>$${(s.cost || 0).toFixed(2)}</td></tr>`;
    }).join('');
    const total = state.sessions.reduce((n, s) => n + (s.cost || 0), 0);
    const top = state.sessions.slice().sort((a, b) => ((b.stats.edit || 0) + (b.stats.bash || 0)) - ((a.stats.edit || 0) + (a.stats.bash || 0)))[0];
    openModal('Tổng kết', `
      <p>${top ? `Nhân viên chăm nhất: <b>${esc(top.name)}</b>. ` : ''}Tổng chi phí ước tính: <b class="mono">$${total.toFixed(2)}</b>${mode === 'live' ? ' (tính từ số token trong transcript, theo bảng giá trong server.js).' : ' (dữ liệu giả lập).'}</p>
      <div class="table-wrap"><table class="sum"><thead><tr><th>Phiên</th><th>Thao tác</th><th>Sửa</th><th>Lệnh</th><th>Trợ lý</th><th>Giá ≈</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  function openSettings() {
    const live = mode === 'live';
    openModal('Cài đặt', `
      <h4>Nguồn dữ liệu</h4>
      <div class="row"><div class="seg"><button type="button" id="segDemo" class="${live ? '' : 'on'}">Giả lập</button><button type="button" id="segLive" class="${live ? 'on' : ''}">Claude Code thật</button></div></div>
      <p class="muted">Chế độ thật cần chạy server trên máy bạn: <span class="mono">node my-office/server.js</span>, rồi mở <span class="mono">http://127.0.0.1:4317</span>. Server đọc transcript trong <span class="mono">~/.claude/projects</span>.</p>
      <h4>Duyệt quyền ngay trong văn phòng</h4>
      <p>Thêm hook này vào <span class="mono">~/.claude/settings.json</span>. Khi Claude xin quyền, yêu cầu hiện ở cột Hoạt động. Nếu văn phòng không mở, terminal vẫn hỏi như bình thường.</p>
      <pre class="code">{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node /đường/dẫn/tới/my-office/hooks/office-approve.js",
            "timeout": 130
          }
        ]
      }
    ]
  }
}</pre>
      <h4>Phím tắt</h4>
      <dl class="kv"><dt>Kéo chuột</dt><dd>Di chuyển camera</dd><dt>Cuộn / chụm hai ngón</dt><dd>Phóng to, thu nhỏ</dd><dt>Bấm vào nhân viên</dt><dd>Xem phiên đó</dd><dt>W A S D</dt><dd>Đi lại khi đang hoá thân</dd><dt>Esc</dt><dd>Bỏ chọn, đóng hộp thoại</dd></dl>`);
    $('segDemo').onclick = () => { useDemo(); closeModal(); toast('Đã chuyển sang dữ liệu giả lập'); };
    $('segLive').onclick = () => {
      closeModal();
      useLive(() => { toast('Không kết nối được server. Chạy node my-office/server.js trên máy bạn rồi mở localhost:4317.'); useDemo(); });
    };
  }

  // ---------------------------------------------------------------- misc ui
  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }
  function select(id) {
    selected = selected === id ? null : id;
    window.Office.setSelected(selected);
    if (selected) window.Office.focusOn(selected);
    renderSessions(); renderFeed();
  }

  function bind() {
    $('sessionList').addEventListener('click', (e) => { const b = e.target.closest('.session'); if (b) select(b.dataset.id); });
    $('search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderSessions(); });
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-allow],[data-deny],[data-open]');
      if (!t) return;
      if (t.dataset.allow) decide(t.dataset.allow, 'allow');
      else if (t.dataset.deny) decide(t.dataset.deny, 'deny');
      else openApproval(t.dataset.open);
    });
    $('filters').addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      filter = c.dataset.filter;
      document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === c));
      renderFeed();
    });
    document.querySelectorAll('.tool[data-view]').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.tool[data-view]').forEach((x) => x.classList.toggle('active', x === b));
      window.Office.setView(b.dataset.view);
    }));
    $('zoomIn').onclick = () => window.Office.zoomBy(1.2);
    $('zoomOut').onclick = () => window.Office.zoomBy(1 / 1.2);
    $('btnFull').onclick = () => {
      const st = $('stage');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (st.requestFullscreen) st.requestFullscreen().catch(() => toast('Trình duyệt này không cho toàn màn hình.'));
      else toast('Trình duyệt này không cho toàn màn hình.');
    };
    $('btnShot').onclick = () => {
      const url = window.Office.screenshot();
      openModal('Ảnh chụp văn phòng', `<img src="${url}" alt="Ảnh chụp văn phòng lúc ${hhmm(Date.now())}" style="width:100%;border-radius:8px;border:1px solid var(--line)"><p class="muted">Nhấn giữ hoặc chuột phải vào ảnh để lưu.</p>${mode === 'live' ? `<a class="btn btn-primary" href="${url}" download="my-office-${Date.now()}.png">Tải ảnh PNG</a>` : ''}`);
    };
    $('btnLabels').onclick = () => { const on = window.Office.toggleLabels(); toast(on ? 'Hiện nhãn tên' : 'Ẩn nhãn tên'); };
    $('btnAvatar').onclick = () => {
      avatar = !avatar;
      $('btnAvatar').classList.toggle('active', avatar);
      $('avatarHint').hidden = !avatar;
      window.Office.setAvatar(avatar);
    };
    $('btnNight').onclick = () => { const n = !window.Office.isNight(); window.Office.setNight(n); toast(n ? 'Văn phòng ban đêm' : 'Văn phòng ban ngày'); };
    $('btnTimeline').onclick = openTimeline;
    $('linkTimeline').onclick = openTimeline;
    $('linkSummary').onclick = openSummary;
    $('btnSettings').onclick = openSettings;
    $('modalClose').onclick = closeModal;
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('modal').hidden) closeModal();
      else if (selected) select(selected);
    });
    const tick = () => { const d = new Date(); $('clock').textContent = hhmm(d); };
    tick(); setInterval(tick, 10000);
    setInterval(() => renderSessions(), 15000); // cập nhật "chờ x phút"
  }

  // ---------------------------------------------------------------- boot
  window.Office.init($('office'), {
    onSelect: select,
    onZoom: (z) => { $('zoomLabel').textContent = Math.round(z * 100) + '%'; },
  });
  bind();
  const h = new Date().getHours();
  if (h >= 19 || h < 6) window.Office.setNight(true);
  // chạy từ server cục bộ => thử dữ liệu thật trước, không được thì dùng giả lập
  if (new URLSearchParams(location.search).has('demo')) useDemo();
  else if (/^https?:$/.test(location.protocol) && /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) || new URLSearchParams(location.search).has('live')) {
    useLive(useDemo);
  } else useDemo();
})();
