// D9-6 跨客户端互通 + D9-9 capabilities.cancellation 探针（OpenClaw Linux, v1.1.5）
import { spawn } from 'node:child_process';
const SP = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

function make() {
  const p = spawn(process.execPath, [SP], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = Buffer.alloc(0);
  const pend = new Map(); let id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    p.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pend.set(o.id, r));
  }
  p.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      let msg; try { msg = JSON.parse(body); } catch { continue; }
      if (msg.id != null && pend.has(msg.id)) { pend.get(msg.id)(msg); pend.delete(msg.id); }
    }
  });
  return { send, kill: () => p.kill() };
}

let pass = 0, fail = 0, spec = 0; const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected; ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D9-9: capabilities.cancellation 是否声明
{
  const s = make();
  try {
    const init = await s.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-probe', version: '1' } } });
    const caps = init?.result?.capabilities || {};
    const cancDeclared = caps.notifications?.cancellation === true;
    const verdict = cancDeclared ? 'PASS' : 'SPEC-MISMATCH';
    if (cancDeclared) pass++; else spec++;
    lines.push(`${verdict}  D9-9  capabilities.cancellation 声明  => ${JSON.stringify(cancDeclared)} (期望: 声明 notifications.cancellation; 实际 capabilities.notifications=${JSON.stringify(caps.notifications ?? '(缺失)')})`);
  } catch (e) {
    fail++;
    lines.push(`FAIL  D9-9  探测异常  => ${e.message}`);
  }
  s.kill();
}

// D9-6: 10 客户端 clientInfo 均可互通（initialize + tools/list）
{
  const CLIENTS = ['OpenCode', 'Codex', 'CodeArtsAgent', 'CodeArtsWork', 'WorkBuddy', 'DSH', 'OfficeAce', 'Hermes', 'OpenClaw', 'AtomCode'];
  let ok6 = 0;
  for (const cn of CLIENTS) {
    const s = make();
    try {
      const i = await s.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: cn, version: '1' } } });
      const t = await s.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      if (i?.result && Array.isArray(t?.result?.tools) && t.result.tools.length > 0) ok6++;
    } catch {}
    s.kill();
  }
  check('D9-6', '10 客户端 clientInfo 均可互通', `${ok6}/10`, '10/10');
}

console.log('\n=== D9-6 / D9-9 跨客户端互通 + 取消能力探针结果 ===');
for (const l of lines) console.log(l);
console.log(`TOTAL pass=${pass} fail=${fail} spec=${spec}`);
process.exit(fail > 0 ? 1 : 0);