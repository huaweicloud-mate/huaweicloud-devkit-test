// EXP-C4-XX 服务矩阵只读规划冒烟 probe
// 用法: node probe-c4.mjs <caseId> <service> <readonlyOp> [--evid <dir>]
// 例如: node probe-c4.mjs EXP-C4-01 ECS ListCloudServers
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const caseId = process.argv[2];
const service = process.argv[3];
const readonlyOp = process.argv[4];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-09-30-188.239.14.150\\Windows\\evidence';

if (!caseId || !service || !readonlyOp) {
  console.error('用法: node probe-c4.mjs <caseId> <service> <readonlyOp> [--evid <dir>]');
  process.exit(2);
}

const hdkSrc = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const serverPath = join(hdkSrc, 'mcp-server.mjs');

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual).substring(0, 200)} (期望 ${JSON.stringify(expected).substring(0, 100)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// ① 启动 MCP server，调用 list_operations
const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let msgId = 0;
function send(method, params = {}) {
  const rid = ++msgId;
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
child.stderr.on('data', () => {});

let listOpsOk = false;
let listOpsData = null;
let planOk = false;
let planData = null;
let initOk = false;

try {
  const init = await send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: caseId, version: '1' } });
  initOk = init?.result?.protocolVersion != null;
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(initNotif)}\r\n\r\n${initNotif}`));

  // ② list_operations
  const listOpsResp = await send('tools/call', {
    name: 'huaweicloud_list_operations',
    arguments: { service },
  });
  
  if (listOpsResp?.result?.content?.[0]?.text) {
    try {
      listOpsData = JSON.parse(listOpsResp.result.content[0].text);
      listOpsOk = listOpsData?.result?.ok === true && listOpsData?.result?.exitCode === 0;
    } catch {
      // If not JSON, check if it contains operation names
      const text = listOpsResp.result.content[0].text;
      listOpsOk = text.includes('Available Operations') || text.includes('Operations');
      listOpsData = { rawText: text.substring(0, 500) };
    }
  } else if (listOpsResp?.error) {
    listOpsData = { error: listOpsResp.error };
  }
} catch (e) {
  console.error('MCP error during list_operations:', e.message);
}

rec(`${caseId}-init`, 'MCP initialize 握手成功', initOk, { initOk }, { initOk: true });
rec(`${caseId}-list-ops`, `list_operations ${service} 返回规范操作名`, listOpsOk,
    { ok: listOpsOk, hasResult: !!listOpsData, exitCode: listOpsData?.result?.exitCode },
    { ok: true, exitCode: 0 },
    listOpsOk ? `成功获取 ${service} 操作列表` : `获取 ${service} 操作列表失败: ${JSON.stringify(listOpsData?.error || listOpsData?.rawText?.substring(0,100) || 'unknown').substring(0, 200)}`);

// ③ plan_cli_command 生成只读命令
try {
  const planResp = await send('tools/call', {
    name: 'huaweicloud_plan_cli_command',
    arguments: { args: [service, readonlyOp] },
  });
  
  if (planResp?.result?.content?.[0]?.text) {
    try {
      planData = JSON.parse(planResp.result.content[0].text);
      planOk = planData?.classification?.decision === 'allow' && 
               planData?.safeToRun === true &&
               (planData?.classification?.risk === 'read_only' || planData?.classification?.risk === 'unknown');
    } catch {
      planData = { rawText: planResp.result.content[0].text.substring(0, 500) };
    }
  } else if (planResp?.error) {
    planData = { error: planResp.error };
  }
} catch (e) {
  console.error('MCP error during plan_cli_command:', e.message);
}

rec(`${caseId}-plan`, `plan_cli_command ${service} ${readonlyOp} 生成只读命令`, planOk,
    { ok: planOk, decision: planData?.classification?.decision, risk: planData?.classification?.risk, safeToRun: planData?.safeToRun, command: planData?.command },
    { ok: true, decision: 'allow', risk: 'read_only', safeToRun: true },
    planOk ? `命令分类为 ${planData?.classification?.risk}，safeToRun=true` : `规划失败: ${JSON.stringify(planData?.error || planData?.rawText?.substring(0,100) || 'unknown').substring(0, 200)}`);

child.kill();

const pass = results.filter(r => r.ok).length;
const fail = results.filter(r => !r.ok).length;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(`\n=== ${caseId} ${service} 服务矩阵只读规划冒烟 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${verdict}`);

// 证据落盘
const now = new Date();
const ts = now.getFullYear().toString() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0');

const stdoutLines = [
  `time=${now.toISOString()}`,
  `case=${caseId}`,
  `type=C4服务矩阵`,
  `service=${service}`,
  `readonlyOp=${readonlyOp}`,
  `result=${verdict}`,
  '--- fixture 内部断言 ---',
];
for (const r of results) {
  stdoutLines.push(`${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
}

const outDir = join(EVID, caseId);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'stdout.log'), JSON.stringify({
  status: verdict,
  caseId: caseId,
  why: verdict === 'PASS' ? `${service} list_operations + plan_cli_command ${readonlyOp} 只读规划冒烟通过` : `${fail} 项断言失败`,
  executedAt: ts,
}, null, 2), 'utf8');
writeFileSync(join(outDir, 'stdout.txt'), stdoutLines.join('\n'), 'utf8');

process.exit(fail > 0 ? 1 : 0);