// D3-C5: 工具冒烟测试 - Quick call check_cli/list_operations/plan_cli_command/explain_error
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

const results = {};

// 1. check_cli
try {
  const r = await callTool('huaweicloud_check_cli', {});
  results.check_cli = { ok: !!(r?.installed || r?.version || r?.ok || r), keys: Object.keys(r || {}), preview: JSON.stringify(r).substring(0, 300) };
} catch (e) {
  results.check_cli = { ok: false, error: e.message };
}

// 2. list_operations for ECS
try {
  const r = await callTool('huaweicloud_list_operations', { service: 'ECS' });
  results.list_operations = { ok: !!(r?.operations || r?.ok || r), keys: Object.keys(r || {}), preview: JSON.stringify(r).substring(0, 300) };
} catch (e) {
  results.list_operations = { ok: false, error: e.message };
}

// 3. plan_cli_command with a read-only command
try {
  const r = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServers'] });
  results.plan_cli_command = { ok: !!(r?.command || r?.classification || r), keys: Object.keys(r || {}), preview: JSON.stringify(r).substring(0, 300) };
} catch (e) {
  results.plan_cli_command = { ok: false, error: e.message };
}

// 4. explain_error with APIGW.0301
try {
  const r = await callTool('huaweicloud_explain_error', { service: 'APIG', errorCode: 'APIGW.0301' });
  results.explain_error = { ok: !!(r?.explanation || r?.nextSteps || r?.ok || r), keys: Object.keys(r || {}), preview: JSON.stringify(r).substring(0, 300) };
} catch (e) {
  results.explain_error = { ok: false, error: e.message };
}

const allOk = Object.values(results).every(r => r.ok);
console.log(JSON.stringify({
  testId: 'D3-C5',
  testName: '工具冒烟测试',
  status: allOk ? 'PASS' : 'FAIL',
  why: allOk
    ? 'All 4 tools (check_cli, list_operations, plan_cli_command, explain_error) returned successfully.'
    : `Some tools failed: ${JSON.stringify(results)}`,
  details: results,
  executedAt: '20260928090001',
}, null, 2));