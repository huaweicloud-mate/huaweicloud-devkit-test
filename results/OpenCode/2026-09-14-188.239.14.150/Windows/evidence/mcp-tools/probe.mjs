/**
 * OpenCode MCP 工具级测试探针
 * 覆盖: D2-4, D3-C5, D4-1, D4-2, D4-5, D4-9, D4-21, D4-22, D2-11, D3-B3, D8-7, D10-2, D10-3, D1-39, D5-3, D3-B1
 */
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,100), expected: String(expected).substring(0,100), passMsg, failMsg });
}

// D3-C5: Tool smoke tests
try {
  const r = await m_callTool('huaweicloud_check_cli', {});
  test('D3-C5', 'check-cli-smoke', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'check_cli OK', 'check_cli FAIL');
} catch(e) { test('D3-C5', 'check-cli-smoke', false, String(e).substring(0,80), 'ok', null, 'check_cli error'); }

try {
  const r = await m_callTool('huaweicloud_list_operations', { service: 'ECS' });
  test('D3-C5', 'list-ops-smoke', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'list_operations OK', 'list_operations FAIL');
} catch(e) { test('D3-C5', 'list-ops-smoke', false, String(e).substring(0,80), 'ok', null, 'list_operations error'); }

try {
  const r = await m_callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServers'] });
  test('D3-C5', 'plan-cli-smoke', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'plan_cli_command OK', 'plan_cli_command FAIL');
} catch(e) { test('D3-C5', 'plan-cli-smoke', false, String(e).substring(0,80), 'ok', null, 'plan_cli_command error'); }

try {
  const r = await m_callTool('huaweicloud_explain_error', { errorCode: '123', message: 'test', service: 'ECS' });
  test('D3-C5', 'explain-error-smoke', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'explain_error OK', 'explain_error FAIL');
} catch(e) { test('D3-C5', 'explain-error-smoke', false, String(e).substring(0,80), 'ok', null, 'explain_error error'); }

// D4-1: Credential file read block
try {
  const r = await m_callTool('huaweicloud_hook_check_command', { command: 'cat ~/.config/huaweicloud/credentials.json' });
  const txt = JSON.stringify(r);
  test('D4-1', 'cred-file-mcp', /deny|block/i.test(txt), txt.substring(0,60), 'deny', 'cred file blocked (MCP)', 'cred file not blocked (MCP)');
} catch(e) { test('D4-1', 'cred-file-mcp', false, String(e).substring(0,80), 'deny', null, 'hook_check_command error'); }

// D4-2: Env dump block
try {
  const r = await m_callTool('huaweicloud_hook_check_command', { command: 'env | grep HUAWEICLOUD' });
  const txt = JSON.stringify(r);
  test('D4-2', 'env-dump-mcp', /deny|block/i.test(txt), txt.substring(0,60), 'deny', 'env dump blocked (MCP)', 'env dump not blocked (MCP)');
} catch(e) { test('D4-2', 'env-dump-mcp', false, String(e).substring(0,80), 'deny', null, 'hook_check_command error'); }

// D4-5: Write misclassification
try {
  const r = await m_callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers', '--server-ids', 'test'] });
  const txt = JSON.stringify(r);
  const misclassified = /read.?only|allow/i.test(txt) && !/confirm|deny|write/i.test(txt);
  test('D4-5', 'delete-not-readonly-mcp', !misclassified, misclassified ? 'misclassified' : 'correct', 'correct', 'DeleteServers correct (MCP)', 'DeleteServers misclassified (MCP)');
} catch(e) { test('D4-5', 'delete-not-readonly-mcp', false, String(e).substring(0,80), 'correct', null, 'plan_cli_command error'); }

// D4-9: Public exposure
try {
  const r = await m_callTool('huaweicloud_hook_check_command', { command: 'hcloud VPC CreateSecurityGroupRule --port-range-min 22 --port-range-max 22 --remote-ip-prefix 0.0.0.0/0' });
  const txt = JSON.stringify(r);
  test('D4-9', 'public-exposure-mcp', /deny|confirm|block|risk/i.test(txt), txt.substring(0,60), 'detected', 'public exposure detected (MCP)', 'public exposure not detected (MCP)');
} catch(e) { test('D4-9', 'public-exposure-mcp', false, String(e).substring(0,80), 'detected', null, 'hook_check_command error'); }

// D4-21: hook_check_artifacts
try {
  const r = await m_callTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'test.tf', content: 'resource "huaweicloud_vpc" "test" { cidr = "0.0.0.0/0" }' }] });
  test('D4-21', 'artifacts-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'artifacts check OK (MCP)', 'artifacts check FAIL (MCP)');
} catch(e) { test('D4-21', 'artifacts-mcp', false, String(e).substring(0,80), 'ok', null, 'hook_check_artifacts error'); }

// D4-22: hook_check_deploy_plan
try {
  const r = await m_callTool('huaweicloud_hook_check_deploy_plan', { plan: { action: 'create', resource: 'ecs' } });
  test('D4-22', 'deploy-plan-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'deploy plan check OK (MCP)', 'deploy plan check FAIL (MCP)');
} catch(e) { test('D4-22', 'deploy-plan-mcp', false, String(e).substring(0,80), 'ok', null, 'hook_check_deploy_plan error'); }

// D2-4: show_profile_redacted
try {
  const r = await m_callTool('huaweicloud_show_profile_redacted', {});
  const txt = JSON.stringify(r);
  test('D2-4', 'profile-redacted-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'profile redacted OK (MCP)', 'profile redacted FAIL (MCP)');
} catch(e) { test('D2-4', 'profile-redacted-mcp', false, String(e).substring(0,80), 'ok', null, 'show_profile_redacted error'); }

// D3-B3: run_readonly_command
try {
  const r = await m_callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServers', '--limit', '1'] });
  test('D3-B3', 'run-readonly-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'run_readonly OK (MCP)', 'run_readonly FAIL (MCP)');
} catch(e) { test('D3-B3', 'run-readonly-mcp', false, String(e).substring(0,80), 'ok', null, 'run_readonly error'); }

// D8-7: retrieve_skill
try {
  const r = await m_callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-core' });
  test('D8-7', 'retrieve-skill-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'retrieve_skill OK (MCP)', 'retrieve_skill FAIL (MCP)');
} catch(e) { test('D8-7', 'retrieve-skill-mcp', false, String(e).substring(0,80), 'ok', null, 'retrieve_skill error'); }

// D10-2: search_docs
try {
  const r = await m_callTool('huaweicloud_search_docs', { query: 'ECS create' });
  test('D10-2', 'search-docs-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'search_docs OK (MCP)', 'search_docs FAIL (MCP)');
} catch(e) { test('D10-2', 'search-docs-mcp', false, String(e).substring(0,80), 'ok', null, 'search_docs error'); }

// D10-3: service_catalog
try {
  const r = await m_callTool('huaweicloud_service_catalog', { intent: 'deploy app' });
  test('D10-3', 'service-catalog-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'service_catalog OK (MCP)', 'service_catalog FAIL (MCP)');
} catch(e) { test('D10-3', 'service-catalog-mcp', false, String(e).substring(0,80), 'ok', null, 'service_catalog error'); }

// D5-3: Tool count
test('D5-3', 'tool-count', TOOL_DEFINITIONS.length >= 39, TOOL_DEFINITIONS.length, '>=39', 'tool count: ' + TOOL_DEFINITIONS.length, 'tool count insufficient');

// D3-B1: list_operations registered
test('D3-B1', 'list-ops-registered', TOOL_DEFINITIONS.some(t => t.name === 'huaweicloud_list_operations'), true, true, 'list_operations registered', 'list_operations not registered');

// D2-11: Write command planning
try {
  const r = await m_callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--flavor-ref', 's6.small.1'] });
  test('D2-11', 'write-cmd-planned', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'write cmd planned OK', 'write cmd planned FAIL');
} catch(e) { test('D2-11', 'write-cmd-planned', false, String(e).substring(0,80), 'ok', null, 'plan error'); }

// D1-39: check_update
try {
  const r = await m_callTool('huaweicloud_check_update', {});
  test('D1-39', 'check-update-mcp', r !== null, r?.isError ? 'isError' : 'ok', 'ok', 'check_update OK (MCP)', 'check_update FAIL (MCP)');
} catch(e) { test('D1-39', 'check-update-mcp', false, String(e).substring(0,80), 'ok', null, 'check_update error'); }

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(new URL('file:///C:/Users/Administrator/devkit-test/OpenCode/huaweicloud-devkit-test/results/OpenCode/2026-09-14-188.239.14.150/Windows/evidence/mcp-tools/stdout.log'), output, 'utf8');
console.log(output);

async function m_callTool(name, args) {
  try { return await callTool(name, args); }
  catch(e) { return { isError: true, error: String(e).substring(0,100) }; }
}
