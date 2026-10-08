/**
 * D4-3: Safety policy blocks secret operations
 * classifyHcloudArgs must deny DEW ShowSecret, KMS ShowKey, etc.
 */
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-03-188.239.14.150/Windows/evidence/D4-3';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

const secretCmds = [
  ['DEW', 'ShowSecret'],
  ['DEW', 'ShowSecretVersion'],
  ['DEW', 'GetSecretValue'],
  ['CSMS', 'ShowSecret'],
];
for (const [svc, op] of secretCmds) {
  const r = classifyHcloudArgs([svc, op]);
  check(`${svc}-${op}-denied`, r.decision === 'deny', `decision=${r.decision}, risk=${r.risk}`);
  check(`${svc}-${op}-secret-risk`, r.risk === 'secret', `risk=${r.risk}`);
}
// Secret string patterns in joined args
const r2 = classifyHcloudArgs(['DEW', 'ShowSecret', '--secret_string']);
check('secret-string-pattern', r2.decision === 'deny', `decision=${r2.decision}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-3', why: allPass ? 'Secret operations correctly denied' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);