/**
 * D4-16: Shell-wrapped write commands denied
 * Concatenated commands with shell operators (&&, ||, ;, |) must classify each segment
 */
import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-04-188.239.14.150/Windows/evidence/D4-16';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// Concatenated: read && write
const r1 = classifyTextCommand('hcloud ECS ListServers && hcloud ECS CreateServer');
check('concat-read-write-denied', r1.decision === 'deny', `decision=${r1.decision}, risk=${r1.risk}`);

// Semicolon separated
const r2 = classifyTextCommand('hcloud ECS ListServers; hcloud VPC DeleteVpc');
check('semicolon-write-denied', r2.decision === 'deny', `decision=${r2.decision}, risk=${r2.risk}`);

// Pipe
const r3 = classifyTextCommand('hcloud ECS ListServers | hcloud ECS DeleteServer');
check('pipe-write-denied', r3.decision === 'deny', `decision=${r3.decision}, risk=${r3.risk}`);

// eval wrapper
const r4 = classifyTextCommand('eval "hcloud ECS CreateServer"');
check('eval-write-denied', r4.decision === 'deny', `decision=${r4.decision}, risk=${r4.risk}`);

// $() substitution
const r5 = classifyTextCommand('$(hcloud ECS CreateServer)');
check('cmdsubst-write-denied', r5.decision === 'deny', `decision=${r5.decision}, risk=${r5.risk}`);

// Backtick substitution
const r6 = classifyTextCommand('`hcloud ECS DeleteServer`');
check('backtick-write-denied', r6.decision === 'deny', `decision=${r6.decision}, risk=${r6.risk}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-16', why: allPass ? 'Shell-wrapped and concatenated write commands correctly denied' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);