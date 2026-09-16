// EXP-D5 客户端矩阵探针: EXP-D5-*-1 (discovery) + EXP-D5-*-3 (tools/list)
// 对每个客户端运行 install --target <client>，验证安装命令支持该客户端
// tools/list 是客户端无关的（MCP server 返回相同工具集）
// 用法: node exp-d5-probe.mjs <mcp-server.mjs>
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const serverPath = process.argv[2];
const CLIENTS = [
  ['codex', 'EXP-D5-2-1', 'EXP-D5-2-3'],
  ['codearts', 'EXP-D5-3-1', 'EXP-D5-3-3'],
  ['codearts-work', 'EXP-D5-4-1', 'EXP-D5-4-3'],
  ['workbuddy', 'EXP-D5-5-1', 'EXP-D5-5-3'],
  ['dsh', 'EXP-D5-6-1', 'EXP-D5-6-3'],
  ['officeace', 'EXP-D5-7-1', 'EXP-D5-7-3'],
  ['hermes', 'EXP-D5-8-1', 'EXP-D5-8-3'],
  ['openclaw', 'EXP-D5-9-1', 'EXP-D5-9-3'],
  ['atomcode', 'EXP-D5-10-1', 'EXP-D5-10-3'],
];

// ---- tools/list via MCP server (client-agnostic, same for all clients) ----
function toolsListCheck() {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  return new Promise((resolve) => {
    let buf = Buffer.alloc(0);
    let result = null;
    child.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      while (true) {
        const h = buf.indexOf('\r\n\r\n');
        if (h < 0) break;
        const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
        if (!m) { buf = buf.slice(h + 4); continue; }
        const n = +m[1];
        if (buf.length < h + 4 + n) break;
        const body = buf.slice(h + 4, h + 4 + n).toString();
        buf = buf.slice(h + 4 + n);
        try { const msg = JSON.parse(body); if (msg.id === 1 && msg.result) result = msg.result; } catch {}
      }
    });
    // initialize + tools/list
    const initMsg = JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'exp-d5', version: '1' } } });
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(initMsg)}\r\n\r\n${initMsg}`));
    setTimeout(() => {
      const tlMsg = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
      child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(tlMsg)}\r\n\r\n${tlMsg}`));
    }, 500);
    setTimeout(() => {
      child.kill();
      const tools = result?.tools || [];
      const allValid = tools.length > 0 && tools.every((t) => t.inputSchema && t.inputSchema.type === 'object');
      resolve({ count: tools.length, allValid, names: tools.slice(0, 3).map((t) => t.name) });
    }, 2000);
  });
}

// ---- Main ----
console.log('===== EXP-D5 tools/list (client-agnostic) =====');
const tl = await toolsListCheck();
console.log('tools/list 工具数:', tl.count, '| 全部schema合法:', tl.allValid);
console.log('前3工具:', tl.names.join(', '));
console.log('===== END EXP-D5 tools/list =====');

for (const [client, id1, id3] of CLIENTS) {
  // EXP-D5-*-1: install --target <client>
  console.log(`\n=====CASE ${id1}=====`);
  const fakeHome = mkdtempSync(join(tmpdir(), `d5-${client}-`));
  const r = spawnSync('npx.cmd', ['-y', '-p', 'huaweicloud-devkit', 'huaweicloud-devkit', 'install', '--target', client], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    timeout: 90000,
    env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome, APPDATA: join(fakeHome, 'AppData', 'Roaming'), LOCALAPPDATA: join(fakeHome, 'AppData', 'Local') },
    shell: true,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  console.log(`install --target ${client} exitCode: ${r.status}`);
  console.log(`output(前300): ${out.slice(0, 300)}`);
  // 判定: exitCode 0 = 安装命令支持该客户端
  const ok = r.status === 0;
  console.log(`${client}: install 命令支持(不崩溃): ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`=====END ${id1}=====`);

  // EXP-D5-*-3: tools/list (same result for all clients — client-agnostic)
  console.log(`=====CASE ${id3}=====`);
  console.log(`${client}: tools/list 工具数=${tl.count}, schema合法=${tl.allValid}`);
  console.log(`${client}: tools/list 枚举 ${tl.count} 工具全量可达: ${tl.count > 0 && tl.allValid ? 'PASS' : 'FAIL'}`);
  console.log(`=====END ${id3}=====`);
}

console.log('\n=== DONE ===');
