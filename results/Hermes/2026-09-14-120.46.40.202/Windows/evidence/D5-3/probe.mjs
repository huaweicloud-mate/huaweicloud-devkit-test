import { spawn } from 'node:child_process';

const serverPath = "C:/Users/Administrator/devkit-test/hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs";
console.log("Server path:", serverPath);

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
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), 10000);
    pending.set(id, (payload) => {
      clearTimeout(timer);
      pending.delete(id);
      resolve(payload);
    });
  });
}

try {
  const initialized = await request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-probe', version: '1.0.0' },
  });
  console.log("Initialize OK - server:", initialized.result.serverInfo.name, "version:", initialized.result.serverInfo.version);
  console.log("Protocol version:", initialized.result.protocolVersion);

  const listed = await request('tools/list');
  const tools = listed.result.tools;
  console.log("Tools count:", tools.length);
  tools.forEach((t, i) => console.log(`  ${i+1}. ${t.name}`));
  
  let validSchemas = 0;
  for (const t of tools) {
    if (t.description && t.inputSchema) validSchemas++;
  }
  console.log("Valid schemas (desc+inputSchema):", validSchemas);
  
  const toolNames = new Set(tools.map(t => t.name));
  const expected = ['huaweicloud_plan_cli_command', 'huaweicloud_list_operations', 'huaweicloud_run_approved_command', 
    'huaweicloud_show_profile_redacted', 'huaweicloud_auth_status', 'huaweicloud_auth_sync',
    'huaweicloud_sandbox_check_user', 'huaweicloud_sandbox_connect'];
  let allFound = true;
  for (const name of expected) {
    if (!toolNames.has(name)) {
      console.log("MISSING:", name);
      allFound = false;
    }
  }
  if (allFound) console.log("All expected tools found");
  
  child.kill();
  process.exit(0);
} catch(e) {
  console.error("Error:", e.message);
  child.kill();
  process.exit(1);
}

setTimeout(() => {
  console.log("Global timeout");
  child.kill();
  process.exit(1);
}, 15000);
