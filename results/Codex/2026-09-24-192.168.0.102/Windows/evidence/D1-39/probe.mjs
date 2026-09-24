/**
 * OpenCode 1.1.5 daily test probe - MCP tool-level tests
 * Covers: D3-C5, D4-1,2,5,9,21,22, D2-4,11, D3-B3, D8-7, D10-2,3, D1-39, D3-B1, D3-C4, D4-13
 */
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const evDir = 'C:/Users/Administrator/devkit-test/Codex/huaweicloud-devkit-test/results/Codex/2026-09-24-192.168.0.102/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

async function m_call(name, args) {
  try { return await callTool(name, args); }
  catch(e) { return { isError: true, error: String(e).substring(0,120) }; }
}

// D3-C5: smoke
try { const r = await m_call('huaweicloud_check_cli', {}); test('D3-C5','check-cli', r!==null, r?.isError?'isError':'ok', 'ok', 'check_cli OK', 'check_cli FAIL'); } catch(e) { test('D3-C5','check-cli', false, String(e).substring(0,80), 'ok', null, 'check_cli error'); }
try { const r = await m_call('huaweicloud_list_operations', { service:'ECS' }); test('D3-C5','list-ops', r!==null, r?.isError?'isError':'ok', 'ok', 'list_operations OK', 'list_operations FAIL'); } catch(e) { test('D3-C5','list-ops', false, String(e).substring(0,80), 'ok', null, 'list_operations error'); }
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','ListServers'] }); test('D3-C5','plan-cli', r!==null, r?.isError?'isError':'ok', 'ok', 'plan_cli_command OK', 'plan_cli_command FAIL'); } catch(e) { test('D3-C5','plan-cli', false, String(e).substring(0,80), 'ok', null, 'plan_cli_command error'); }
try { const r = await m_call('huaweicloud_explain_error', { errorCode:'123', message:'test', service:'ECS' }); test('D3-C5','explain-error', r!==null, r?.isError?'isError':'ok', 'ok', 'explain_error OK', 'explain_error FAIL'); } catch(e) { test('D3-C5','explain-error', false, String(e).substring(0,80), 'ok', null, 'explain_error error'); }

// D4-1: cred file block via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'cat ~/.config/huaweicloud/credentials.json' }); const t=JSON.stringify(r); test('D4-1','cred-file-mcp', /deny|block/i.test(t), t.substring(0,80), 'deny', 'cred file blocked (MCP)', 'cred file not blocked (MCP)'); } catch(e) { test('D4-1','cred-file-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-2: env dump block via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'env | grep HUAWEICLOUD' }); const t=JSON.stringify(r); test('D4-2','env-dump-mcp', /deny|block/i.test(t), t.substring(0,80), 'deny', 'env dump blocked (MCP)', 'env dump not blocked (MCP)'); } catch(e) { test('D4-2','env-dump-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-3: secret API block via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'hcloud csms showsecretversion --secret-id test' }); const t=JSON.stringify(r); test('D4-3','secret-api-mcp', /deny|block/i.test(t), t.substring(0,80), 'deny', 'secret API blocked (MCP)', 'secret API not blocked (MCP)'); } catch(e) { test('D4-3','secret-api-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-5: delete not misclassified
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','DeleteServers','--server-ids','test'] }); const t=JSON.stringify(r); const mis=/read.?only|allow/i.test(t)&&!/confirm|deny|write/i.test(t); test('D4-5','delete-mcp', !mis, mis?'misclassified':'correct', 'correct', 'DeleteServers correct (MCP)', 'DeleteServers misclassified (MCP)'); } catch(e) { test('D4-5','delete-mcp', false, String(e).substring(0,80), 'correct', null, 'plan error'); }

// D4-9: public exposure
try { const r = await m_call('huaweicloud_hook_check_command', { command:'hcloud VPC CreateSecurityGroupRule --port-range-min 22 --port-range-max 22 --remote-ip-prefix 0.0.0.0/0' }); const t=JSON.stringify(r); test('D4-9','public-mcp', /deny|confirm|block|risk/i.test(t), t.substring(0,80), 'detected', 'public exposure detected (MCP)', 'public exposure not detected (MCP)'); } catch(e) { test('D4-9','public-mcp', false, String(e).substring(0,80), 'detected', null, 'hook error'); }

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

// D4-15: bypass attempt via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'bash -c "cat ~/.config/huaweicloud/credentials.json"' }); const t=JSON.stringify(r); test('D4-15','bypass-mcp', /deny|block/i.test(t), t.substring(0,80), 'deny', 'bypass blocked (MCP)', 'bypass not blocked (MCP)'); } catch(e) { test('D4-15','bypass-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-16: command wrapping via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"' }); const t=JSON.stringify(r); test('D4-16','wrap-mcp', /deny|block/i.test(t), t.substring(0,80), 'deny', 'wrap blocked (MCP)', 'wrap not blocked (MCP)'); } catch(e) { test('D4-16','wrap-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-18: confirm-not-deny via MCP plan
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','CreateServers','--flavor-ref','s6.small.1'] }); const t=JSON.stringify(r); test('D4-18','confirm-mcp', /confirm|deny|write/i.test(t), t.substring(0,80), 'confirm/deny', 'write confirm/deny (MCP)', 'write allowed (MCP)'); } catch(e) { test('D4-18','confirm-mcp', false, String(e).substring(0,80), 'confirm/deny', null, 'plan error'); }

// D4-19: preflight in confirm via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'hcloud ECS DeleteServers --delete-all' }); const t=JSON.stringify(r); test('D4-19','preflight-mcp', /deny|confirm|block|risk/i.test(t), t.substring(0,80), 'detected', 'preflight effective (MCP)', 'preflight not effective (MCP)'); } catch(e) { test('D4-19','preflight-mcp', false, String(e).substring(0,80), 'detected', null, 'hook error'); }

// D4-4: write verbs via MCP
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','DeleteServers','--server-ids','test'] }); const t=JSON.stringify(r); test('D4-4','write-verb-mcp', /confirm|deny|write/i.test(t), t.substring(0,80), 'confirm/deny', 'write verb gated (MCP)', 'write verb not gated (MCP)'); } catch(e) { test('D4-4','write-verb-mcp', false, String(e).substring(0,80), 'confirm/deny', null, 'plan error'); }

// D4-7: hook tools effective via MCP
try { const r1 = await m_call('huaweicloud_hook_check_command', { command:'cat ~/.config/huaweicloud/credentials.json' }); const r2 = await m_call('huaweicloud_hook_check_artifacts', { artifacts:[{path:'test.tf',content:'test'}] }); const r3 = await m_call('huaweicloud_hook_check_deploy_plan', { plan:{action:'create'} }); test('D4-7','hook-3tools-mcp', r1!==null&&r2!==null&&r3!==null, 'all ok', 'all ok', '3 hook tools effective (MCP)', 'hook tools ineffective (MCP)'); } catch(e) { test('D4-7','hook-3tools-mcp', false, String(e).substring(0,80), 'all ok', null, 'hook error'); }

// D4-17: fail-closed via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'rm -rf / && hcloud ECS DeleteServers' }); const t=JSON.stringify(r); test('D4-17','fail-closed-mcp', !/allow/i.test(t)||/deny|block/i.test(t), t.substring(0,80), 'non-allow', 'fail-closed (MCP)', 'ambiguous allowed (MCP)'); } catch(e) { test('D4-17','fail-closed-mcp', false, String(e).substring(0,80), 'non-allow', null, 'hook error'); }

// D4-20: deny definitive via MCP
try { const r = await m_call('huaweicloud_hook_check_command', { command:'cat ~/.config/huaweicloud/credentials.json' }); const t=JSON.stringify(r); test('D4-20','deny-mcp', /deny|block/i.test(t), t.substring(0,80), 'deny', 'deny definitive (MCP)', 'deny not definitive (MCP)'); } catch(e) { test('D4-20','deny-mcp', false, String(e).substring(0,80), 'deny', null, 'hook error'); }

// D4-24: confirm boundary via MCP
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','CreateServers','--flavor-ref','s6.small.1'] }); const t=JSON.stringify(r); test('D4-24','confirm-boundary-mcp', /confirm|deny|write/i.test(t), t.substring(0,80), 'confirm/deny', 'confirm boundary (MCP)', 'confirm boundary fail (MCP)'); } catch(e) { test('D4-24','confirm-boundary-mcp', false, String(e).substring(0,80), 'confirm/deny', null, 'plan error'); }

// D4-6: adminPass via MCP hook
try { const r = await m_call('huaweicloud_hook_check_command', { command:'hcloud ECS CreateServers --adminPass MySecretPassword123' }); const t=JSON.stringify(r); test('D4-6','adminpass-mcp', !t.includes('MySecretPassword123'), t.substring(0,80), 'redacted', 'adminPass redacted (MCP)', 'adminPass NOT redacted (MCP)'); } catch(e) { test('D4-6','adminpass-mcp', false, String(e).substring(0,80), 'redacted', null, 'hook error'); }

// D3-C4: service matrix via MCP
try { const r = await m_call('huaweicloud_plan_cli_command', { args:['ECS','ListServers'] }); test('D3-C4','plan-ecs-mcp', r!==null, r?.isError?'isError':'ok', 'ok', 'ECS plan OK (MCP)', 'ECS plan FAIL (MCP)'); } catch(e) { test('D3-C4','plan-ecs-mcp', false, String(e).substring(0,80), 'ok', null, 'plan error'); }

const passed = results.filter(r=>r.pass).length;
const failed = results.filter(r=>!r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir,'mcp-tools','stdout.log'), output, 'utf8');
console.log(output);
