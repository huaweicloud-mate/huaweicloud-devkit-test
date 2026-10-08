/**
 * D4-9: Shell wrapper unwrapping
 * classifyHcloudArgs/classifyTextCommand must unwrap bash -c, cmd /c, powershell -Command wrappers
 */
import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-02-188.239.14.150/Windows/evidence/D4-9';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// bash -c wrapper with write command
const r1 = classifyTextCommand('bash -c "hcloud ECS CreateServer"');
check('bash-c-write-denied', r1.decision === 'deny', `decision=${r1.decision}, risk=${r1.risk}`);

// cmd /c wrapper
const r2 = classifyTextCommand('cmd /c "hcloud ECS DeleteServer --server-id=x"');
check('cmd-c-write-denied', r2.decision === 'deny', `decision=${r2.decision}, risk=${r2.risk}`);

// powershell -Command wrapper
const r3 = classifyTextCommand('powershell -Command "hcloud VPC CreateVpc"');
check('ps-write-denied', r3.decision === 'deny', `decision=${r3.decision}, risk=${r3.risk}`);

// sudo wrapper
const r4 = classifyTextCommand('sudo hcloud ECS CreateServer');
check('sudo-write-denied', r4.decision === 'deny', `decision=${r4.decision}, risk=${r4.risk}`);

// Read command through wrapper should be allowed
const r5 = classifyTextCommand('bash -c "hcloud ECS ListServers"');
check('bash-c-read-allowed', r5.decision === 'allow', `decision=${r5.decision}, risk=${r5.risk}`);

// Direct classifyHcloudArgs with shell wrapper tokens
const r6 = classifyHcloudArgs(['bash', '-c', 'hcloud ECS CreateServer']);
check('direct-bash-c-denied', r6.decision === 'deny', `decision=${r6.decision}, risk=${r6.risk}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-9', why: allPass ? 'Shell wrappers correctly unwrapped and classified' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);