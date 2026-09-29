// D1-58 / D1 安装 — MCP 配置保留（#615 / #661）探针（v1.1.4-next.6 新增）
// 注意：merge*Style 返回 { entry, changed }，且仅对 node 风格 command 保留用户字段。
import {
  mergeCommandStyle,
  mergeArgsStyle,
  extractUserDelta,
  applyUserDelta,
} from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs';
import {
  saveAgentDelta,
  readAgentDelta,
  takeAgentDelta,
  purgeBackup,
} from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/mcp-config-backup.mjs';

import { mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// #615: 安装/更新不覆盖用户自定义 MCP 字段（command 保留 userArgs；env/timeout/enabled 保留）
{
  const existing = {
    command: ['node', '/old/mcp-server.mjs', '--user-flag'],
    env: { CUSTOM_KEEP: 'v1' },
    timeout: 120000,
    enabled: false,
  };
  const { entry } = mergeCommandStyle(existing, { mcpPath: '/new/mcp-server.mjs' });
  check('D1-58/615', 'command 保留 userArgs (--user-flag)', entry.command.slice(2).join(' '), '--user-flag');
  check('D1-58/615', 'command[0]=node 修正为新 mcpPath', entry.command[1], '/new/mcp-server.mjs');
  check('D1-58/615', 'user env 保留', entry.env?.CUSTOM_KEEP, 'v1');
  check('D1-58/615', 'user timeout 保留', entry.timeout, 120000);
  check('D1-58/615', 'enabled=false 保留', entry.enabled, false);
}
{
  const existing = { command: 'node', args: ['/old/mcp-server.mjs', '--extra'], env: { KEEP: 'yes' }, timeout: 90000 };
  const { entry } = mergeArgsStyle(existing, { mcpPath: '/new/mcp-server.mjs', env: { HCLOUD_BIN: '/b' } });
  check('D1-58/615', 'args 保留 userArgs (--extra)', entry.args.slice(1).join(' '), '--extra');
  check('D1-58/615', 'args[0] 修正为新 mcpPath', entry.args[0], '/new/mcp-server.mjs');
  check('D1-58/615', 'user env 保留 (mergeArgsStyle)', entry.env?.KEEP, 'yes');
  check('D1-58/615', 'required env 仅缺省时注入', entry.env?.HCLOUD_BIN, '/b');
}

// extractUserDelta / applyUserDelta：捕获并还原用户自定义差量（含 env / timeout / extra args）
{
  const entry = {
    command: ['node', '/p/mcp-server.mjs', '--flag'],
    env: { CUSTOM: 'keep-me' },
    timeout: 240000,
  };
  const delta = extractUserDelta(entry, 'command');
  check('D1-58/615', 'extractUserDelta 捕获 commandExtra', delta?.commandExtra?.join(' '), '--flag');
  check('D1-58/615', 'extractUserDelta 捕获自定义 env', delta?.env?.CUSTOM, 'keep-me');
  check('D1-58/615', 'extractUserDelta 捕获 timeout', delta?.timeout, 240000);
  const restored = applyUserDelta({ command: ['node', '/p/mcp-server.mjs'] }, delta, 'command');
  check('D1-58/615', 'applyUserDelta 还原 userArgs', restored.command.slice(2).join(' '), '--flag');
  check('D1-58/615', 'applyUserDelta 还原自定义 env', restored.env?.CUSTOM, 'keep-me');
}

// mcp-config-backup：agent-delta 保存/读取/取走/清除
{
  const dir = join(homedir(), '.hdk-test-' + Math.random().toString(36).slice(2));
  mkdirSync(dir, { recursive: true });
  const agentKey = 'testagent';
  saveAgentDelta(agentKey, { timeout: 420000 }, join(dir, 'delta.json'));
  check('D1-58/615', 'saveAgentDelta 写入可读', readAgentDelta(agentKey, join(dir, 'delta.json'))?.timeout, 420000);
  takeAgentDelta(agentKey, join(dir, 'delta.json'));
  check('D1-58/615', 'takeAgentDelta 取走后读空', readAgentDelta(agentKey, join(dir, 'delta.json')), null);
  purgeBackup(join(dir, 'delta.json'));
  rmSync(dir, { recursive: true, force: true });
}

console.log('\n=== D1-58 MCP 配置保留探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);