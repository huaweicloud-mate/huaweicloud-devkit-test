// D1-26 升级提醒工具注册与协议暴露（P1）
// 断言：spawn 真实 mcp-server，initialize -> tools/list，检查 huaweicloud_check_update / huaweicloud_upgrade
//       均已注册，且 schema 含 description / inputSchema
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

const { msgs, stderr, exit } = await spawnInteractive([
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } },
  { jsonrpc: '2.0', method: 'notifications/initialized' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
], { expectIds: [1, 2] });

const init = msgs.find((m) => m.id === 1);
const tools = (msgs.find((m) => m.id === 2) || {}).result?.tools || [];
const targets = ['huaweicloud_check_update', 'huaweicloud_upgrade'];
const rows = targets.map((n) => {
  const t = tools.find((x) => x.name === n);
  return {
    tool: n, registered: !!t,
    hasDescription: !!(t && typeof t.description === 'string' && t.description.length > 0),
    hasInputSchema: !!(t && t.inputSchema && typeof t.inputSchema === 'object'),
    descriptionChars: t && t.description ? t.description.length : 0,
    inputSchemaKeys: t && t.inputSchema ? Object.keys(t.inputSchema) : [],
    satisfied: !!t && typeof t.description === 'string' && t.description.length > 0 && !!t.inputSchema,
  };
});
const rowsViolations = rows.filter((x) => !x.satisfied);
const ok = !!(init && init.result && init.result.protocolVersion && init.result.capabilities && init.result.serverInfo)
  && tools.length > 0 && rowsViolations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `真实 MCP server：initialize 返回 protocolVersion=${init.result.protocolVersion}+capabilities+serverInfo(${init.result.serverInfo.name}@${init.result.serverInfo.version})；tools/list 共 ${tools.length} 个工具，huaweicloud_check_update 与 huaweicloud_upgrade 均已注册且 schema 含非空 description 与 inputSchema（keys=${JSON.stringify(rows[0].inputSchemaKeys)}）`
      : `升级提醒工具注册断言不成立：initialize=${!!(init && init.result)} toolCount=${tools.length} violations=${JSON.stringify(rowsViolations)}`,
  { initialize: init && (init.result || init.error), toolCount: tools.length, rows, violations: rowsViolations, serverExit: exit, serverStderr: stderr.slice(0, 500) });
