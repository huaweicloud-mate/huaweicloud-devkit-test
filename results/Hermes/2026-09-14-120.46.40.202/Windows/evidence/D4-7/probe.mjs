import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ["C:/Users/Administrator/devkit-test/hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"], { cwd: "C:/Users/Administrator/devkit-test/hermes/hdk", stdio: ['pipe', 'pipe', 'pipe'] });
let buffer = Buffer.alloc(0);
const pending = new Map();
child.stdout.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;
    const header = buffer.subarray(0, headerEnd).toString('utf8');
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) return;
    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) return;
    const payload = JSON.parse(buffer.subarray(bodyStart, bodyEnd).toString('utf8'));
    buffer = buffer.subarray(bodyEnd);
    pending.get(payload.id)?.(payload);
  }
});
child.stderr.on('data', () => {});
function frame(msg) { const j = JSON.stringify(msg); return `Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`; }
function request(method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  child.stdin.write(frame({ jsonrpc: '2.0', id, method, params }));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout ' + method)), 15000);
    pending.set(id, (p) => { clearTimeout(t); pending.delete(id); resolve(p); });
  });
}
function call(name, args = {}) { return request('tools/call', { name, arguments: args }); }
try {
  await request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } });
  
  // Test hook_check_command with credential file access
  const hook1 = await call('huaweicloud_hook_check_command', { command: 'cat ~/.hcloud/credentials.json' });
  console.log("hook_check_command (cat creds) isError:", hook1.result?.isError);
  const t1 = hook1.result?.content?.[0]?.text || '';
  console.log("hook1 output (first 300):", t1.substring(0, 300));
  
  // Test with printenv
  const hook2 = await call('huaweicloud_hook_check_command', { command: 'printenv HW_ACCESS_KEY' });
  console.log("hook_check_command (printenv) isError:", hook2.result?.isError);
  const t2 = hook2.result?.content?.[0]?.text || '';
  console.log("hook2 output (first 300):", t2.substring(0, 300));
  
  // Test hook_check_artifacts with broad IAM policy
  const broadPolicy = JSON.stringify({Version: "1.1", Statement: [{Effect: "Allow", Action: ["*"], Resource: ["*"]}]});
  const hook3 = await call('huaweicloud_hook_check_artifacts', { artifacts: [{type: 'iam-policy', content: broadPolicy}] });
  console.log("hook_check_artifacts (broad IAM) isError:", hook3.result?.isError);
  const t3 = hook3.result?.content?.[0]?.text || '';
  console.log("hook3 output (first 300):", t3.substring(0, 300));
  
  // Test hook_check_deploy_plan
  const deployPlan = JSON.stringify({service: "FunctionGraph", config: {publicAccess: true, endpoint: "0.0.0.0/0"}});
  const hook4 = await call('huaweicloud_hook_check_deploy_plan', { plan: deployPlan });
  console.log("hook_check_deploy_plan isError:", hook4.result?.isError);
  const t4 = hook4.result?.content?.[0]?.text || '';
  console.log("hook4 output (first 300):", t4.substring(0, 300));
  
  console.log("RESULT: HOOK_TOOLS_TESTED");
  child.kill(); process.exit(0);

} catch(e) { console.error("Error:", e.message); child.kill(); process.exit(1); }
setTimeout(() => { child.kill(); process.exit(1); }, 25000);
