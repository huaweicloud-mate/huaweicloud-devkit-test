// D4-9: 公开暴露/破坏性预检
import { evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const results = [];

const publicExposureResult = evaluateCommandRisk('hcloud VPC CreateSecurityGroupRule --security_group_id=sg-123 --remote_ip_prefix=0.0.0.0/0 --port_range_min=22 --protocol=tcp');
results.push({
  test: 'Public exposure - SSH port open to public',
  decision: publicExposureResult.decision,
  category: publicExposureResult.findings?.[0]?.category,
  expected: 'deny',
  passed: publicExposureResult.decision === 'deny' && publicExposureResult.findings?.some(f => f.category === 'public_exposure')
});

const rdpExposureResult = evaluateCommandRisk('hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_min=3389 --protocol=tcp');
results.push({
  test: 'Public exposure - RDP port open to public',
  decision: rdpExposureResult.decision,
  category: rdpExposureResult.findings?.[0]?.category,
  expected: 'deny',
  passed: rdpExposureResult.decision === 'deny' && rdpExposureResult.findings?.some(f => f.category === 'public_exposure')
});

const destructiveResult = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=123 --force');
results.push({
  test: 'Destructive operation - force delete',
  decision: destructiveResult.decision,
  category: destructiveResult.findings?.[0]?.category,
  expected: 'deny',
  passed: destructiveResult.decision === 'deny' || destructiveResult.findings?.some(f => f.category === 'destructive')
});

const cascadeDeleteResult = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=123 --delete_publicip=true --delete_volume=true');
results.push({
  test: 'Destructive operation - cascade delete',
  decision: cascadeDeleteResult.decision,
  category: cascadeDeleteResult.findings?.[0]?.category,
  expected: 'deny or warn',
  passed: cascadeDeleteResult.decision === 'deny' || cascadeDeleteResult.decision === 'warn'
});

const allPassed = results.every(r => r.passed);
console.log(JSON.stringify({
  status: allPassed ? 'PASS' : 'FAIL',
  caseId: 'D4-9',
  title: '公开暴露/破坏性预检',
  timestamp: new Date().toISOString(),
  results: results
}, null, 2));
