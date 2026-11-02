#!/usr/bin/env node
// My Office — server nhỏ đọc transcript Claude Code (~/.claude/projects/**/*.jsonl)
// rồi đẩy trạng thái các phiên lên trình duyệt qua Server-Sent Events.
// Không dùng thư viện ngoài: chỉ cần Node 18+.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = Number(process.env.OFFICE_PORT || 4317);
const HOST = process.env.OFFICE_HOST || '127.0.0.1';
const PROJECTS_DIR = process.env.CLAUDE_PROJECTS_DIR || path.join(os.homedir(), '.claude', 'projects');
const LOOKBACK_HOURS = Number(process.env.OFFICE_LOOKBACK_HOURS || 24);
const ACTIVE_MS = 90 * 1000;        // không có dòng mới trong 90s => coi như nghỉ
const APPROVAL_TTL_MS = 10 * 60 * 1000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Giá ước tính theo USD / 1 triệu token. Chỉnh lại theo bảng giá bạn đang dùng.
const PRICING = [
  { match: /opus/i, input: 5, output: 25 },
  { match: /haiku/i, input: 1, output: 5 },
  { match: /.*/, input: 3, output: 15 }, // sonnet / mặc định
];

// ---------------------------------------------------------------- state
const files = new Map();      // filePath -> { offset, partial }
const sessions = new Map();   // sessionId -> session
const events = [];            // các sự kiện gần nhất (mới nhất ở cuối)
const approvals = new Map();  // approvalId -> approval
const MAX_EVENTS = 400;
let version = 0;

function shortPath(p) {
  if (!p) return '';
  const parts = String(p).split(/[\\/]/).filter(Boolean);
  return parts.slice(-2).join('/');
}

function describeTool(name, input = {}) {
  const n = String(name || '');
  if (n === 'Bash') return { kind: 'bash', text: input.description || trim(input.command, 70) };
  if (n === 'Edit' || n === 'MultiEdit' || n === 'Write' || n === 'NotebookEdit')
    return { kind: 'edit', text: `Sửa ${shortPath(input.file_path || input.notebook_path)}` };
  if (n === 'Read') return { kind: 'read', text: `Đọc ${shortPath(input.file_path)}` };
  if (n === 'Glob' || n === 'Grep') return { kind: 'read', text: `Tìm "${trim(input.pattern, 40)}"` };
  if (n === 'WebFetch') return { kind: 'web', text: `Đọc web ${trim(input.url, 50)}` };
  if (n === 'WebSearch') return { kind: 'web', text: `Tra web "${trim(input.query, 50)}"` };
  if (n === 'Task' || n === 'Agent')
    return { kind: 'agent', text: `Gọi trợ lý ${input.subagent_type || 'general-purpose'}`, detail: trim(input.description || input.prompt, 80) };
  if (n === 'TodoWrite') return { kind: 'plan', text: 'Cập nhật danh sách việc' };
  if (n.startsWith('mcp__')) return { kind: 'web', text: `Dùng ${n.split('__').slice(1).join(' · ')}` };
  return { kind: 'tool', text: n };
}

function trim(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function getSession(id, filePath) {
  let s = sessions.get(id);
  if (!s) {
    s = {
      id,
      file: filePath,
      name: path.basename(path.dirname(filePath)),
      cwd: '',
      title: '',
      model: '',
      startedAt: null,
      lastAt: null,
      lastStop: null,
      activity: { kind: 'idle', text: 'Mới vào văn phòng' },
      helpers: {},
      stats: { read: 0, edit: 0, bash: 0, web: 0, agent: 0 },
      tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      cost: 0,
    };
    sessions.set(id, s);
  }
  return s;
}

function pushEvent(s, ev) {
  events.push({ id: crypto.randomUUID(), sessionId: s.id, ts: ev.ts || Date.now(), ...ev });
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
}

function priceFor(model) {
  return PRICING.find((p) => p.match.test(model || '')) || PRICING[PRICING.length - 1];
}

function handleLine(line, filePath) {
  let d;
  try { d = JSON.parse(line); } catch { return; }
  const id = d.sessionId || path.basename(filePath, '.jsonl');
  const s = getSession(id, filePath);
  if (d.type === 'ai-title' && d.aiTitle) { s.title = d.aiTitle; return; }
  if (d.cwd && !s.cwd) { s.cwd = d.cwd; s.name = path.basename(d.cwd); }
  const ts = d.timestamp ? Date.parse(d.timestamp) : null;
  if (ts) { s.startedAt = s.startedAt || ts; s.lastAt = Math.max(s.lastAt || 0, ts); }
  const msg = d.message;
  if (!msg || !Array.isArray(msg.content)) {
    if (d.type === 'user' && typeof msg?.content === 'string' && !d.isMeta) {
      s.lastStop = null;
      s.activity = { kind: 'think', text: `Nhận việc: "${trim(msg.content, 60)}"` };
      pushEvent(s, { ts, kind: 'task', text: s.activity.text, status: 'working' });
    }
    return;
  }

  if (d.type === 'assistant') {
    if (msg.model) s.model = msg.model;
    const u = msg.usage;
    if (u && msg.id && s._lastMsgId !== msg.id) {
      s._lastMsgId = msg.id;
      const p = priceFor(s.model);
      const inp = u.input_tokens || 0, out = u.output_tokens || 0;
      const cr = u.cache_read_input_tokens || 0, cw = u.cache_creation_input_tokens || 0;
      s.tokens.input += inp; s.tokens.output += out; s.tokens.cacheRead += cr; s.tokens.cacheWrite += cw;
      s.cost += (inp * p.input + out * p.output + cr * p.input * 0.1 + cw * p.input * 1.25) / 1e6;
    }
    s.lastStop = msg.stop_reason || null;
    for (const c of msg.content) {
      if (c.type === 'tool_use') {
        const t = describeTool(c.name, c.input);
        s.activity = t;
        if (s.stats[t.kind] !== undefined) s.stats[t.kind]++;
        if (t.kind === 'agent') s.helpers[c.id] = { id: c.id, type: c.input?.subagent_type || 'general-purpose', desc: t.detail || '' };
        pushEvent(s, { ts, kind: t.kind, text: t.text, detail: t.detail, status: t.kind === 'agent' ? 'helper' : 'working' });
      }
    }
    if (msg.stop_reason === 'end_turn') {
      s.activity = { kind: 'done', text: 'Vừa xong việc' };
      pushEvent(s, { ts, kind: 'done', text: 'Xong việc, đi pha cà phê', status: 'done' });
    }
  } else if (d.type === 'user') {
    for (const c of msg.content) {
      if (c.type === 'tool_result' && s.helpers[c.tool_use_id]) {
        const h = s.helpers[c.tool_use_id];
        delete s.helpers[c.tool_use_id];
        pushEvent(s, { ts, kind: 'agent', text: `Trợ lý ${h.type} báo cáo xong`, status: 'helper' });
      } else if (c.type === 'text' && !d.isMeta && !String(c.text).startsWith('<')) {
        s.lastStop = null;
        s.activity = { kind: 'think', text: `Nhận việc: "${trim(c.text, 60)}"` };
        pushEvent(s, { ts, kind: 'task', text: s.activity.text, status: 'working' });
      }
    }
  }
}

function readNew(filePath) {
  let st;
  try { st = fs.statSync(filePath); } catch { return false; }
  let f = files.get(filePath);
  if (!f) { f = { offset: 0, partial: '' }; files.set(filePath, f); }
  if (st.size < f.offset) { f.offset = 0; f.partial = ''; }
  if (st.size === f.offset) return false;
  const fd = fs.openSync(filePath, 'r');
  const len = st.size - f.offset;
  const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, f.offset);
  fs.closeSync(fd);
  f.offset = st.size;
  const text = f.partial + buf.toString('utf8');
  const lines = text.split('\n');
  f.partial = lines.pop();
  for (const l of lines) if (l.trim()) handleLine(l, filePath);
  return true;
}

function walk(dir, out, depth = 0) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && depth < 3) walk(p, out, depth + 1);
    else if (e.isFile() && e.name.endsWith('.jsonl')) out.push(p);
  }
}

function scan() {
  const list = [];
  walk(PROJECTS_DIR, list);
  const since = Date.now() - LOOKBACK_HOURS * 3600 * 1000;
  let changed = false;
  for (const p of list) {
    // bỏ qua transcript của sub-agent (đã thể hiện qua "trợ lý" của phiên cha)
    if (p.includes(`${path.sep}subagents${path.sep}`)) continue;
    let mtime = 0;
    try { mtime = fs.statSync(p).mtimeMs; } catch { continue; }
    if (mtime < since && !files.has(p)) continue;
    if (readNew(p)) changed = true;
  }
  if (changed) version++;
}

// ---------------------------------------------------------------- snapshot
function sessionStatus(s, now) {
  const pending = [...approvals.values()].find((a) => a.sessionId === s.id && a.state === 'pending');
  if (pending) return 'waiting';
  if (s.lastAt && now - s.lastAt < ACTIVE_MS && s.lastStop !== 'end_turn') return 'working';
  if (Object.keys(s.helpers).length && s.lastAt && now - s.lastAt < 15 * 60 * 1000) return 'working';
  return 'idle';
}

function snapshot() {
  const now = Date.now();
  // đặt tên trùng => thêm hậu tố
  const counts = {};
  const list = [...sessions.values()]
    .filter((s) => s.lastAt && now - s.lastAt < LOOKBACK_HOURS * 3600 * 1000)
    .sort((a, b) => b.lastAt - a.lastAt);
  for (const s of list) counts[s.name] = (counts[s.name] || 0) + 1;
  const seen = {};
  const out = list.map((s) => {
    seen[s.name] = (seen[s.name] || 0) + 1;
    const name = counts[s.name] > 1 ? `${s.name} #${seen[s.name]}` : s.name;
    const status = sessionStatus(s, now);
    const pending = [...approvals.values()].find((a) => a.sessionId === s.id && a.state === 'pending');
    return {
      id: s.id, name, cwd: s.cwd, title: s.title, model: s.model, status,
      activity: pending ? { kind: 'attention', text: `Chờ bạn duyệt: ${pending.summary}` } : s.activity,
      startedAt: s.startedAt, lastAt: s.lastAt,
      helpers: Object.values(s.helpers), stats: s.stats, tokens: s.tokens, cost: s.cost,
      approvalId: pending?.id || null,
    };
  });
  const total = os.totalmem(), free = os.freemem();
  return {
    mode: 'live',
    now,
    machine: { name: os.hostname(), memUsed: total - free, memTotal: total },
    sessions: out,
    events: events.slice(-200),
    approvals: [...approvals.values()].filter((a) => a.state === 'pending'),
  };
}

// ---------------------------------------------------------------- approvals (hook PermissionRequest)
function summarize(tool, input = {}) {
  if (tool === 'Bash') return trim(input.description || input.command, 60);
  return describeTool(tool, input).text;
}

function createApproval(body) {
  const id = crypto.randomUUID();
  const sid = body.session_id || '';
  if (body.transcript_path && fs.existsSync(body.transcript_path)) readNew(body.transcript_path);
  const s = sid ? getSession(sid, body.transcript_path || path.join(PROJECTS_DIR, 'unknown', sid + '.jsonl')) : null;
  if (s && body.cwd && !s.cwd) { s.cwd = body.cwd; s.name = path.basename(body.cwd); }
  const a = {
    id, sessionId: sid, tool: body.tool_name, input: body.tool_input || {},
    summary: summarize(body.tool_name, body.tool_input), cwd: body.cwd || '',
    createdAt: Date.now(), state: 'pending', decision: null,
  };
  approvals.set(id, a);
  if (s) pushEvent(s, { kind: 'attention', text: `Chờ bạn duyệt: ${a.summary}`, status: 'attention', approvalId: id });
  version++;
  return a;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, a] of approvals) {
    if (a.state === 'pending' && now - a.createdAt > APPROVAL_TTL_MS) { a.state = 'expired'; version++; }
    if (a.state !== 'pending' && now - a.createdAt > APPROVAL_TTL_MS * 2) approvals.delete(id);
  }
}, 5000);

// ---------------------------------------------------------------- http
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const clients = new Set();

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;

  if (p === '/api/stream') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (p === '/api/snapshot') return json(res, 200, snapshot());

  // Hook gửi yêu cầu duyệt
  if (p === '/api/approvals' && req.method === 'POST') {
    const body = await readBody(req);
    const a = createApproval(body);
    broadcast();
    return json(res, 200, { id: a.id });
  }
  const m = p.match(/^\/api\/approvals\/([\w-]+)(\/decide)?$/);
  if (m) {
    const a = approvals.get(m[1]);
    if (!a) return json(res, 404, { error: 'not_found' });
    if (m[2] && req.method === 'POST') {
      const body = await readBody(req);
      if (a.state === 'pending') {
        a.state = 'decided';
        a.decision = { behavior: body.behavior === 'allow' ? 'allow' : 'deny', message: body.message || '' };
        const s = sessions.get(a.sessionId);
        if (s) pushEvent(s, { kind: a.decision.behavior === 'allow' ? 'bash' : 'attention', text: `${a.decision.behavior === 'allow' ? 'Đã duyệt' : 'Đã từ chối'}: ${a.summary}`, status: 'working' });
        version++;
        broadcast();
      }
      return json(res, 200, { ok: true, state: a.state });
    }
    return json(res, 200, { state: a.state, decision: a.decision });
  }

  // file tĩnh
  let file = p === '/' ? '/index.html' : p;
  file = path.normalize(file).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(PUBLIC_DIR, file);
  if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Không tìm thấy'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

let lastSent = -1;
function broadcast(force) {
  if (!force && lastSent === version) return;
  lastSent = version;
  const payload = `data: ${JSON.stringify(snapshot())}\n\n`;
  for (const c of clients) c.write(payload);
}

scan();
setInterval(() => { scan(); broadcast(); }, 1500);
// gửi lại định kỳ để trạng thái "nghỉ" cập nhật theo thời gian dù không có dòng mới
setInterval(() => broadcast(true), 10000);

server.listen(PORT, HOST, () => {
  console.log(`\n  My Office đang chạy tại http://${HOST}:${PORT}`);
  console.log(`  Đọc transcript từ: ${PROJECTS_DIR}`);
  console.log(`  Số phiên tìm thấy (${LOOKBACK_HOURS} giờ qua): ${snapshot().sessions.length}\n`);
});
