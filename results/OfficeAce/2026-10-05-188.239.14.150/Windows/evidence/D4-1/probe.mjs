/**
 * D4-1: Safety policy blocks write operations without approval
 * classifyHcloudArgs must deny ECS CreateServer, VPC CreateVpc, etc.
 */
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-04-188.239.14.150/Windows/evidence/D4-1';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

const writeCmds = [
  ['ECS', 'CreateServer'],
  ['VPC', 'CreateVpc'],
  ['ECS', 'UpdateServer'],
  ['EVS', 'CreateVolume'],
  ['VPC', 'CreateSubnet'],
  ['RDS', 'CreateInstance'],
];
for (const [svc, op] of writeCmds) {
  const r = classifyHcloudArgs([svc, op, '--cli-region-id=cn-north-4']);
  check(`${svc}-${op}-denied`, r.decision === 'deny', `decision=${r.decision}, risk=${r.risk}`);
  check(`${svc}-${op}-write-risk`, r.risk === 'write' || r.risk === 'execution', `risk=${r.risk}`);
}
// With allowWrites, should be allowed
const approved = classifyHcloudArgs(['ECS', 'CreateServer'], { allowWrites: true });
check('approved-when-allowWrites', approved.decision === 'allow', `decision=${approved.decision}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-1', why: allPass ? 'Write operations correctly denied without approval, allowed with allowWrites' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);