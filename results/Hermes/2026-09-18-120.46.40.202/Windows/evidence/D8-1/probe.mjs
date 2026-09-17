import { callTool, TOOL_DEFINITIONS } from './plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { semverCompare, semverParse, hasPrerelease } from './plugins/huaweicloud-core/src/update-check.mjs';
import { classifyHcloudArgs, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

const results = {};

// D3-C4: Service creation class regression
results['D3-C4'] = [];
try {
  const services = ['ECS', 'VPC', 'RDS', 'CCE', 'WAF'];
  for (const svc of services) {
    const plan = planHcloudCommand([svc, 'Create', '--name=test']);
    results['D3-C4'].push({ service: svc, decision: plan?.classification?.decision, pass: plan?.classification?.decision === 'deny' });
  }
} catch(e) {
  results['D3-C4'].push({ desc: 'service creation', error: e.message });
}

// D4-10: Rule library new rule regression
results['D4-10'] = [];
try {
  const r = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServer --server_id=test --force=true' });
  results['D4-10'].push({ desc: 'new rule check', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D4-10'].push({ desc: 'new rule', error: e.message });
}

// D4-12: Supply chain install-time security
results['D4-12'] = [];
try {
  // Check if install process verifies package integrity
  const r = await callTool('huaweicloud_check_cli', {});
  results['D4-12'].push({ desc: 'install security', result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D4-12'].push({ desc: 'install security', error: e.message });
}

// D4-14: Operation auditability
results['D4-14'] = [];
try {
  const r = await callTool('huaweicloud_plan_cli_command', { service: 'ECS', operation: 'ListServers' });
  results['D4-14'].push({ desc: 'plan auditability', ok: r?.ok !== false, hasCommand: !!r?.command, result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D4-14'].push({ desc: 'auditability', error: e.message });
}

// D6-1: Search response latency
results['D6-1'] = [];
try {
  const start = Date.now();
  const r = await callTool('huaweicloud_search_docs', { query: 'ECS' });
  const elapsed = Date.now() - start;
  results['D6-1'].push({ desc: 'search latency', elapsed, ok: r?.ok !== false, pass: elapsed < 5000 });
} catch(e) {
  results['D6-1'].push({ desc: 'search latency', error: e.message });
}

// D6-3: MCP cold start time
results['D6-3'] = [];
try {
  const start = Date.now();
  const r = await dispatch('tools/list', {});
  const elapsed = Date.now() - start;
  results['D6-3'].push({ desc: 'cold start', elapsed, count: r?.tools?.length, pass: elapsed < 5000 });
} catch(e) {
  results['D6-3'].push({ desc: 'cold start', error: e.message });
}

// D7-4: Domestic mirror source installation
results['D7-4'] = [];
try {
  // Check if mirror configuration is supported
  const r = await callTool('huaweicloud_check_update', {});
  results['D7-4'].push({ desc: 'mirror check', result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D7-4'].push({ desc: 'mirror', error: e.message });
}

// D8-1: Documentation and capability consistency
results['D8-1'] = [];
try {
  const r = await callTool('huaweicloud_search_docs', { query: 'huaweicloud' });
  results['D8-1'].push({ desc: 'doc consistency', ok: r?.ok !== false, count: r?.count, result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D8-1'].push({ desc: 'doc consistency', error: e.message });
}

// D8-6: Chinese-English documentation consistency
results['D8-6'] = [];
try {
  const r1 = await callTool('huaweicloud_search_docs', { query: 'ECS create' });
  const r2 = await callTool('huaweicloud_search_docs', { query: '创建云服务器' });
  results['D8-6'].push({ desc: 'i18n docs', enCount: r1?.count, zhCount: r2?.count, pass: r1?.ok !== false && r2?.ok !== false });
} catch(e) {
  results['D8-6'].push({ desc: 'i18n docs', error: e.message });
}

console.log(JSON.stringify(results, null, 2));
