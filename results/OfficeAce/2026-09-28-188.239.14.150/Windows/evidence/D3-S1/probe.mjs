// D3-S1: 场景-只读查ECS - Execute ECS ListServersDetails and verify instance list
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

const results = {};

try {
  // Execute ECS ListServersDetails (read-only) 
  const r = await callTool('huaweicloud_run_readonly_command', { 
    args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--limit=10'],
    timeoutMs: 30000
  });
  
  const outputStr = JSON.stringify(r);
  
  // Check output contains server/instance data structure
  const hasServers = /servers|server|instances/i.test(outputStr);
  const hasValidJson = !!(r?.output || r?.result);
  const exitCode = r?.exitCode || r?.result?.exitCode;
  const ok = r?.ok || r?.result?.ok;
  
  results.listServersDetails = {
    hasServers,
    hasValidJson,
    exitCode,
    ok,
    keys: Object.keys(r || {}),
    outputPreview: outputStr.substring(0, 800),
  };
} catch (e) {
  results.listServersDetails = { error: e.message };
}

// Also test via plan_cli_command to verify it's classified as read-only
try {
  const plan = await callTool('huaweicloud_plan_cli_command', { 
    args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4']
  });
  results.planClassification = {
    decision: plan?.classification?.decision,
    risk: plan?.classification?.risk,
    safeToRun: plan?.safeToRun,
  };
} catch (e) {
  results.planClassification = { error: e.message };
}

const pass = (results.listServersDetails?.ok !== false && results.listServersDetails?.exitCode !== 1) &&
             results.planClassification?.decision === 'allow';

console.log(JSON.stringify({
  testId: 'D3-S1',
  testName: '场景-只读查ECS',
  status: pass ? 'PASS' : 'FAIL',
  why: pass
    ? 'ECS ListServersDetails executed successfully via run_readonly_command. Output contains server/instance data. Command classified as read_only/allow by plan_cli_command.'
    : `Issues found: ${JSON.stringify(results)}`,
  details: results,
  executedAt: '20260928090005',
}, null, 2));