import { spawn } from 'node:child_process';

const serverPath = "C:/Users/Administrator/devkit-test/hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs";
const child = spawn(process.execPath, [serverPath], {
  cwd: "C:/Users/Administrator/devkit-test/hermes/hdk",
  stdio: ['pipe', 'pipe', 'pipe'],
});

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

function frame(message) {
  const json = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;
}

function request(method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  child.stdin.write(frame({ jsonrpc: '2.0', id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), 15000);
    pending.set(id, (payload) => {
      clearTimeout(timer);
      pending.delete(id);
      resolve(payload);
    });
  });
}

function call(name, args = {}) {
  return request('tools/call', { name, arguments: args });
}

try {
  await request('initialize', {
    protocolVersion: '2024-11-05', capabilities: {},
    clientInfo: { name: 'test-probe', version: '1.0.0' },
  });
  
  const ecsOps = await call('huaweicloud_list_operations', { service: 'ECS' });
  console.log("ECS ops:", ecsOps.result?.content?.[0]?.text?.substring(0, 300));
  
  const vpcOps = await call('huaweicloud_list_operations', { service: 'VPC' });
  console.log("VPC ops:", vpcOps.result?.content?.[0]?.text?.substring(0, 300));
  
  const obsOps = await call('huaweicloud_list_operations', { service: 'OBS' });
  console.log("OBS ops:", obsOps.result?.content?.[0]?.text?.substring(0, 300));
  
  console.log("RESULT: LIST_OPS_OK");
  child.kill();
  process.exit(0);

} catch(e) {
  console.error("Error:", e.message);
  child.kill();
  process.exit(1);
}

setTimeout(() => { console.log("Global timeout"); child.kill(); process.exit(1); }, 25000);
