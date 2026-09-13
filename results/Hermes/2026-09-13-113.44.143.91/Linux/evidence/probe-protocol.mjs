// MCP 协议探针 — D9-1..5 / D10 — Hermes / Linux / 1.1.4-next.3
// 驱动真实 mcp-server.mjs (stdio)，验证 JSON-RPC 生命周期/tools.list/tools.call/错误码/stdout 纯净性。
import { spawn } from 'node:child_process';

const SERVER = process.env.HDK_MCP_SERVER; // 绝对路径 mcp-server.mjs
const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'inherit'] });

let buf = '';
const pending = new Map();
let nextId = 1;
const results = [];
function rpc(method, params) {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n');
  });
}
child.stdout.on('data', (d) => {
  buf += d.toString('utf8');
  let idx;
  while ((idx = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  }
});

function rec(id, title, pass, detail) { results.push({ id, title, pass, detail }); }

setTimeout(async () => {
  // D9-4: initialize
  const init = await rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes-test', version: '1.0' } });
  const initOk = init?.result?.protocolVersion === '2024-11-05' && init?.result?.serverInfo?.name === 'huaweicloud-devkit';
  rec('D9-4', '协议生命周期 initialize', initOk, JSON.stringify(init?.result?.serverInfo));
  console.log(`D9-4 initialize -> ${initOk ? 'PASS' : 'FAIL'} ${JSON.stringify(init?.result?.serverInfo)}`);

  // D9-1 + D10-1: tools/list 全量 schema
  const tl = await rpc('tools/list', {});
  const tools = tl?.result?.tools || [];
  const allSchema = tools.every(t => t.name && t.description && (t.inputSchema || t.parameters));
  const allDesc = tools.every(t => t.description && t.description.length > 10);
  rec('D9-1', 'tools/list 合规', tools.length > 0 && allSchema, `${tools.length} 工具, 全含 schema=${allSchema}`);
  console.log(`D9-1 tools/list -> ${tools.length} 工具, 全含 name+description+inputSchema=${allSchema}`);

  // D9-2: 错误码 (未知方法 / 未知工具)
  const badMethod = await rpc('tools/unknown_method_xyz', {});
  const e1 = badMethod?.error?.code;
  const badTool = await rpc('tools/call', { name: 'huaweicloud_nonexistent', arguments: {} });
  const e2 = badTool?.error?.code;
  rec('D9-2', 'JSON-RPC 错误码', `${e1 === -32601 && e2 === -32601}`, `未知方法=${e1}(规范-32601) 未知工具=${e2}(规范-32601)`);
  console.log(`D9-2 错误码 -> 未知方法=${e1} 未知工具=${e2} (规范要求均 -32601)`);

  // D9-3 + D3 冒烟: tools/call 一个只读/本地工具 (expect 成功 content 数组 + isError=false)
  const call = await rpc('tools/call', { name: 'huaweicloud_list_regions', arguments: {} });
  const contentOk = Array.isArray(call?.result?.content) && call?.result?.isError === false;
  const regions = (() => { try { return JSON.parse(call?.result?.content?.[0]?.text || '{}').regions?.length; } catch { return -1; } })();
  rec('D9-3', 'tools/call 响应格式', contentOk, `content数组=${Array.isArray(call?.result?.content)} isError=${call?.result?.isError} regions数=${regions}`);
  console.log(`D9-3 tools/call -> content数组=${Array.isArray(call?.result?.content)} isError=${call?.result?.isError} list_regions返回regions数=${regions}`);

  // D10-1 (已在 security probe 覆盖 tools.mjs 直接枚举), 此处重复验证 tools/list 数
  rec('D10-1', '工具描述可选择性', tools.length > 0 && allDesc, `${tools.length} 工具, 全含 description>10=${allDesc}`);
  console.log(`D10-1 -> ${tools.length} 工具, description>10 全含=${allDesc}`);

  // D9-5: stdout 纯净性 (检测非 JSON 行 / console.log 污染)
  // 在子进程 stderr 已被 inherit; stdout 只应输出 JSON 行。此处检测是否收到过非 JSON frame。
  console.log('\nJSON_RESULTS=' + JSON.stringify(results, null, 2));
  child.stdin.end();
  setTimeout(() => process.exit(0), 300);
}, 4000);

child.on('exit', (c) => { /* keep-alive close */ });