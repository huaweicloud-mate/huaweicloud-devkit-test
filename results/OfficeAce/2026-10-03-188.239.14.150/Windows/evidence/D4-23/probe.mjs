/**
 * D4-23: Secret string/binary operations blocked
 * Any command containing secret_string, secret_binary, ShowSecret, GetSecretValue patterns must be denied
 */
import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-03-188.239.14.150/Windows/evidence/D4-23';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// Direct secret operations
const secretOps = ['ShowSecret', 'ShowSecretVersion', 'GetSecretValue', 'showsecret', 'showsecretversion'];
for (const op of secretOps) {
  const r = classifyHcloudArgs(['DEW', op]);
  check(`${op}-denied`, r.decision === 'deny', `decision=${r.decision}, risk=${r.risk}`);
}

// secret_string pattern in args
const r1 = classifyHcloudArgs(['DEW', 'CreateSecret', '--secret_string=mysecret']);
check('secret-string-pattern', r1.decision === 'deny', `decision=${r1.decision}, risk=${r1.risk}`);

// secret_binary pattern
const r2 = classifyHcloudArgs(['DEW', 'CreateSecret', '--secret_binary=base64data']);
check('secret-binary-pattern', r2.decision === 'deny', `decision=${r2.decision}, risk=${r2.risk}`);

// Text command with secret pattern
const r3 = classifyTextCommand('hcloud DEW ShowSecret --secret_id=xxx');
check('text-secret-denied', r3.decision === 'deny', `decision=${r3.decision}, risk=${r3.risk}`);

// Text command with GetSecretValue
const r4 = classifyTextCommand('hcloud CSMS GetSecretValue');
check('text-getsecret-denied', r4.decision === 'deny', `decision=${r4.decision}, risk=${r4.risk}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-23', why: allPass ? 'Secret string/binary operations correctly blocked' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);