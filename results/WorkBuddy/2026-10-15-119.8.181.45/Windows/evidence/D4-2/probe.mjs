import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-2';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-2: Credential env print interception (RED-LINE case)
// Must construct real attack inputs per the red-line constraint
const testCommands = [
  // Direct printenv of cloud credential env vars
  { cmd: 'printenv HW_ACCESS_KEY', desc: 'printenv HW_ACCESS_KEY' },
  { cmd: 'printenv HW_SECRET_KEY', desc: 'printenv HW_SECRET_KEY' },
  { cmd: 'printenv HUAWEICLOUD_ACCESS_KEY_ID', desc: 'printenv HUAWEICLOUD_ACCESS_KEY_ID' },
  { cmd: 'printenv HUAWEICLOUD_SECRET_ACCESS_KEY', desc: 'printenv HUAWEICLOUD_SECRET_ACCESS_KEY' },
  { cmd: 'printenv HW_SECURITY_TOKEN', desc: 'printenv HW_SECURITY_TOKEN' },
  // echo $VAR
  { cmd: 'echo $HW_ACCESS_KEY', desc: 'echo $HW_ACCESS_KEY' },
  { cmd: 'echo $HW_SECRET_KEY', desc: 'echo $HW_SECRET_KEY' },
  { cmd: 'echo $HUAWEICLOUD_SECRET_ACCESS_KEY', desc: 'echo $HUAWEICLOUD_SECRET_ACCESS_KEY' },
  { cmd: 'echo ${HW_ACCESS_KEY}', desc: 'echo ${HW_ACCESS_KEY} (braced)' },
  // env | grep cloud
  { cmd: 'env | grep HUAWEICLOUD', desc: 'env grep HUAWEICLOUD' },
  { cmd: 'env | grep HW_', desc: 'env grep HW_' },
  { cmd: 'env | grep HCLOUD', desc: 'env grep HCLOUD' },
  // bash -c wrapper (penetration / env·bash red-line)
  { cmd: 'bash -c "printenv HW_ACCESS_KEY"', desc: 'bash -c printenv HW_ACCESS_KEY' },
  { cmd: 'bash -c "echo $HW_SECRET_KEY"', desc: 'bash -c echo $HW_SECRET_KEY' },
  { cmd: 'bash -c "env | grep -E \'HUAWEICLOUD|HW_|HCLOUD\'"', desc: 'bash -c env grep cloud creds' },
  // PowerShell with cloud filter
  { cmd: 'Get-ChildItem Env: | findstr HUAWEICLOUD', desc: 'PowerShell Env: findstr HUAWEICLOUD' },
  { cmd: 'gci Env: | Select-String HW_', desc: 'PowerShell gci Env: Select-String HW_' },
  // Non-cloud echo should be allowed (negative test)
  { cmd: 'echo hello', desc: 'echo hello (negative test)', expected: 'allow' },
  { cmd: 'printenv PATH', desc: 'printenv PATH (negative test)', expected: 'allow' },
];

let allCorrect = true;
const results = [];
for (const { cmd, desc, expected } of testCommands) {
  const result = classifyTextCommand(cmd);
  const expectedDecision = expected || 'deny';
  const matches = result.decision === expectedDecision;
  if (!matches) allCorrect = false;
  // Sanitize: replace actual env var names with short labels in output
  const safeCmd = cmd
    .replace(/HW_ACCESS_KEY/g, 'HW_AK')
    .replace(/HW_SECRET_KEY/g, 'HW_SK')
    .replace(/HUAWEICLOUD_ACCESS_KEY_ID/g, 'HL_AK')
    .replace(/HUAWEICLOUD_SECRET_ACCESS_KEY/g, 'HL_SK')
    .replace(/HW_SECURITY_TOKEN/g, 'HW_ST');
  results.push({ cmd: safeCmd, desc, decision: result.decision, risk: result.risk, expected: expectedDecision, matches });
}

const status = allCorrect ? 'PASS' : 'FAIL';
const failedTests = results.filter(r => !r.matches);
const why = allCorrect
  ? `All ${testCommands.length} tests passed: ${results.filter(r=>r.expected==='deny'&&r.decision==='deny').length} denied, ${results.filter(r=>r.expected==='allow'&&r.decision==='allow').length} allowed (negative tests).`
  : `${failedTests.length} of ${testCommands.length} tests did not match: ${failedTests.map(r => `${r.desc}(expected=${r.expected}, got=${r.decision})`).join(', ')}`;

const output = {
  caseId,
  status,
  why,
  executedAt: execTs,
  result: {
    totalTests: testCommands.length,
    correct: results.filter(r => r.matches).length,
    incorrect: failedTests.length,
    tests: results
  }
};

writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
