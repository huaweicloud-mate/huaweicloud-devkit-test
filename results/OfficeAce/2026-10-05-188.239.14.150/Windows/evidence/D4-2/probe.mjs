/**
 * D4-2: Safety policy allows read-only operations
 * classifyHcloudArgs must allow ECS ListServers, VPC ListVpcs, etc.
 */
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-04-188.239.14.150/Windows/evidence/D4-2';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

const readCmds = [
  ['ECS', 'ListServers'],
  ['VPC', 'ListVpcs'],
  ['EVS', 'ListVolumes'],
  ['RDS', 'ListInstances'],
  ['IAM', 'ListUsers'],
  ['CES', 'ListMetrics'],
];
for (const [svc, op] of readCmds) {
  const r = classifyHcloudArgs([svc, op, '--cli-region-id=cn-north-4']);
  check(`${svc}-${op}-allowed`, r.decision === 'allow', `decision=${r.decision}, risk=${r.risk}`);
  check(`${svc}-${op}-read-risk`, r.risk === 'read_only' || r.risk === 'unknown_read', `risk=${r.risk}`);
}
// Local help/version
check('help-allowed', classifyHcloudArgs(['--help']).decision === 'allow', 'help allowed');
check('version-allowed', classifyHcloudArgs(['version']).decision === 'allow', 'version allowed');

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-2', why: allPass ? 'Read-only operations correctly allowed' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);