#!/usr/bin/env node
// Hook PermissionRequest cho Claude Code.
// Khi Claude xin quyền (chạy lệnh, sửa file...), hook gửi yêu cầu lên My Office
// và chờ bạn bấm Duyệt / Từ chối trên web.
// Nếu My Office không chạy hoặc hết thời gian chờ, hook thoát im lặng
// và Claude Code hiện hộp thoại xin quyền bình thường trong terminal.

const BASE = process.env.OFFICE_URL || 'http://127.0.0.1:4317';
const WAIT_MS = Number(process.env.OFFICE_WAIT_MS || 120000);

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let input;
  try { input = JSON.parse(await readStdin()); } catch { process.exit(0); }
  try {
    const res = await fetch(`${BASE}/api/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) process.exit(0);
    const { id } = await res.json();
    const until = Date.now() + WAIT_MS;
    while (Date.now() < until) {
      await sleep(800);
      const r = await fetch(`${BASE}/api/approvals/${id}`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
      if (!r || !r.ok) continue;
      const a = await r.json();
      if (a.state === 'decided' && a.decision) {
        const decision = { behavior: a.decision.behavior };
        if (decision.behavior === 'deny') decision.message = a.decision.message || 'Bị từ chối trong My Office';
        process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PermissionRequest', decision } }));
        process.exit(0);
      }
      if (a.state === 'expired') break;
    }
  } catch {
    // server không chạy: để Claude Code hỏi như bình thường
  }
  process.exit(0);
})();
