// probe-sandbox-exec.mjs — sandbox 执行层探测（确定性，零 LLM 成本）：
//   connect → exec_one_shot(固定命令) → 断言输出含标记 → close_session（归零）
// 结论价值：把「sandbox 待测/需真容器」变成「已实测可执行 + 可复跑」，且不依赖 LLM。
// 用法: node l2/probe-sandbox-exec.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.env.BENCH_MCP_SERVER || 'C:/Users/Administrator/.dsh/huaweicloud-plugins/src/mcp-server.mjs';
const MARK = 'DEVKIT_BENCH_SANDBOX_OK';

function detectVersion() {
  try {
    let dir = dirname(serverPath);
    for (let i = 0; i < 6; i++) {
      const p = join(dir, 'package.json');
      if (existsSync(p)) { try { const k = JSON.parse(readFileSync(p, 'utf-8')); if (k.name === 'huaweicloud-devkit') return `${k.name}@${k.version}`; } catch { } }
      const up = dirname(dir); if (up === dir) break; dir = up;
    }
  } catch { }
  return 'unknown';
}

const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
const send = (o) => { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); };
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  for (;;) {
    const h = buf.indexOf('\r\n\r\n'); if (h < 0) return;
    const len = Number(/(?:^|\r\n)Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString())?.[1] || 0);
    const body = buf.slice(h + 4, h + 4 + len); if (body.length < len) return;
    buf = buf.slice(h + 4 + len);
    try { const o = JSON.parse(body.toString()); if (o.id && pending.has(o.id)) { pending.get(o.id)(o); pending.delete(o.id); } } catch { }
  }
});
const call = (name, args) => send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args } });
const txtOf = (r) => ((r.result?.content || []).filter((x) => x.type === 'text').map((x) => x.text).join('\n') || JSON.stringify(r.error || {}));
const jsonOf = (r) => { try { return JSON.parse(txtOf(r)); } catch { return null; } };

const steps = [];
await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'sandbox-probe', version: '1' } } });

const c = jsonOf(await call('huaweicloud_sandbox_connect', {}));
const sid = c?.devStageId || c?.sessionId || c?.workspace_id;
steps.push({ step: 'connect', ok: !!sid, detail: JSON.stringify(c).slice(0, 160) });
console.log(`connect        ${sid ? 'OK' : 'FAIL'}  devStageId=${sid || '-'}`);

let execOk = false, execSample = '';
try {
  const r = await call('huaweicloud_sandbox_exec_one_shot', { command: `echo ${MARK}` });
  execSample = txtOf(r).slice(0, 220);
  execOk = execSample.includes(MARK);
  steps.push({ step: 'exec_one_shot', ok: execOk, detail: execSample });
  console.log(`exec_one_shot  ${execOk ? 'OK' : 'FAIL'}  ${execSample.replace(/\s+/g, ' ').slice(0, 110)}`);
} catch (e) {
  steps.push({ step: 'exec_one_shot', ok: false, detail: String(e).slice(0, 160) });
  console.log('exec_one_shot  FAIL', String(e).slice(0, 110));
}

let closed = false, closeSample = '';
try {
  const r = await call('huaweicloud_sandbox_close_session', sid ? { workspace_id: sid } : {});
  closeSample = txtOf(r).slice(0, 160);
  closed = !/error|required|not\s+found|失败/i.test(closeSample);
  steps.push({ step: 'close_session', ok: closed, detail: closeSample });
  console.log(`close_session  ${closed ? 'OK（已归零）' : 'FAIL'}  ${closeSample.replace(/\s+/g, ' ').slice(0, 90)}`);
} catch (e) {
  steps.push({ step: 'close_session', ok: false, detail: String(e).slice(0, 160) });
  console.log('close_session  FAIL', String(e).slice(0, 110));
}

const outDir = join(__dirname, 'results');
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const v = detectVersion();
writeFileSync(join(outDir, `sandbox-exec-${ts}-${String(v).replace(/[^0-9A-Za-z.-]/g, '_')}.json`),
  JSON.stringify({ meta: { ts, mode: 'sandbox-exec-probe', mcpServer: serverPath, devkitVersion: v, connectOk: !!sid, execOk, closedOk: closed }, steps }, null, 2), 'utf-8');
console.log(`\n=== sandbox 执行层探测：connect=${!!sid ? 'OK' : 'FAIL'} exec=${execOk ? 'OK' : 'FAIL'} close=${closed ? 'OK' : 'FAIL'} ===`);
console.log(`被测版本=${v}`);
console.log(`结果落盘: l2/results/sandbox-exec-${ts}-${String(v).replace(/[^0-9A-Za-z.-]/g, '_')}.json`);
child.kill();
process.exit(execOk && closed ? 0 : 1);