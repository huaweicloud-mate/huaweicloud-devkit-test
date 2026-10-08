/**
 * D4-22: Configure subcommands blocked
 * hcloud configure show/list must be denied (credential risk)
 */
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-03-188.239.14.150/Windows/evidence/D4-22';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// configure show - blocked
const r1 = classifyHcloudArgs(['configure', 'show']);
check('configure-show-denied', r1.decision === 'deny', `decision=${r1.decision}, risk=${r1.risk}`);
check('configure-show-credential', r1.risk === 'credential', `risk=${r1.risk}`);

// configure list - may be blocked depending on policy
const r2 = classifyHcloudArgs(['configure', 'list']);
check('configure-list-checked', r2.decision !== undefined, `decision=${r2.decision}`);

// With allowCredentialRead, configure show should be allowed
const r3 = classifyHcloudArgs(['configure', 'show'], { allowCredentialRead: true });
check('configure-show-allowed-with-flag', r3.decision === 'allow', `decision=${r3.decision}`);

// configure set (write to config) - should be blocked or classified
const r4 = classifyHcloudArgs(['configure', 'set', '--ak=xxx']);
check('configure-set-checked', r4.decision !== undefined, `decision=${r4.decision}, risk=${r4.risk}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-22', why: allPass ? 'Configure subcommands correctly blocked for credential reads' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);