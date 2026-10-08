/**
 * D4-15: Execution operations blocked without approval
 * Invoke, Start, Stop, Reboot, Deploy, Publish etc. must be denied
 */
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-02-188.239.14.150/Windows/evidence/D4-15';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

const execCmds = [
  ['ECS', 'StartServer'],
  ['ECS', 'StopServer'],
  ['ECS', 'RebootServer'],
  ['FunctionGraph', 'InvokeFunction'],
  ['SMN', 'PublishMessage'],
  ['CCE', 'StartCluster'],
];
for (const [svc, op] of execCmds) {
  const r = classifyHcloudArgs([svc, op]);
  check(`${svc}-${op}-denied`, r.decision === 'deny', `decision=${r.decision}, risk=${r.risk}`);
  check(`${svc}-${op}-exec-risk`, r.risk === 'execution' || r.risk === 'write', `risk=${r.risk}`);
}
// With allowWrites, execution should be allowed
const approved = classifyHcloudArgs(['ECS', 'StartServer'], { allowWrites: true });
check('approved-exec', approved.decision === 'allow', `decision=${approved.decision}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-15', why: allPass ? 'Execution operations correctly blocked without approval' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);