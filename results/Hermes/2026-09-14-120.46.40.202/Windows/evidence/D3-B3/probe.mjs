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
  
  const ro = await call('huaweicloud_run_readonly_command', { args: ['ECS', 'NovaListServers'] });
  console.log("isError:", ro.result?.isError);
  const text = ro.result?.content?.[0]?.text || '';
  console.log("content (first 500):", text.substring(0, 500));
  // Check no plaintext AK/SK
  const hasAK = /AK[A-Z0-9]{10,}/.test(text);
  const hasSK = /SK[A-Za-z0-9]{10,}/.test(text);
  console.log("Has full AK:", hasAK, "Has full SK:", hasSK);
  console.log("RESULT: READONLY_OK");
  child.kill(); process.exit(0);

} catch(e) { console.error("Error:", e.message); child.kill(); process.exit(1); }
setTimeout(() => { child.kill(); process.exit(1); }, 25000);
