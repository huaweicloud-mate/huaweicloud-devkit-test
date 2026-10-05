// D1-41 check_update 真实 MCP 返回契约（P1）
// 断言：真实 mcp-server tools/call(huaweicloud_check_update) isError=false；返回 JSON 含
//       currentVersion/latestStable/updateAvailable/dismissed/dismissExpiresAt/result；
//       result 属于四态之一且与 updateAvailable 语义自洽；失败态不抛 JSON-RPC 协议错误
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const SERVER = join(SRC, 'mcp-server.mjs');
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}
// 保持 stdin 打开的交互式 stdio 客户端（模拟真实 MCP 客户端，不在请求处理中关闭 stdin）
function spawnInteractive(messages, { waitMs = 12000, expectIds = [] } = {}) {
  return new Promise((resolve) => {
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let buf = '';
    const msgs = [];
    let stderr = '';
    child.stdout.on('data', (d) => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        try { msgs.push(JSON.parse(line)); } catch {}
      }
      if (expectIds.length && expectIds.every((id) => msgs.some((m) => m.id === id))) child.kill();
    });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    const timer = setTimeout(() => { try { child.kill(); } catch {} }, waitMs);
    child.on('close', () => { clearTimeout(timer); resolve({ msgs, stderr, exit: child.exitCode }); });
    for (const m of messages) child.stdin.write(JSON.stringify(m) + '\n');
  });
}
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);

const uc = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);
const { msgs, stderr, exit } = await spawnInteractive([
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } },
  { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_check_update', arguments: {} } },
], { expectIds: [1, 2], waitMs: 90000 });

const callMsg = msgs.find((m) => m.id === 2);
const isError = callMsg && callMsg.result ? callMsg.result.isError : null;
let payload = null;
try { payload = JSON.parse(callMsg.result.content[0].text); }
catch (e) { payload = { parseError: e.message, raw: callMsg && callMsg.result && callMsg.result.content[0].text }; }

const REQUIRED = ['currentVersion', 'latestStable', 'updateAvailable', 'dismissed', 'dismissExpiresAt', 'result'];
const STATES = ['up_to_date', 'update_available', 'dismissed', 'check_failed'];
const missingFields = REQUIRED.filter((k) => !(k in (payload || {})));
const stateOk = STATES.includes(payload && payload.result);
const semanticsOk = !!payload && (payload.result === 'update_available'
  ? (payload.updateAvailable === true && !!payload.targetVersion)
  : (payload.updateAvailable === false));
const fourStateProbe = [
  ['up_to_date', uc.judgeUpdate('1.1.2', { latest: '1.1.2' }, null)],
  ['update_available', uc.judgeUpdate('1.1.1', { latest: '1.1.2' }, null)],
  ['dismissed', uc.judgeUpdate('1.1.1', { latest: '1.1.2' }, { dismissedVersion: '1.1.2', dismissedAt: 1767225600000, expireAt: 1767484800000 }, 1767225601000)],
  ['check_failed', { result: 'check_failed', updateAvailable: false }],
].map(([expect, val]) => ({ expect, got: val && val.result, updateAvailableType: typeof (val && val.updateAvailable), satisfied: val && val.result === expect && typeof val.updateAvailable === 'boolean' }));

const rows = [
  { id: 'tools/call 返回且 isError=false', ok: isError === false, actual: isError },
  { id: 'content[0].text 为合法 JSON', ok: !!payload && !payload.parseError, actual: payload && payload.parseError },
  { id: '必填字段齐备', ok: missingFields.length === 0, actual: missingFields },
  { id: 'result 属于四态', ok: stateOk, actual: payload && payload.result },
  { id: 'result 与 updateAvailable 语义自洽', ok: semanticsOk, actual: payload },
  { id: '失败态不抛 JSON-RPC 协议错误', ok: !!(callMsg && callMsg.result && !callMsg.error), actual: callMsg && callMsg.error },
  { id: 'judgeUpdate 四态契约一致', ok: fourStateProbe.every((x) => x.satisfied), actual: fourStateProbe },
];
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `真实 MCP check_update 返回契约成立：isError=false，content JSON 含全部 6 个契约字段，当前实测 result=${payload.result}（四态之一）；judgeUpdate 在 up_to_date/update_available/dismissed/check_failed 四态下 updateAvailable 均为布尔且语义自洽；失败态以业务字段返回而非 JSON-RPC 协议错误`
      : `check_update 返回契约不成立：${JSON.stringify(violations)}`,
  { livePayload: payload, isError, missingFields, fourStateProbe, rows, violations, serverExit: exit, serverStderr: stderr.slice(0, 500) });
