// EXP-C4 service matrix: list_operations read-only plan smoke for 22 services
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const MCP = join(SRC, 'mcp-server.mjs');
const HOME = mkdtempSync(join(tmpdir(), 'hdk-c4-'));

const SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
const num = (s) => String(SERVICES.indexOf(s) + 1).padStart(2, '0');

function emit(id, cond, detail) { console.log(`RESULT ${id} ${cond ? 'PASS' : 'FAIL'} ${detail}`); }

const child = spawn(process.execPath, [MCP], { cwd: SRC, env: { ...process.env, HUAWEICLOUD_HOME: HOME, HCLOUD_BIN: 'hcloud' }, stdio: ['pipe','pipe','pipe'] });
let buf = Buffer.alloc(0); let pending = new Map(); let nextId = 1;
child.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]); let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.subarray(0, i).toString().trim(); buf = buf.subarray(i + 1); if (!line) continue; try { const m = JSON.parse(line); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } catch {} } });
function rpc(method, params, timeoutMs = 60000) { const id = nextId++; return new Promise((res, rej) => { const t = setTimeout(() => { pending.delete(id); rej(new Error('timeout')); }, timeoutMs); pending.set(id, (m) => { clearTimeout(t); res(m); }); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n'); }); }

await rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'c4', version: '1' } });

let pass = 0, fail = 0;
for (const svc of SERVICES) {
  const id = `EXP-C4-${num(svc)}`;
  try {
    const r = await rpc('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: svc } }, 90000);
    const txt = r.result?.content?.[0]?.text || '';
    const ok = !r.error && txt.length > 20;
    if (ok) { pass++; emit(id, true, `${svc} list_operations 返回 ${txt.length} 字符`); }
    else { fail++; emit(id, false, `${svc} list_operations 失败/空: ${txt.slice(0,120)}`); }
  } catch (e) { fail++; emit(id, false, `${svc} 异常: ${e.message}`); }
}
emit('SUMMARY', fail === 0, `服务矩阵 ${pass}/${SERVICES.length} 通过`);
child.kill();
console.log('\n=== probe-mcp-c4 done ===');