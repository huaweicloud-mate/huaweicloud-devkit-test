import { classifyHcloudArgs, classifyTextCommand, redactSecrets, loadPolicy } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, redactOutput, createApprovalToken, consumeApprovalToken, hashArgs } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { callTool, TOOL_DEFINITIONS } from './plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';

const results = {};

// D2-1: auth init three-end sync
results['D2-1'] = [];
try {
  const r = await callTool('huaweicloud_auth_status', {});
  results['D2-1'].push({ desc: 'auth_status', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D2-1'].push({ desc: 'auth_status', error: e.message });
}

// D2-2: auth status judgment accuracy
results['D2-2'] = [];
try {
  const r = await callTool('huaweicloud_auth_status', {});
  const parsed = r?.content?.[0]?.text ? JSON.parse(r.content[0].text) : r;
  results['D2-2'].push({ desc: 'auth status accuracy', authenticated: parsed?.authenticated, status: parsed?.status, pass: parsed?.authenticated === true });
} catch(e) {
  results['D2-2'].push({ desc: 'auth status', error: e.message });
}

// D2-4 already tested in P0 batch

// D2-5: credential missing error guidance
results['D2-5'] = [];
try {
  // Test with no credentials - should provide guidance
  const r = classifyHcloudArgs(['IAM', 'ListUsers']);
  results['D2-5'].push({ desc: 'read op without creds', decision: r.decision, risk: r.risk });
} catch(e) {
  results['D2-5'].push({ desc: 'cred missing', error: e.message });
}

// D2-10: R7 current profile following
results['D2-10'] = [];
try {
  const r = await callTool('huaweicloud_show_profile_redacted', {});
  results['D2-10'].push({ desc: 'show_profile_redacted', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D2-10'].push({ desc: 'show_profile', error: e.message });
}

// D2-11 already tested

// D2-12: R10 runtime non-empty blocks persistence
results['D2-12'] = [];
try {
  // Runtime credentials should not be persisted
  const r = classifyHcloudArgs(['IAM', 'CreateTemporaryAccessKey', '--duration_seconds=3600']);
  results['D2-12'].push({ desc: 'runtime creds not persisted', decision: r.decision, risk: r.risk, blocked: r.decision === 'deny' });
} catch(e) {
  results['D2-12'].push({ desc: 'runtime creds', error: e.message });
}

// D2-13: R9 configuredBySession priority over env
results['D2-13'] = [];
try {
  const r = await callTool('huaweicloud_auth_status', {});
  results['D2-13'].push({ desc: 'auth status session', result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D2-13'].push({ desc: 'auth status', error: e.message });
}

// D2-16: import file read and erase
results['D2-16'] = [];
try {
  const r = classifyTextCommand('hcloud IAM ImportCredentials --file=/tmp/creds.json');
  results['D2-16'].push({ desc: 'import credentials file', decision: r.decision, risk: r.risk });
} catch(e) {
  results['D2-16'].push({ desc: 'import file', error: e.message });
}

// D2-26: credential backup and restore
results['D2-26'] = [];
try {
  const r = await dispatch('tools/list', {});
  const hasAuthSync = r?.tools?.some(t => t.name === 'huaweicloud_auth_sync');
  results['D2-26'].push({ desc: 'auth_sync exists', hasAuthSync, pass: hasAuthSync });
} catch(e) {
  results['D2-26'].push({ desc: 'auth_sync', error: e.message });
}

// D3-A1: skill search completeness
results['D3-A1'] = [];
try {
  const r = await callTool('huaweicloud_search_docs', { query: 'ECS create server' });
  results['D3-A1'].push({ desc: 'search_docs', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D3-A1'].push({ desc: 'search_docs', error: e.message });
}

// D3-B1: list_operations standard names
results['D3-B1'] = [];
try {
  const r = await callTool('huaweicloud_list_operations', { service: 'ECS' });
  const parsed = r?.content?.[0]?.text ? JSON.parse(r.content[0].text) : r;
  results['D3-B1'].push({ desc: 'ECS operations', hasService: !!parsed?.service, hasExamples: !!parsed?.examples, result: JSON.stringify(parsed).substring(0, 300) });
} catch(e) {
  results['D3-B1'].push({ desc: 'list_operations', error: e.message });
}

// D3-B3: run_readonly redaction
results['D3-B3'] = [];
try {
  const r = await callTool('huaweicloud_run_readonly_command', { service: 'ECS', operation: 'ListServers' });
  results['D3-B3'].push({ desc: 'run_readonly ECS ListServers', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D3-B3'].push({ desc: 'run_readonly', error: e.message });
}

// D3-B5: detect_framework identification
results['D3-B5'] = [];
try {
  const r = await callTool('huaweicloud_detect_framework', { projectPath: '.' });
  results['D3-B5'].push({ desc: 'detect_framework', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D3-B5'].push({ desc: 'detect_framework', error: e.message });
}

// D3-C5: tool smoke test
results['D3-C5'] = [];
try {
  const r = await dispatch('tools/list', {});
  const tools = r?.tools || [];
  results['D3-C5'].push({ desc: 'tool smoke test', count: tools.length, pass: tools.length >= 39 });
} catch(e) {
  results['D3-C5'].push({ desc: 'tool smoke', error: e.message });
}

// D4-4: write operation approval gate
results['D4-4'] = [];
try {
  const plan = planHcloudCommand(['ECS', 'CreateServer', '--name=test']);
  const needsApproval = plan?.classification?.decision === 'deny';
  results['D4-4'].push({ desc: 'write approval gate', needsApproval, decision: plan?.classification?.decision, pass: needsApproval });
} catch(e) {
  results['D4-4'].push({ desc: 'write approval', error: e.message });
}

// D4-6: adminPass echo warning
results['D4-6'] = [];
try {
  const plan = planHcloudCommand(['ECS', 'CreateServer', '--name=test', '--adminPass=Test12345!']);
  const warnings = plan?.warnings || [];
  results['D4-6'].push({ desc: 'adminPass warning', hasWarnings: warnings.length > 0, warnings: JSON.stringify(warnings).substring(0, 200) });
} catch(e) {
  results['D4-6'].push({ desc: 'adminPass', error: e.message });
}

// D4-7: hook three tools effectiveness
results['D4-7'] = [];
try {
  const r1 = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServer --server_id=test' });
  results['D4-7'].push({ desc: 'hook_check_command', ok: r1?.ok !== false, result: JSON.stringify(r1).substring(0, 200) });
} catch(e) {
  results['D4-7'].push({ desc: 'hook_check_command', error: e.message });
}
try {
  const r2 = await callTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'test.json', content: '{"Action":"*","Effect":"Allow"}' }] });
  results['D4-7'].push({ desc: 'hook_check_artifacts', ok: r2?.ok !== false, result: JSON.stringify(r2).substring(0, 200) });
} catch(e) {
  results['D4-7'].push({ desc: 'hook_check_artifacts', error: e.message });
}
try {
  const r3 = await callTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', public: true } });
  results['D4-7'].push({ desc: 'hook_check_deploy_plan', ok: r3?.ok !== false, result: JSON.stringify(r3).substring(0, 200) });
} catch(e) {
  results['D4-7'].push({ desc: 'hook_check_deploy_plan', error: e.message });
}

// D4-8: Python/Node policy consistency
results['D4-8'] = [];
try {
  const nodePolicy = loadPolicy();
  results['D4-8'].push({ desc: 'Node policy loaded', hasPolicy: !!nodePolicy, keys: Object.keys(nodePolicy || {}).slice(0, 10) });
} catch(e) {
  results['D4-8'].push({ desc: 'Node policy', error: e.message });
}

// D4-11: prompt injection protection
results['D4-11'] = [];
try {
  const r = classifyTextCommand('hcloud ECS DeleteServer --server_id=test; rm -rf /');
  results['D4-11'].push({ desc: 'prompt injection', decision: r.decision, risk: r.risk, reason: r.reason?.substring(0, 200) });
} catch(e) {
  results['D4-11'].push({ desc: 'prompt injection', error: e.message });
}

// D4-13: minimum permission credential pass rate
results['D4-13'] = [];
try {
  // Check if readonly credentials exist
  const r = await callTool('huaweicloud_auth_status', {});
  results['D4-13'].push({ desc: 'auth status for min perm', result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D4-13'].push({ desc: 'min perm', error: e.message });
}

// D4-17: hook fuzzy fail-closed
results['D4-17'] = [];
try {
  const r = await callTool('huaweicloud_hook_check_command', { command: '' });
  results['D4-17'].push({ desc: 'empty command fail-closed', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D4-17'].push({ desc: 'fuzzy fail-closed', error: e.message });
}

// D4-20: reject then zero operations
results['D4-20'] = [];
try {
  const plan = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test']);
  results['D4-20'].push({ desc: 'rejected op no execution', decision: plan?.classification?.decision, hasExecutable: !!plan?.executableBlock, pass: plan?.classification?.decision === 'deny' });
} catch(e) {
  results['D4-20'].push({ desc: 'reject zero', error: e.message });
}

// D4-24: approval token expiry and repeat confirm boundary
results['D4-24'] = [];
try {
  const token = createApprovalToken(['ECS', 'CreateServer', '--name=test']);
  const consumed = consumeApprovalToken(token);
  const consumedAgain = consumeApprovalToken(token);
  results['D4-24'].push({ desc: 'approval token', firstConsume: consumed, secondConsume: consumedAgain, oneTime: consumed && !consumedAgain, pass: consumed && !consumedAgain });
} catch(e) {
  results['D4-24'].push({ desc: 'approval token', error: e.message });
}

// D4-27: redactSecrets/redactOutput dual-path redaction completeness
results['D4-27'] = [];
try {
  const testInput = { ak: 'AKIDtest123456789', sk: 'SKtest987654321', adminPass: 'Pass123!', token: 'tok123' };
  const redacted1 = redactSecrets(testInput);
  const redacted2 = redactOutput(JSON.stringify(testInput));
  const json1 = JSON.stringify(redacted1);
  const json2 = JSON.stringify(redacted2);
  const noPlaintext = !json1.includes('AKIDtest') && !json1.includes('SKtest') && !json2.includes('AKIDtest') && !json2.includes('SKtest');
  results['D4-27'].push({ desc: 'dual redaction', redacted1: json1.substring(0, 150), redacted2: json2.substring(0, 150), noPlaintext, pass: noPlaintext });
} catch(e) {
  results['D4-27'].push({ desc: 'dual redaction', error: e.message });
}

// D5-1: manifest discovery and loading
results['D5-1'] = [];
try {
  const r = await callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-core' });
  results['D5-1'].push({ desc: 'skill discovery', ok: r?.ok === true, result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D5-1'].push({ desc: 'skill discovery', error: e.message });
}

// D5-3: tool full enumeration
results['D5-3'] = [];
try {
  const r = await dispatch('tools/list', {});
  const count = r?.tools?.length;
  results['D5-3'].push({ desc: 'tool enumeration', count, pass: count >= 39 });
} catch(e) {
  results['D5-3'].push({ desc: 'tool enum', error: e.message });
}

// D6-4: concurrent scheduling correctness
results['D6-4'] = [];
try {
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(dispatch('tools/list', {}));
  }
  const results5 = await Promise.all(promises);
  const allSame = results5.every(r => r?.tools?.length === results5[0]?.tools?.length);
  results['D6-4'].push({ desc: 'concurrent dispatch', count: results5.length, allSame, pass: allSame });
} catch(e) {
  results['D6-4'].push({ desc: 'concurrent', error: e.message });
}

// D8-4: guided steps mechanically executable
results['D8-4'] = [];
try {
  const r = await callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-cli-and-auth' });
  const content = JSON.stringify(r);
  const hasSteps = content.includes('step') || content.includes('步骤') || content.includes('Step');
  results['D8-4'].push({ desc: 'guided steps', hasSteps, ok: r?.ok === true, pass: r?.ok === true });
} catch(e) {
  results['D8-4'].push({ desc: 'guided steps', error: e.message });
}

// D10-3: routing accuracy + confusion matrix
results['D10-3'] = [];
try {
  const r = await callTool('huaweicloud_service_catalog', { intent: '帮我查一下我账号在华北北京四有哪些云主机' });
  results['D10-3'].push({ desc: 'service_catalog ECS query', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D10-3'].push({ desc: 'service_catalog', error: e.message });
}

console.log(JSON.stringify(results, null, 2));
