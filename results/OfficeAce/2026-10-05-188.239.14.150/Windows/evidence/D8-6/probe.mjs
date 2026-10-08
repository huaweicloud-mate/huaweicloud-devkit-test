// D8-6: Multi-client config isolation test
// Tests that mcp-config-merge.mjs properly isolates configs for different clients:
// 1. mergeArgsStyle preserves user env while adding required env
// 2. mergeCommandStyle preserves user args
// 3. extractUserDelta/applyUserDelta round-trip preserves user customizations
// 4. Different agents (command vs args style) don't cross-contaminate
import { mergeArgsStyle, mergeCommandStyle, extractUserDelta, applyUserDelta, mergeMcpServersFile } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs';

const mcpPath = '/path/to/mcp-server.mjs';
const checks = [];

// Test 1: mergeArgsStyle preserves user env, only adds missing required keys
const userEntry = {
  command: 'node',
  args: [mcpPath, '--transport', 'stdio'],
  env: { MY_CUSTOM: 'keepme' },
  timeout: 120000,
};
const merged1 = mergeArgsStyle(userEntry, { mcpPath, env: { HCLOUD_BIN: '/bin/hcloud', HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'officeace' } });
checks.push({
  name: 'mergeArgsStyle: user env preserved, required env added',
  pass: merged1.entry.env?.MY_CUSTOM === 'keepme' &&
        merged1.entry.env?.HCLOUD_BIN === '/bin/hcloud' &&
        merged1.entry.args?.length === 3, // mcpPath + 2 user args
  evidence: `env=${JSON.stringify(merged1.entry.env)}, argsLen=${merged1.entry.args?.length}`,
});

// Test 2: mergeCommandStyle preserves user args after node+mcpPath
const cmdEntry = {
  type: 'local',
  command: ['node', mcpPath, '--debug'],
  enabled: true,
};
const merged2 = mergeCommandStyle(cmdEntry, { mcpPath });
checks.push({
  name: 'mergeCommandStyle: user args preserved after node+mcpPath',
  pass: merged2.entry.command?.[0] === 'node' &&
        merged2.entry.command?.[1] === mcpPath &&
        merged2.entry.command?.[2] === '--debug',
  evidence: `command=${JSON.stringify(merged2.entry.command)}`,
});

// Test 3: extractUserDelta + applyUserDelta round-trip (args style)
const argsEntry = {
  command: 'node',
  args: [mcpPath, '--verbose', '--port', '9999'],
  env: { CUSTOM_ENV: 'val', HCLOUD_BIN: '/bin/hcloud' },
  timeout: 99999,
  enabled: false,
};
const delta = extractUserDelta(argsEntry, 'args');
const freshEntry = { command: 'node', args: [mcpPath], env: { HCLOUD_BIN: '/new/hcloud' }, timeout: 300000, enabled: true };
const restored = applyUserDelta(freshEntry, delta, 'args');
checks.push({
  name: 'extractUserDelta + applyUserDelta round-trip (args style)',
  pass: restored.args?.length === 4 && // mcpPath + 3 user args
        restored.args?.[1] === '--verbose' &&
        restored.env?.CUSTOM_ENV === 'val' &&
        restored.timeout === 99999 &&
        restored.enabled === false,
  evidence: `args=${JSON.stringify(restored.args)}, env.CUSTOM_ENV=${restored.env?.CUSTOM_ENV}, timeout=${restored.timeout}, enabled=${restored.enabled}`,
});

// Test 4: extractUserDelta + applyUserDelta round-trip (command style)
const cmdEntry2 = {
  type: 'local',
  command: ['node', mcpPath, '--remote'],
  env: { MY_KEY: 'myval' },
  timeout: 50000,
};
const delta2 = extractUserDelta(cmdEntry2, 'command');
const freshCmd = { type: 'local', command: ['node', mcpPath], enabled: true, timeout: 300000 };
const restored2 = applyUserDelta(freshCmd, delta2, 'command');
checks.push({
  name: 'extractUserDelta + applyUserDelta round-trip (command style)',
  pass: restored2.command?.length === 3 &&
        restored2.command?.[2] === '--remote' &&
        restored2.env?.MY_KEY === 'myval' &&
        restored2.timeout === 50000,
  evidence: `command=${JSON.stringify(restored2.command)}, env.MY_KEY=${restored2.env?.MY_KEY}, timeout=${restored2.timeout}`,
});

// Test 5: mergeMcpServersFile isolates huaweicloud-devkit from other servers
const existingConfig = {
  mcpServers: {
    'other-tool': { command: 'python', args: ['server.py'] },
    'huaweicloud-devkit': { command: 'node', args: [mcpPath, '--user-flag'], env: { USER_VAR: 'preserved' } },
  },
};
const mergeResult = mergeMcpServersFile(existingConfig, { mcpPath, env: { HCLOUD_BIN: '/bin/hcloud' } });
checks.push({
  name: 'mergeMcpServersFile: other servers preserved, devkit merged',
  pass: mergeResult.config.mcpServers['other-tool']?.command === 'python' &&
        mergeResult.config.mcpServers['huaweicloud-devkit']?.args?.includes('--user-flag') &&
        mergeResult.config.mcpServers['huaweicloud-devkit']?.env?.USER_VAR === 'preserved',
  evidence: `otherTool=${mergeResult.config.mcpServers['other-tool']?.command}, devkitArgs=${JSON.stringify(mergeResult.config.mcpServers['huaweicloud-devkit']?.args)}, USER_VAR=${mergeResult.config.mcpServers['huaweicloud-devkit']?.env?.USER_VAR}`,
});

// Test 6: REQUIRED_ENV_KEYS not treated as user assets
const entryWithRequired = {
  command: 'node',
  args: [mcpPath],
  env: { HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'officeace', HCLOUD_BIN: '/bin/hcloud', USER_PRESERVED: 'keep' },
};
const delta3 = extractUserDelta(entryWithRequired, 'args');
checks.push({
  name: 'extractUserDelta: REQUIRED_ENV_KEYS excluded from user delta',
  pass: delta3?.env?.USER_PRESERVED === 'keep' &&
        delta3?.env?.HUAWEICLOUD_AGENT_TOOLKIT_MODE === undefined &&
        delta3?.env?.HCLOUD_BIN === undefined,
  evidence: `delta.env=${JSON.stringify(delta3?.env)}`,
});

const allPass = checks.every(c => c.pass);
const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D8-6',
  why: allPass
    ? `All ${checks.length} multi-client config isolation checks passed: user env/args preserved across merge, delta round-trip works for both command and args styles, other MCP servers isolated, REQUIRED_ENV_KEYS excluded from user assets.`
    : `Failed checks: ${JSON.stringify(checks.filter(c => !c.pass))}`,
  executedAt: '20261001103000',
  details: checks,
};

console.log(JSON.stringify(output, null, 2));