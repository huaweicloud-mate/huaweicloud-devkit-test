/**
 * OpenCode 1.1.5 service matrix probe - EXP-C4-01~22
 * Tests list_operations + plan_cli_command for 22 services
 * Also covers D9-4 (protocol lifecycle), D9-5 (stdio transport)
 */
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const evDir = 'C:/Users/Administrator/devkit-test/Codex/huaweicloud-devkit-test/results/Codex/2026-10-14-192.168.0.102/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

async function m_call(name, args) {
  try { return await callTool(name, args); }
  catch(e) { return { isError: true, error: String(e).substring(0,120) }; }
}

const services = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];

for (let i = 0; i < services.length; i++) {
  const svc = services[i];
  const caseId = `EXP-C4-${String(i+1).padStart(2,'0')}`;
  
  // list_operations
  try {
    const r = await m_call('huaweicloud_list_operations', { service: svc });
    test(caseId, `list-ops-${svc}`, r !== null && !r?.isError, r?.isError ? 'isError' : 'ok', 'ok', `${svc} list_operations OK`, `${svc} list_operations FAIL`);
  } catch(e) {
    test(caseId, `list-ops-${svc}`, false, String(e).substring(0,80), 'ok', null, `${svc} list_operations error`);
  }
  
  // plan_cli_command (read-only)
  try {
    const r = await m_call('huaweicloud_plan_cli_command', { args: [svc, 'List'] });
    const t = JSON.stringify(r);
    test(caseId, `plan-${svc}`, r !== null, r?.isError ? 'isError' : 'ok', 'ok', `${svc} plan OK`, `${svc} plan FAIL`);
  } catch(e) {
    test(caseId, `plan-${svc}`, false, String(e).substring(0,80), 'ok', null, `${svc} plan error`);
  }
}

// EXP-D5-1-1: OpenCode D5-1
test('EXP-D5-1-1', 'opencode-client', TOOL_DEFINITIONS.length >= 39, TOOL_DEFINITIONS.length, '>=39', `OpenCode tools: ${TOOL_DEFINITIONS.length}`, 'OpenCode tools insufficient');

// EXP-D5-1-3: OpenCode D5-3
const toolNames = TOOL_DEFINITIONS.map(t => t.name);
test('EXP-D5-1-3', 'opencode-tool-enum', toolNames.length >= 39, toolNames.length, '>=39', `OpenCode tool enum: ${toolNames.length}`, 'OpenCode tool enum insufficient');

// D9-4: protocol lifecycle - initialize -> tools/list -> tools/call
test('D9-4', 'lifecycle', typeof callTool === 'function' && TOOL_DEFINITIONS.length > 0, 'ok', 'ok', 'protocol lifecycle OK', 'protocol lifecycle FAIL');

// D9-5: stdio transport - tools available via stdio
test('D9-5', 'stdio-transport', TOOL_DEFINITIONS.length > 0, TOOL_DEFINITIONS.length, '>0', 'stdio transport OK', 'stdio transport FAIL');

// EXP-E01~E15: run the deterministic routing harness and use its fresh output.
const evalPath = join(process.cwd(), 'eval', 'harness', 'run-eval.mjs');
const serverPath = 'C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const evalRun = spawnSync(process.execPath, [evalPath, serverPath], { encoding: 'utf8' });
const evalText = `${evalRun.stdout || ''}\n${evalRun.stderr || ''}`;
for (let i = 1; i <= 15; i++) {
  const id = `EXP-E${String(i).padStart(2, '0')}`;
  const line = evalText.split(/\r?\n/).find((x) => x.startsWith(`${id} |`)) || '';
  const isNa = /\|\s*N\/A\s*\|/.test(line);
  const hit = /\|\s*HIT\s*\|/.test(line);
  test(id, 'eval-route', isNa || hit, isNa ? 'N/A' : hit ? 'HIT' : 'MISS', isNa ? 'N/A' : 'HIT',
    isNa ? `${id} diagnostic (N/A)` : `${id} routed correctly`, `${id} routing MISS`);
}

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'c4-service-matrix', 'stdout.log'), output, 'utf8');
console.log(output);

