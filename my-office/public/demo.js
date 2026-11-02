// Bộ giả lập: tạo dữ liệu giống hệt server để văn phòng chạy được khi không có Claude Code.
(function () {
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const uid = () => Math.random().toString(36).slice(2, 10);
  const MIN = 60 * 1000;

  const SCRIPTS = {
    'shop-api': {
      cwd: '~/code/shop-api',
      tasks: ['Thêm API giỏ hàng', 'Sửa lỗi thanh toán trùng', 'Viết test cho đơn hàng'],
      actions: [['read', 'Đọc src/routes/cart.ts'], ['edit', 'Sửa src/routes/cart.ts'], ['bash', 'Chạy npm test'], ['read', 'Tìm "createOrder"'], ['edit', 'Sửa src/models/order.ts']],
      asks: [['Bash', { command: 'npm install zod', description: 'Cài thư viện zod' }], ['Bash', { command: 'npx prisma migrate dev', description: 'Chạy migrate cơ sở dữ liệu' }]],
    },
    infra: {
      cwd: '~/code/infra',
      tasks: ['Tăng RAM cho máy chủ staging', 'Thêm cảnh báo CPU'],
      actions: [['read', 'Đọc staging/main.tf'], ['edit', 'Sửa staging/variables.tf'], ['bash', 'Chạy terraform plan'], ['web', 'Tra web "aws t3.large memory"']],
      asks: [['Bash', { command: 'terraform apply -auto-approve', description: 'Chạy terraform apply' }]],
    },
    'landing-page': {
      cwd: '~/code/landing-page',
      tasks: ['Làm lại phần hero', 'Tối ưu ảnh cho mobile'],
      actions: [['read', 'Đọc app/page.tsx'], ['edit', 'Sửa components/Hero.tsx'], ['web', 'Tra web "so sánh 3 mẫu hero trên Dribbble"'], ['bash', 'Chạy npm run build']],
      asks: [['Bash', { command: 'npm run deploy:preview', description: 'Đẩy bản xem trước' }]],
      helper: ['general-purpose', 'So sánh 3 mẫu hero trên Dribbble'],
    },
    'data-pipeline': {
      cwd: '~/code/data-pipeline',
      tasks: ['Sửa job ETL đơn hàng', 'Thêm cột doanh thu theo ngày'],
      actions: [['edit', 'Sửa etl/orders.py'], ['read', 'Đọc etl/schema.sql'], ['bash', 'Chạy pytest tests/etl'], ['read', 'Tìm "daily_revenue"']],
      asks: [['Bash', { command: 'python -m etl.backfill --days 30', description: 'Chạy backfill 30 ngày' }]],
      helper: ['Explore', 'Tìm nơi tính doanh thu'],
    },
    'docs-site': {
      cwd: '~/code/docs-site',
      tasks: ['Viết trang hướng dẫn cài đặt', 'Sửa link hỏng'],
      actions: [['read', 'Đọc docs/intro.md'], ['edit', 'Sửa docs/install.md'], ['web', 'Đọc web nodejs.org/en/download'], ['bash', 'Chạy npm run lint:links']],
      asks: [['Write', { file_path: 'docs/install.md' }]],
    },
    'mobile-app': {
      cwd: '~/code/mobile-app',
      tasks: ['Đăng nhập Google bằng expo-auth-session', 'Sửa lỗi bàn phím che ô nhập'],
      actions: [['bash', 'Chạy typecheck'], ['edit', 'Sửa app/login.tsx'], ['read', 'Đọc app.json'], ['web', 'Tra web "expo auth session google"']],
      asks: [['Bash', { command: 'npx expo prebuild --clean', description: 'Tạo lại thư mục native' }]],
      helper: ['general-purpose', 'Đọc tài liệu expo-auth-session'],
    },
  };

  const now = Date.now();
  const sessions = Object.entries(SCRIPTS).map(([name, sc], i) => ({
    id: 'demo-' + name,
    name,
    cwd: sc.cwd,
    title: sc.tasks[0],
    model: 'claude',
    status: 'working',
    activity: { kind: 'think', text: `Nhận việc: "${sc.tasks[0]}"` },
    startedAt: now - (5 + i * 7) * MIN,
    lastAt: now - Math.random() * 20000,
    helpers: [],
    stats: { read: 1 + i, edit: i % 3, bash: (i + 1) % 3, web: i % 2, agent: 0 },
    tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    cost: 0.8 + i * 0.9 + Math.random(),
    approvalId: null,
    _restUntil: 0,
  }));
  const byName = Object.fromEntries(sessions.map((s) => [s.name, s]));
  const events = [];
  const approvals = new Map();

  function push(s, kind, text, status, extra = {}) {
    events.push({ id: uid(), sessionId: s.id, ts: Date.now(), kind, text, status, ...extra });
    if (events.length > 200) events.shift();
  }

  function ask(s) {
    const [tool, input] = rnd(SCRIPTS[s.name].asks);
    const summary = input.description || `Sửa ${input.file_path}`;
    const a = { id: uid(), sessionId: s.id, tool, input, summary, cwd: s.cwd, createdAt: Date.now(), state: 'pending' };
    approvals.set(a.id, a);
    s.status = 'waiting';
    s.approvalId = a.id;
    s.activity = { kind: 'attention', text: `Chờ bạn duyệt: ${summary}` };
    push(s, 'attention', `Chờ bạn duyệt: ${summary}`, 'attention', { approvalId: a.id });
  }

  function step(s) {
    const sc = SCRIPTS[s.name];
    s.lastAt = Date.now();
    if (s.status === 'idle') {
      if (Date.now() < s._restUntil) return;
      const t = rnd(sc.tasks);
      s.status = 'working';
      s.title = t;
      s.activity = { kind: 'think', text: `Nhận việc: "${t}"` };
      push(s, 'task', s.activity.text, 'working');
      return;
    }
    if (s.status !== 'working') return;
    const r = Math.random();
    if (r < 0.1) return ask(s);
    if (r < 0.17 && sc.helper && !s.helpers.length) {
      const h = { id: uid(), type: sc.helper[0], desc: sc.helper[1], until: Date.now() + 14000 + Math.random() * 10000 };
      s.helpers.push(h);
      s.stats.agent++;
      s.activity = { kind: 'agent', text: `Gọi trợ lý ${h.type}`, detail: h.desc };
      push(s, 'agent', `Gọi trợ lý ${h.type}`, 'helper', { detail: h.desc });
      return;
    }
    if (r < 0.24 && !s.helpers.length) {
      s.status = 'idle';
      s._restUntil = Date.now() + 15000 + Math.random() * 25000;
      s.activity = { kind: 'done', text: 'Vừa xong việc' };
      push(s, 'done', 'Xong việc, đi pha cà phê', 'done');
      return;
    }
    const [kind, text] = rnd(sc.actions);
    s.activity = { kind, text };
    s.stats[kind] = (s.stats[kind] || 0) + 1;
    s.cost += 0.01 + Math.random() * 0.06;
    push(s, kind, text, 'working');
  }

  // trạng thái mở đầu giống một buổi sáng bận rộn
  [['data-pipeline', 'read', 'Đọc etl/schema.sql'], ['docs-site', 'read', 'Đọc docs/intro.md'], ['mobile-app', 'bash', 'Chạy typecheck'], ['landing-page', 'web', 'Tra web "so sánh 3 mẫu hero"'], ['data-pipeline', 'edit', 'Sửa etl/orders.py'], ['docs-site', 'edit', 'Sửa docs/install.md']]
    .forEach(([n, k, t], i) => { const s = byName[n]; s.activity = { kind: k, text: t }; push(s, k, t, 'working'); events[events.length - 1].ts = now - (60 - i * 8) * 1000; });
  byName['data-pipeline'].helpers.push({ id: uid(), type: 'Explore', desc: 'Tìm nơi tính doanh thu', until: now + 20000 });
  push(byName['data-pipeline'], 'agent', 'Gọi trợ lý Explore', 'helper', { detail: 'Tìm nơi tính doanh thu' });
  byName['landing-page'].helpers.push({ id: uid(), type: 'general-purpose', desc: 'So sánh 3 mẫu hero trên Dribbble', until: now + 30000 });
  const mob = byName['mobile-app'];
  mob.status = 'idle'; mob._restUntil = now + 25000; mob.activity = { kind: 'done', text: 'Vừa xong việc' };
  push(mob, 'done', 'Xong việc, đi pha cà phê', 'done');
  ask(byName['shop-api']);
  ask(byName.infra);
  SCRIPTS.infra.asks.length && (byName.infra.title = 'Tăng RAM cho máy chủ staging');

  let listener = null;
  function snapshot() {
    const used = 0.74 + Math.sin(Date.now() / 20000) * 0.05;
    return {
      mode: 'demo',
      now: Date.now(),
      machine: { name: 'Máy Mac', memUsed: used * 16 * 2 ** 30, memTotal: 16 * 2 ** 30 },
      sessions: sessions.map(({ _restUntil, ...s }) => ({ ...s, helpers: s.helpers.map(({ until, ...h }) => h) })),
      events: events.slice(),
      approvals: [...approvals.values()].filter((a) => a.state === 'pending'),
    };
  }
  function emit() { listener && listener(snapshot()); }

  let timer = null;
  window.DemoFeed = {
    start(cb) {
      listener = cb;
      emit();
      clearInterval(timer);
      timer = setInterval(() => {
        const t = Date.now();
        for (const s of sessions) {
          for (const h of s.helpers.slice()) {
            if (t > h.until) {
              s.helpers.splice(s.helpers.indexOf(h), 1);
              push(s, 'agent', `Trợ lý ${h.type} báo cáo xong`, 'helper');
            }
          }
        }
        step(rnd(sessions));
        if (Math.random() < 0.35) step(rnd(sessions));
        emit();
      }, 1700);
    },
    stop() { clearInterval(timer); listener = null; },
    decide(id, behavior) {
      const a = approvals.get(id);
      if (!a || a.state !== 'pending') return;
      a.state = 'decided';
      const s = sessions.find((x) => x.id === a.sessionId);
      s.approvalId = null;
      s.status = 'working';
      s.lastAt = Date.now();
      if (behavior === 'allow') {
        s.stats.bash++;
        s.activity = { kind: 'bash', text: a.summary };
        push(s, 'bash', `Đã duyệt: ${a.summary}`, 'working');
      } else {
        s.activity = { kind: 'think', text: 'Tìm cách khác' };
        push(s, 'attention', `Đã từ chối: ${a.summary}`, 'working');
      }
      emit();
    },
  };
})();
