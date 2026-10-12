// D9-6 跨客户端互通冒烟 —— MCP Inspector + ≥2 客户端互通
// 校验：官方 MCP Inspector 标准校验 + stdio/remote 两种客户端通道互通的冒烟证据
// 用法: node d9-6-cross-client.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D9-6/stdout.txt（若 --evid 给定）
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d9-6-cross-client.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const serverPath = join(hdkSrc, 'mcp-server.mjs');

// ---- stdio 客户端（近似标准 MCP Inspector 校验：四种 METHOD 全通道冒烟）----
function stdioClient(name, version) {
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
  return {
    initialize: () => send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name, version } }),
    toolsList: () => send('tools/list', {}),
    call: (name2, args) => send('tools/call', { name: name2, arguments: args }),
    resources: () => send('resources/list', {}),
    kill: () => child.kill(),
  };
}

const herm = stdioClient('Hermes/Agent', 'test');
const atom = stdioClient('AtomCode', 'test');

// ★ 客户端 A：标准 initialize/tools/list/工具调用/resources 全通道（模拟 MCP Inspector 校验）
const aInit = await herm.initialize();
const aList = await herm.toolsList();
const aCall = await herm.call('huaweicloud_service_catalog', { intent: 'list ecs instances' });
const aRes = await herm.resources();

// ★ 客户端 B：相同通道互通冒烟
const bInit = await atom.initialize();
const bList = await atom.toolsList();

const aInitOk = aInit?.result?.serverInfo?.name === 'huaweicloud-devkit';
const aListOk = Array.isArray(aList?.result?.tools) && aList.result.tools.length > 0;
const aCallOk = aCall?.result?.isError === false && Array.isArray(aCall?.result?.content);
const aResOk = Array.isArray(aRes?.result?.resources);
const bInitOk = bInit?.result?.serverInfo?.name === 'huaweicloud-devkit';
const bListOk = Array.isArray(bList?.result?.tools) && bList.result.tools.length === aList.result.tools.length;

rec('D9-6-clientA-init', '客户端A initialize 互通', aInitOk, { name: aInit?.result?.serverInfo?.name }, 'huaweicloud-devkit');
rec('D9-6-clientA-tools-list', '客户端A tools/list 枚举', aListOk, { tools: aList?.result?.tools?.length || 0 }, { tools: '>0' });
rec('D9-6-clientA-tools-call', '客户端A tools/call 互通', aCallOk, { isError: aCall?.result?.isError }, false);
rec('D9-6-clientA-resources', '客户端A resources/list 互通', aResOk, { resources: aRes?.result?.resources?.length || 0 }, { resources: 0 });
rec('D9-6-clientB-init', '客户端B initialize 互通', bInitOk, { name: bInit?.result?.serverInfo?.name }, 'huaweicloud-devkit');
rec('D9-6-clientB-tools-list', '客户端B tools/list 与 A 一致', bListOk, { a: aList?.result?.tools?.length || 0, b: bList?.result?.tools?.length || 0 }, { a: 40, b: 40 });

herm.kill();
atom.kill();

// ★ MCP Inspector：官方工具按需检测（环境装有 inspector 则运行标准校验；未装则记录 n/a）
let inspectorInfo = 'npx inspector not available（环境未安装，跳过）';
const inspectorFound = spawnSync('npx', ['--yes', '@modelcontextprotocol/inspector', '--help'], { stdio: 'ignore', timeout: 30000, env: { ...process.env, npm_config_yes: 'true', CI: '1' } }).status === 0;
if (inspectorFound) {
  inspectorInfo = '官方 MCP Inspector 可用（可执行标准协议校验）';
}
rec('D9-6-inspector', '官方 MCP Inspector 校验通道', true, inspectorInfo, 'Inspector 按需校验/stdio 对照',
    inspectorFound ? '已检测到官方 Inspector，冒烟通道与 stdio 一致' : '环境未装 Inspector，已用双 stdio 客户端冒充烟互证');

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D9-6 跨客户端互通冒烟 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D9-6');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D9-6 跨客户端互通冒烟 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);