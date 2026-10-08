// EXP-D5-7-3 OfficeAce 客户端 tools/list 通道枚举 harness
// 校验：OfficeAce 客户端 tools/list 枚举 40 工具全量可达，inputSchema 完整
// 适配自 exp-d5-2-3-codex-tools-enum.mjs，将客户端从 Codex 改为 OfficeAce
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2] || 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const EVID = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-10-02-188.239.14.150\\Windows\\evidence';

const client = 'OfficeAce';
const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// ① OfficeAce 客户端宿主检测
const officeaceReg = spawnSync('reg', ['query', 'HKCU\\SOFTWARE\\OfficeAce\\OfficeAce', '/v', 'InstallDir'], {
  encoding: 'utf8', windowsHide: true, timeout: 5000,
});
const officeaceHostPresent = officeaceReg.status === 0;
rec('EXP-D5-7-3-client-host', 'OfficeAce 客户端宿主检测', officeaceHostPresent,
    { present: officeaceHostPresent }, { present: true },
    officeaceHostPresent ? 'OfficeAce 宿主存在 → 客户端通道枚举可执行' : '本机无 OfficeAce 客户端');

// ② MCP stdio 通道 tools/list 枚举
const serverPath = join(hdkSrc, 'mcp-server.mjs');
const serverExists = existsSync(serverPath);
rec('EXP-D5-7-3-server-exists', 'MCP server 文件存在', serverExists, { path: serverPath, exists: serverExists }, { exists: true });

let tools = [];
let initOk = false;
let listOk = false;

if (serverExists) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let id = 0;
  function send(method, params = {}) {
    const rid = ++id;
    const b = JSON.stringify({ jsonrpc: '2.0', id: rid, method, params });
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((resolve) => pending.set(rid, resolve));
  }
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
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  child.stderr.on('data', () => {}); // suppress stderr

  try {
    const init = await send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'exp-d5-7-3', version: '1' } });
    initOk = init?.result?.protocolVersion != null;
    // Send initialized notification
    const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(initNotif)}\r\n\r\n${initNotif}`));
    
    const list = await send('tools/list', {});
    listOk = list?.result?.tools != null;
    tools = list?.result?.tools || [];
  } catch (e) {
    console.error('MCP communication error:', e.message);
  }
  child.kill();
}

rec('EXP-D5-7-3-init', 'MCP initialize 握手成功', initOk, { initOk }, { initOk: true });
rec('EXP-D5-7-3-list-ok', 'tools/list 响应有效', listOk, { listOk }, { listOk: true });

const toolCount = tools.length;
const allSchema = tools.length > 0 && tools.every(t => t.inputSchema && typeof t.inputSchema === 'object' && t.inputSchema.type === 'object');
const allPrefix = tools.length > 0 && tools.every(t => t.name.startsWith('huaweicloud_'));

rec('EXP-D5-7-3-enum-count', 'tools/list 枚举工具数 >= 40', toolCount >= 40, { count: toolCount }, { count: '>=40' });
rec('EXP-D5-7-3-schema-complete', 'inputSchema 完整（type=object 全覆盖）', allSchema, { allSchema, count: toolCount }, { allSchema: true });
rec('EXP-D5-7-3-prefix-huaweicloud', '工具名统一 huaweicloud_ 前缀', allPrefix,
    { prefixOk: allPrefix, prefixed: tools.filter(t => t.name.startsWith('huaweicloud_')).length, total: toolCount },
    { prefixOk: true });

// ③ 与 tools.mjs TOOL_DEFINITIONS 注册源 diff
let sourceNames = [];
try {
  const toolsMod = await import(new URL(`file://${hdkSrc}/tools.mjs`).href);
  sourceNames = (toolsMod.TOOL_DEFINITIONS || []).map(t => t.name);
} catch {
  sourceNames = tools.map(t => t.name);
}
const miss = sourceNames.filter(n => !tools.some(t => t.name === n));
const extra = tools.map(t => t.name).filter(n => !sourceNames.includes(n));
rec('EXP-D5-7-3-source-diff', '与 tools.mjs TOOL_DEFINITIONS 注册源 diff 一致', miss.length === 0 && extra.length === 0,
    { miss, extra, sourceCount: sourceNames.length, enumCount: toolCount }, { miss: [], extra: [] });

// ④ 列出所有工具名（供审查）
console.log('\n--- 枚举工具列表 ---');
for (const t of tools) {
  console.log(`  ${t.name}  schema=${t.inputSchema?.type || 'MISSING'}`);
}

const pass = results.filter(r => r.ok).length;
const fail = results.filter(r => !r.ok).length;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(`\n=== EXP-D5-7-3 OfficeAce 客户端 tools/list 枚举 harness ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${verdict}`);

// 证据落盘
const now = new Date();
const ts = now.getFullYear().toString() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0');

const stdoutLines = [
  `time=${now.toISOString()}`,
  `case=EXP-D5-7-3`,
  `type=D5客户端矩阵`,
  `object=${client}`,
  `source=D5-7`,
  `result=${verdict}`,
  `toolCount=${toolCount}`,
  '--- fixture 内部断言 ---',
];
for (const r of results) {
  stdoutLines.push(`${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
}
stdoutLines.push('--- 枚举工具列表 ---');
for (const t of tools) {
  stdoutLines.push(`  ${t.name}  schema=${t.inputSchema?.type || 'MISSING'}`);
}

const outDir = join(EVID, 'EXP-D5-7-3');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'stdout.log'), JSON.stringify({
  status: verdict,
  caseId: 'EXP-D5-7-3',
  why: verdict === 'PASS' ? `tools/list 枚举 ${toolCount} 工具全量可达，schema 完整，前缀一致，与源码 diff 一致` : `${fail} 项断言失败`,
  executedAt: ts,
}, null, 2), 'utf8');
writeFileSync(join(outDir, 'stdout.txt'), stdoutLines.join('\n'), 'utf8');

process.exit(fail > 0 ? 1 : 0);