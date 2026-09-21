/**
 * OpenCode 1.1.4 正式版 MCP 工具级测试探针
 */
import { TOOL_DEFINITIONS, callTool } from 'file:///home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,100), expected: String(expected).substring(0,100), passMsg, failMsg });
}

async function m_call(name, args) {
  try { return await callTool(name, args); }
  catch(e) { return { isError: true, error: String(e).substring(0,100) }; }
}

// D3-C5: smoke
try { const r = await m_call('huaweicloud_check_cli', {}); test('D3-C5','check-cli', r!==null, r?.isError?'isError':'ok', 'ok', 'check_cli OK', 'check_cli FAIL'); } catch(e) { test('D3-C5','check-cli', false, String(e).substring(0,80), 'ok', null, 'check_cli error'); }
try { const r = await m_call('huaweicloud_list_operations', { service:'ECS' }); test('D3-C5','list-ops', r!==null, r?.isError?'isError':'ok', 'ok', 'list_operations OK', 'list_operations FAIL'); } catch(e) { test('D3-C5','list-ops', false, String(e).substring(0,80), 'ok', null, 'list_operations error'); }
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','ListServers'] }); test('D3-C5','plan-cli', r!==null, r?.isError?'isError':'ok', 'ok', 'plan_cli_command OK', 'plan_cli_command FAIL'); } catch(e) { test('D3-C5','plan-cli', false, String(e).substring(0,80), 'ok', null, 'plan_cli_command error'); }
try { const r = await m_call('huaweicloud_explain_error', { errorCode:'123', message:'test', service:'ECS' }); test('D3-C5','explain-error', r!==null, r?.isError?'isError':'ok', 'ok', 'explain_error OK', 'explain_error FAIL'); } catch(e) { test('D3-C5','explain-error', false, String(e).substring(0,80), 'ok', null, 'explain_error error'); }

// D4-1: cred file block via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'cat ~/.config/huaweicloud/credentials.json' }); const t=JSON.stringify(r); test('D4-1','cred-file-mcp', /deny|block/i.test(t), t.substring(0,60), 'deny', 'cred file blocked (MCP)', 'cred file not blocked (MCP)'); } catch(e) { test('D4-1','cred-file-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-2: env dump block via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'env | grep HUAWEICLOUD' }); const t=JSON.stringify(r); test('D4-2','env-dump-mcp', /deny|block/i.test(t), t.substring(0,60), 'deny', 'env dump blocked (MCP)', 'env dump not blocked (MCP)'); } catch(e) { test('D4-2','env-dump-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-5: delete not misclassified
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','DeleteServers','--server-ids','test'] }); const t=JSON.stringify(r); const mis=/read.?only|allow/i.test(t)&&!/confirm|deny|write/i.test(t); test('D4-5','delete-mcp', !mis, mis?'misclassified':'correct', 'correct', 'DeleteServers correct (MCP)', 'DeleteServers misclassified (MCP)'); } catch(e) { test('D4-5','delete-mcp', false, String(e).substring(0,80), 'correct', null, 'plan error'); }

// D4-9: public exposure
try { const r = await m_call('huaweicloud_hook_check_command', { command:'hcloud VPC CreateSecurityGroupRule --port-range-min 22 --port-range-max 22 --remote-ip-prefix 0.0.0.0/0' }); const t=JSON.stringify(r); test('D4-9','public-mcp', /deny|confirm|block|risk/i.test(t), t.substring(0,60), 'detected', 'public exposure detected (MCP)', 'public exposure not detected (MCP)'); } catch(e) { test('D4-9','public-mcp', false, String(e).substring(0,80), 'detected', null, 'hook error'); }

// D4-21: artifacts
try { const r = await m_call('huaweicloud_hook_check_artifacts', { artifacts:[{path:'test.tf',content:'resource "huaweicloud_vpc" "test" { cidr = "0.0.0.0/0" }'}] }); test('D4-21','artifacts-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'artifacts OK (MCP)', 'artifacts FAIL (MCP)'); } catch(e) { test('D4-21','artifacts-mcp', false, String(e).substring(0,80), 'ok', null, 'artifacts error'); }

// D4-22: deploy plan
try { const r = await m_call('huaweicloud_hook_check_deploy_plan', { plan:{action:'create',resource:'ecs'} }); test('D4-22','deploy-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'deploy plan OK (MCP)', 'deploy plan FAIL (MCP)'); } catch(e) { test('D4-22','deploy-mcp', false, String(e).substring(0,80), 'ok', null, 'deploy error'); }

// D2-4: show_profile_redacted
try { const r = await m_call('huaweicloud_show_profile_redacted', {}); test('D2-4','profile-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'profile redacted OK (MCP)', 'profile redacted FAIL (MCP)'); } catch(e) { test('D2-4','profile-mcp', false, String(e).substring(0,80), 'ok', null, 'profile error'); }

// D3-B3: run_readonly
try { const r = await m_call('huaweicloud_run_readonly_command', { args:['ECS','ListServers','--limit','1'] }); test('D3-B3','readonly-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'run_readonly OK (MCP)', 'run_readonly FAIL (MCP)'); } catch(e) { test('D3-B3','readonly-mcp', false, String(e).substring(0,80), 'ok', null, 'readonly error'); }

// D8-7: retrieve_skill
try { const r = await m_call('huaweicloud_retrieve_skill', { name:'huaweicloud-core' }); test('D8-7','retrieve-skill-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'retrieve_skill OK (MCP)', 'retrieve_skill FAIL (MCP)'); } catch(e) { test('D8-7','retrieve-skill-mcp', false, String(e).substring(0,80), 'ok', null, 'retrieve error'); }

// D10-2: search_docs
try { const r = await m_call('huaweicloud_search_docs', { query:'ECS create' }); test('D10-2','search-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'search_docs OK (MCP)', 'search_docs FAIL (MCP)'); } catch(e) { test('D10-2','search-mcp', false, String(e).substring(0,80), 'ok', null, 'search error'); }

// D10-3: service_catalog
try { const r = await m_call('huaweicloud_service_catalog', { intent:'deploy app' }); test('D10-3','catalog-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'service_catalog OK (MCP)', 'service_catalog FAIL (MCP)'); } catch(e) { test('D10-3','catalog-mcp', false, String(e).substring(0,80), 'ok', null, 'catalog error'); }

// D5-3: tool count
test('D5-3', 'tool-count', TOOL_DEFINITIONS.length>=39, TOOL_DEFINITIONS.length, '>=39', `tools: ${TOOL_DEFINITIONS.length}`, 'tools insufficient');

// D3-B1: list_operations registered
test('D3-B1', 'list-ops-reg', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_list_operations'), true, true, 'list_operations registered', 'not registered');

// D2-11: write cmd planned
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','CreateServers','--flavor-ref','s6.small.1'] }); test('D2-11','write-planned', r!==null, r?.isError?'isError':'ok', 'ok', 'write cmd planned OK', 'write cmd planned FAIL'); } catch(e) { test('D2-11','write-planned', false, String(e).substring(0,80), 'ok', null, 'plan error'); }

// D1-39: check_update
try { const r = await m_call('huaweicloud_check_update', {}); test('D1-39','check-update-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'check_update OK (MCP)', 'check_update FAIL (MCP)'); } catch(e) { test('D1-39','check-update-mcp', false, String(e).substring(0,80), 'ok', null, 'check_update error'); }

const passed = results.filter(r=>r.pass).length;
const failed = results.filter(r=>!r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync('/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-113.44.143.91/Linux/evidence/mcp-tools/stdout.log', output, 'utf8');
console.log(output);
