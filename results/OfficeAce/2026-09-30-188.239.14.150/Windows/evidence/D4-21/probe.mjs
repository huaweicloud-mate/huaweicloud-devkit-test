/**
 * D4-21: OBS write operations blocked
 * obs cp, obs rm, obs mb, obs sync etc. must be denied without approval
 */
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence/D4-21';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

const obsWrites = ['cp', 'rm', 'mb', 'mv', 'sync', 'delete', 'mkdir', 'restore'];
for (const op of obsWrites) {
  const r = classifyHcloudArgs(['obs', op, 'bucket://path']);
  check(`obs-${op}-denied`, r.decision === 'deny', `decision=${r.decision}, risk=${r.risk}`);
  check(`obs-${op}-write-risk`, r.risk === 'write', `risk=${r.risk}`);
}
// OBS reads should be allowed
const obsReads = ['ls', 'stat', 'cat', 'help', 'version'];
for (const op of obsReads) {
  const r = classifyHcloudArgs(['obs', op, 'bucket://path']);
  check(`obs-${op}-allowed`, r.decision === 'allow', `decision=${r.decision}, risk=${r.risk}`);
}
// With allowWrites, OBS write should be allowed
const approved = classifyHcloudArgs(['obs', 'cp', 'bucket://path'], { allowWrites: true });
check('obs-cp-approved', approved.decision === 'allow', `decision=${approved.decision}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-21', why: allPass ? 'OBS write operations correctly blocked, reads allowed' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20260930103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);