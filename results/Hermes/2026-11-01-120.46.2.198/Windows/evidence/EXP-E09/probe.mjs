// probe for case EXP-E09 (service catalog routing)
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
const INTENT = "开设一个 Kubernetes 集群用于微服务部署";
const EXPECT = ["CCE"];

const child = spawn(process.execPath, [SERVER], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
let buf = Buffer.alloc(0);
const pending = new Map(); let _id = 1;
function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r => pending.set(o.id, r)); }
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString());
    if (!m) { buf = buf.slice(h+4); continue; }
    const n = +m[1]; if (buf.length < h+4+n) break;
    const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
    try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});
function call(name, arguments_) { return send({ jsonrpc:'2.0', id:_id++, method:'tools/call', params:{ name, arguments: arguments_ || {} } }); }

await send({ jsonrpc:'2.0', id:_id++, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{ name:'probe', version:'1' } } });
child.stdin.write(''); // noop
const resp = await call('huaweicloud_service_catalog', { intent: INTENT });
const text = (resp?.result?.content?.[0]?.text) || '';
let rr = {}; try { rr = text ? JSON.parse(text) : {}; } catch { rr = {}; }
const svcs = rr.recommendedServices || [];
let verdict, status, why;
if (EXPECT === null) {
  verdict = 'N/A'; status = 'PASS';
  why = '诊断类意图（explain_error），不查服务目录；catalog 返回=' + (svcs.join('+') || '(空)');
} else {
  const hit = EXPECT.some(s => svcs.includes(s));
  verdict = hit ? 'HIT' : 'MISS';
  status = hit ? 'PASS' : 'FAIL';
  why = verdict + ' expected=' + EXPECT.join('/') + ' got=' + (svcs.join('+') || '(空)');
}
const out = { status, why: 'serviceCatalog路由:' + why + '; prompt=' + INTENT, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'EXP-E09' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
child.kill(); process.exit(0);
