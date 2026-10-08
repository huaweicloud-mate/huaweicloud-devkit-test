/**
 * D4-5: Safety policy blocks credential file reading
 * classifyTextCommand must deny cat ~/.config/huaweicloud/credentials.json, hcloud configure show, etc.
 */
import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-03-188.239.14.150/Windows/evidence/D4-5';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// hcloud configure show should be denied (credential risk)
const r1 = classifyHcloudArgs(['configure', 'show']);
check('configure-show-denied', r1.decision === 'deny', `decision=${r1.decision}, risk=${r1.risk}`);
check('configure-show-credential', r1.risk === 'credential', `risk=${r1.risk}`);

// Text command: cat credentials file
const r2 = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
check('cat-cred-denied', r2.decision === 'deny', `decision=${r2.decision}, risk=${r2.risk}`);

// Text command: env | grep HUAWEICLOUD
const r3 = classifyTextCommand('env | grep HUAWEICLOUD');
check('env-grep-denied', r3.decision === 'deny', `decision=${r3.decision}, risk=${r3.risk}`);

// Text command: printenv HW_SECRET_KEY
const r4 = classifyTextCommand('printenv HW_SECRET_KEY');
check('printenv-sk-denied', r4.decision === 'deny', `decision=${r4.decision}, risk=${r4.risk}`);

// Text command: echo $HW_ACCESS_KEY
const r5 = classifyTextCommand('echo $HW_ACCESS_KEY');
check('echo-ak-denied', r5.decision === 'deny', `decision=${r5.decision}, risk=${r5.risk}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-5', why: allPass ? 'Credential reading correctly blocked' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);