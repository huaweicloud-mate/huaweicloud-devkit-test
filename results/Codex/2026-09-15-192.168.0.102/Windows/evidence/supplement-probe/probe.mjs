import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const hdkRoot = 'C:/Users/Administrator/devkit-test/Codex/hdk';
const { callTool } = await import(pathToFileURL(
  join(hdkRoot, 'plugins/huaweicloud-core/src/tools.mjs'),
).href);

const out = process.env.HDK_EVIDENCE_DIR;
mkdirSync(out, { recursive: true });
const rows = [];
const record = (name, value) => rows.push({ name, value });

async function timed(name, fn) {
  const t0 = performance.now();
  try {
    const value = await fn();
    record(name, { ok: true, ms: Math.round(performance.now() - t0), value });
    return value;
  } catch (error) {
    record(name, { ok: false, ms: Math.round(performance.now() - t0), error: String(error) });
    return null;
  }
}

for (let i = 0; i < 5; i += 1) {
  await timed(`search_docs_${i + 1}`, () => callTool('huaweicloud_search_docs', { query: 'ECS list operations' }));
  await timed(`retrieve_skill_${i + 1}`, () => callTool('huaweicloud_retrieve_skill', { name: 'huawei-ecs' }));
}
await timed('smoke_check_cli', () => callTool('huaweicloud_check_cli'));
await timed('smoke_list_operations', () => callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 10000 }));
await timed('smoke_plan_cli_command', () => callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'NovaListServers'] }));
await timed('smoke_explain_error', () => callTool('huaweicloud_explain_error', {
  service: 'ECS',
  errorCode: 'APIGW.0301',
  message: 'invalid credentials',
}));
for (let i = 0; i < 5; i += 1) {
  await timed(`cold_start_${i + 1}`, () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      'C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/mcp-server.mjs',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    let buffer = Buffer.alloc(0);
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('initialize timeout'));
    }, 5000);
    child.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const end = buffer.indexOf('\r\n\r\n');
      if (end < 0) return;
      const match = buffer.subarray(0, end).toString().match(/Content-Length:\s*(\d+)/i);
      if (!match) return;
      const bodyStart = end + 4;
      if (buffer.length < bodyStart + Number(match[1])) return;
      clearTimeout(timer);
      child.kill();
      resolve(JSON.parse(buffer.subarray(bodyStart, bodyStart + Number(match[1])).toString('utf8')));
    });
    const message = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'supplement', version: '1' } },
    });
    child.stdin.end(`Content-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`);
  }));
}
await timed('concurrent_tools_list', async () => {
  const started = performance.now();
  const values = await Promise.all(Array.from({ length: 8 }, () => callTool('huaweicloud_search_docs', { query: 'OBS deploy' })));
  return { count: values.length, elapsedMs: Math.round(performance.now() - started) };
});

const message = (id, method, params = {}) => {
  const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
};

await timed('mcp_lifecycle_and_calls', () => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [
    'C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/mcp-server.mjs',
  ], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = Buffer.alloc(0);
  const responses = [];
  const timer = setTimeout(() => {
    child.kill();
    reject(new Error('lifecycle timeout'));
  }, 8000);
  child.stdout.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const end = buffer.indexOf('\r\n\r\n');
      if (end < 0) break;
      const match = buffer.subarray(0, end).toString().match(/Content-Length:\s*(\d+)/i);
      if (!match) break;
      const start = end + 4;
      const finish = start + Number(match[1]);
      if (buffer.length < finish) break;
      responses.push(JSON.parse(buffer.subarray(start, finish).toString('utf8')));
      buffer = buffer.subarray(finish);
      if (responses.length === 4) {
        clearTimeout(timer);
        child.kill();
        resolve(responses);
        return;
      }
    }
  });
  child.stdin.write(message(1, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'supplement', version: '1' } }));
  child.stdin.write(message(2, 'tools/list'));
  child.stdin.write(message(3, 'tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args: ['ECS', 'NovaListServers'] } }));
  child.stdin.write(message(4, 'unknown_method_for_d9_2'));
}));

const redact = (value) => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      /token|secret|password|ak|sk/i.test(key) ? '<redacted>' : redact(item),
    ]));
  }
  return value;
};
writeFileSync(join(out, 'stdout.log'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  results: redact(rows),
}, null, 2));
console.log(JSON.stringify({ resultCount: rows.length, output: join(out, 'stdout.log') }));
