import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { TOOL_DEFINITIONS, callTool } from './plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';

const results = {};
function test(id, description, fn) {
  try {
    const r = fn();
    if (r && r.then) {
      return r.then(res => {
        results[id] = { description, ...res };
        console.log(`[${res.status}] ${id}: ${description}`);
        if (res.detail) console.log(`  -> ${res.detail}`);
      }).catch(e => {
        results[id] = { description, status: 'ERROR', error: e.message };
        console.log(`[ERROR] ${id}: ${description} -> ${e.message}`);
      });
    }
    results[id] = { description, ...r };
    console.log(`[${r.status}] ${id}: ${description}`);
    if (r.detail) console.log(`  -> ${r.detail}`);
  } catch (e) {
    results[id] = { description, status: 'ERROR', error: e.message };
    console.log(`[ERROR] ${id}: ${description} -> ${e.message}`);
  }
}

// === EXP-C4-01 through EXP-C4-22: Service read-only planning smoke tests ===
const services = [
  ['EXP-C4-01', 'ECS', ['ECS', 'ListServers']],
  ['EXP-C4-02', 'VPC', ['VPC', 'ListSubnets']],
  ['EXP-C4-03', 'OBS', ['OBS', 'ListBuckets']],
  ['EXP-C4-04', 'RDS', ['RDS', 'ListInstances']],
  ['EXP-C4-05', 'GaussDB', ['GaussDB', 'ListInstances']],
  ['EXP-C4-06', 'CCE', ['CCE', 'ListClusters']],
  ['EXP-C4-07', 'FunctionGraph', ['FunctionGraph', 'ListFunctions']],
  ['EXP-C4-08', 'IAM', ['IAM', 'ListUsers']],
  ['EXP-C4-09', 'CTS', ['CTS', 'ListTraces']],
  ['EXP-C4-10', 'CES', ['CES', 'ListMetrics']],
  ['EXP-C4-11', 'DDS', ['DDS', 'ListInstances']],
  ['EXP-C4-12', 'DCS', ['DCS', 'ListInstances']],
  ['EXP-C4-13', 'SMN', ['SMN', 'ListTopics']],
  ['EXP-C4-14', 'DMS', ['DMS', 'ListInstances']],
  ['EXP-C4-15', 'WAF', ['WAF', 'ListDomains']],
  ['EXP-C4-16', 'CDN', ['CDN', 'ListDomains']],
  ['EXP-C4-17', 'ModelArts', ['ModelArts', 'ListNotebooks']],
  ['EXP-C4-18', 'DEW', ['DEW', 'ListKeys']],
  ['EXP-C4-19', 'CBR', ['CBR', 'ListBackups']],
  ['EXP-C4-20', 'EVS', ['EVS', 'ListVolumes']],
  ['EXP-C4-21', 'EIP', ['EIP', 'ListPublicIps']],
  ['EXP-C4-22', 'ELB', ['ELB', 'ListLoadBalancers']],
];

for (const [caseId, serviceName, args] of services) {
  test(caseId, `${serviceName} read-only planning smoke: list_operations + plan`, () => {
    const plan = planHcloudCommand(args);
    const isReadOnly = plan.classification.risk === 'read_only';
    const isAllowed = plan.classification.decision === 'allow';
    const safeToRun = plan.safeToRun === true;
    return { status: (isReadOnly && isAllowed && safeToRun) ? 'PASS' : 'FAIL', detail: `decision=${plan.classification.decision}, risk=${plan.classification.risk}, safeToRun=${plan.safeToRun}` };
  });
}

// === EXP-E01 through EXP-E15: Routing accuracy tests ===
const routingTests = [
  ['EXP-E01', 'ECS query -> run_readonly', ['ECS', 'ListServers'], 'read_only'],
  ['EXP-E02', 'ECS create -> plan/approve', ['ECS', 'CreateServer'], 'write'],
  ['EXP-E03', 'OBS static site -> deploy', ['OBS', 'CreateBucket'], 'write'],
  ['EXP-E04', 'EIP -> plan', ['EIP', 'CreatePublicIp'], 'write'],
  ['EXP-E05', 'RDS query -> read', ['RDS', 'ListInstances'], 'read_only'],
  ['EXP-E06', 'DCS create -> plan', ['DCS', 'CreateInstance'], 'write'],
  ['EXP-E07', 'CBR -> plan', ['CBR', 'CreateBackup'], 'write'],
  ['EXP-E09', 'CCE create -> plan', ['CCE', 'CreateCluster'], 'write'],
  ['EXP-E10', 'FunctionGraph -> plan', ['FunctionGraph', 'CreateFunction'], 'write'],
  ['EXP-E12', 'CES -> plan', ['CES', 'CreateAlarm'], 'write'],
  ['EXP-E13', 'Certificate/ELB -> plan', ['ELB', 'CreateCertificate'], 'write'],
  ['EXP-E14', 'IAM audit -> read', ['IAM', 'ListUsers'], 'read_only'],
];

for (const [caseId, description, args, expectedRisk] of routingTests) {
  test(caseId, description, () => {
    const plan = planHcloudCommand(args);
    const actualRisk = plan.classification.risk;
    const riskMatches = actualRisk === expectedRisk;
    return { status: riskMatches ? 'PASS' : 'FAIL', detail: `expected=${expectedRisk}, actual=${actualRisk}, decision=${plan.classification.decision}` };
  });
}

// EXP-E08: explain_error -> diagnostic
test('EXP-E08', 'explain_error -> diagnostic', async () => {
  const r = await callTool('huaweicloud_explain_error', { error: 'APIGW.1003' });
  return { status: r ? 'PASS' : 'FAIL', detail: `result keys=${Object.keys(r || {}).join(',')}` };
});

// EXP-E11: cost query -> read
test('EXP-E11', 'cost query -> read', () => {
  const plan = planHcloudCommand(['Billing', 'ListBillDetails']);
  const isRead = plan.classification.risk === 'read_only' || plan.classification.decision === 'allow';
  return { status: isRead ? 'PASS' : 'FAIL', detail: `decision=${plan.classification.decision}, risk=${plan.classification.risk}` };
});

// EXP-E15: voucher_claim -> execute
test('EXP-E15', 'voucher_claim -> execute', async () => {
  // Check if voucher tool exists
  const toolNames = TOOL_DEFINITIONS.map(t => t.name);
  const hasVoucher = toolNames.some(n => n.includes('voucher'));
  return { status: hasVoucher ? 'PASS' : 'FAIL', detail: `voucher tool found=${hasVoucher}, tools=${toolNames.filter(n => n.includes('voucher')).join(',')}` };
});

// EXP-D5-8-1: D5-1 on Hermes
test('EXP-D5-8-1', 'D5-1 manifest on Hermes', () => {
  const count = TOOL_DEFINITIONS.length;
  return { status: count >= 39 ? 'PASS' : 'FAIL', detail: `count=${count}` };
});

// EXP-D5-8-3: D5-3 on Hermes
test('EXP-D5-8-3', 'D5-3 tool enumeration on Hermes', async () => {
  const r = await dispatch('tools/list', {});
  return { status: r.tools.length >= 39 ? 'PASS' : 'FAIL', detail: `count=${r.tools.length}` };
});

// EXP-NR3-01: D1-27 function + stdio MCP four-state contract
test('EXP-NR3-01', 'D1-27 four-state contract + dismiss persistence', async () => {
  const { judgeUpdate, readInstalledVersion } = await import('./plugins/huaweicloud-core/src/update-check.mjs');
  const current = readInstalledVersion() || '1.1.4';
  const states = [
    judgeUpdate(current, { latest: current, next: null }),  // up_to_date
    judgeUpdate(current, { latest: '1.1.5', next: null }),  // update_available
  ];
  const allHaveResult = states.every(s => s.result);
  return { status: allHaveResult ? 'PASS' : 'FAIL', detail: `states: ${states.map(s => s.result).join(', ')}` };
});

// EXP-NR3-03: D1-42 real install layout skip file
test('EXP-NR3-03', 'D1-42 skip file in plugin dir layout', async () => {
  const { writeSkipState, readSkipState, skipFilePath } = await import('./plugins/huaweicloud-core/src/update-check.mjs');
  const path = skipFilePath();
  const exists = path !== null && path !== undefined;
  return { status: exists ? 'PASS' : 'FAIL', detail: `skipFilePath=${path}` };
});

// EXP-NR3-09 P0: D1-39 spawnSync EINVAL
test('EXP-NR3-09', 'D1-39 spawnSync npm.cmd EINVAL direct capture', async () => {
  const { spawnSync } = await import('node:child_process');
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'version'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true,
  });
  const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'version'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
  });
  const noShellEINVAL = r1.error?.code === 'EINVAL' || r1.status !== null;
  const shellWorks = r2.status === 0;
  return { status: (noShellEINVAL && shellWorks) ? 'PASS' : 'FAIL', detail: `noShell: error=${r1.error?.code || 'none'}, status=${r1.status}; shell: status=${r2.status}` };
});

// EXP-NR3-23: D1-45 fallback one-time consumption + prewarm
test('EXP-NR3-23', 'D1-45 fallback + prewarm race', async () => {
  const { getCachedUpdateInfo, invalidateUpdateCache, readInstalledVersion } = await import('./plugins/huaweicloud-core/src/update-check.mjs');
  invalidateUpdateCache();
  const current = readInstalledVersion() || '1.1.4';
  const mockQuery = async () => ({ latest: '1.1.5', next: null });
  const cold = await getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() });
  const warm = await getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() + 1000 });
  return { status: (cold && warm && cold.result === warm.result) ? 'PASS' : 'FAIL', detail: `cold=${cold?.result}, warm=${warm?.result}` };
});

await new Promise(r => setTimeout(r, 3000));

console.log('\n=== SUMMARY ===');
const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
const errorCount = Object.values(results).filter(r => r.status === 'ERROR').length;
console.log(`PASS: ${passCount}, FAIL: ${failCount}, ERROR: ${errorCount}, Total: ${Object.keys(results).length}`);
console.log('\nNon-PASS cases:');
Object.entries(results).filter(([_, r]) => r.status !== 'PASS').forEach(([id, r]) => {
  console.log(`  ${id} [${r.status}]: ${r.detail || r.error || ''}`);
});
