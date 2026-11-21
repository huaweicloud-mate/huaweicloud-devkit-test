import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const SERVER = "/tmp/hdkbridge_20261120/mcp-server.mjs";
const HERE = new URL('.', import.meta.url).pathname;
function finish(cid, status, why) {
  const ts = new Date(Date.now() + 8*3600*1000).toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
  writeFileSync(HERE + 'stdout.log', JSON.stringify({ caseId: cid, status, why, executedAt: ts }, null, 1));
}
const child = spawn(process.execPath, [SERVER], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
let buf = Buffer.alloc(0); let _id = 1; const pending = new Map();
child.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]); while (true) { const h = buf.indexOf('\r\n\r\n'); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; } const n = +m[1]; if (buf.length < h+4+n) break; const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n); try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {} } });
function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from('Content-Length: ' + Buffer.byteLength(b) + '\r\n\r\n' + b)); return new Promise((r) => pending.set(o.id, r)); }
function call(name, args) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args } }); }
const txt = (r) => (r?.result?.content || []).map(c => c.text).join('') || JSON.stringify(r?.result || r?.error || '');
async function main() {
  await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  // D4-14 可审计性: plan + run 均有可追溯返回(审批token/事件)
  const planW = await call('huaweicloud_plan_cli_command', { args: ['VPC','CreateVpc','--vpc.name=audit-test','--vpc.cidr=10.99.0.0/16','--cli-region=cn-north-4'], allowWrites: true });
  const tp = txt(planW);
  const hasApprovalToken = /approvalToken/.test(tp) && !/approvalToken\\":\\s*\\(null\|undefined\|""\\)/.test(tp);
  const hasClassify = /classification|decision/.test(tp);
  console.log('D4-14 plan可追溯: classification=' + hasClassify + ' approvalToken=' + hasApprovalToken);
  console.log(tp.slice(0, 300));
  // D4-20 拒绝后零操作: approvedByUser=false -> 拒绝且不执行
  const rej = await call('huaweicloud_run_approved_command', { args: ['VPC','DeleteVpc','--vpc_id=x','--cli-region=cn-north-4'], approvalToken: 'fake-token', approvedByUser: false });
  const tr = txt(rej).toLowerCase();
  const rejected = /deny|reject|not approve|must be true|false/.test(tr) && !/executing|success/i.test(tr);
  console.log('D4-20 拒绝零操作: rejected=' + rejected);
  console.log(tr.slice(0, 300));
  const d14ok = hasApprovalToken && hasClassify;
  const d20ok = rejected;
  console.log('[OK] D4-14 auditability=' + d14ok);
  console.log('[OK] D4-20 reject-zero-op=' + d20ok);
  // 写两份判定(由调用方 split; 这里写 D4-14，D4-20 由 wrapper 处理)
  child.kill();
  console.log(JSON.stringify({ d4_14: d14ok, d4_20: d20ok }));
  process.exit(0);
}
main().catch(e => { child.kill(); console.log('EXC ' + e.message); process.exit(1); });
