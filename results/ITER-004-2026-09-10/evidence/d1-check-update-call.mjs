// D1-26/39 端到端: MCP tools/call 调用 huaweicloud_check_update（Windows 实测）
// 用法: node d1-check-update-call.mjs
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const HDK = 'C:/Users/Administrator/devkit-test/hdk';
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const child = spawn('node', [MCP], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = Buffer.alloc(0);
let seq = 1;
const send = (method, params = {}) => {
  const msg = JSON.stringify({ jsonrpc: '2.0', id: seq++, method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
};
const calls = { 1: ['initialize', { protocolVersion: '2024-11-05' }], 2: ['tools/list'], 3: ['tools/call', { name: 'huaweicloud_check_update', arguments: {} }], 4: ['tools/call', { name: 'huaweicloud_check_update', arguments: { dismiss: true, dismissVersion: '1.1.2' } }] };
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const i = buf.indexOf('\r\n\r\n');
    if (i === -1) return;
    const header = buf.subarray(0, i).toString('utf8');
    const len = Number(header.match(/Content-Length: (\d+)/i)?.[1]);
    if (!len) { buf = buf.subarray(i + 4); continue; }
    if (buf.length < i + 4 + len) return;
    const body = buf.subarray(i + 4, i + 4 + len).toString('utf8');
    buf = buf.subarray(i + 4 + len);
    const msg = JSON.parse(body);
    if (msg.id === 1) { send('tools/list'); }
    else if (msg.id === 2) {
      const tools = msg.result?.tools || [];
      const names = tools.map(t => t.name);
      console.log(`tools: ${tools.length} | check_update=${names.includes('huaweicloud_check_update')} | upgrade=${names.includes('huaweicloud_upgrade')}`);
      send('tools/call', { name: 'huaweicloud_check_update', arguments: {} });
    } else if (msg.id === 3) {
      const r = msg.result || msg.error;
      const text = typeof r?.content?.[0]?.text === 'string' ? r.content[0].text : JSON.stringify(r);
      console.log(`[check_update 无参] ${text.slice(0, 400)}`);
      // 仅测无参（dismiss 需写文件, 不污染环境）
      child.kill();
      process.exit(0);
    }
  }
});
send('initialize', { protocolVersion: '2024-11-05' });
setTimeout(() => { console.error('TIMEOUT'); process.exit(1); }, 45000);