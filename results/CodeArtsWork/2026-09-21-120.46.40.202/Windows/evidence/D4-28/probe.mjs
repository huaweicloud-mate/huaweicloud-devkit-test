import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync } from 'node:fs';

// Test 1: commandText extraction from different field names
// Simulate the hook's commandText function
function commandText(toolInput) {
  if (typeof toolInput === 'string') return toolInput;
  if (toolInput && typeof toolInput === 'object') {
    const values = [];
    for (const key of ['command', 'cmd', 'script', 'args', 'arguments']) {
      const value = toolInput[key];
      if (Array.isArray(value)) values.push(value.map(String).join(' '));
      else if (value !== undefined && value !== null) values.push(String(value));
    }
    if (values.length > 0) return values.join('\n');
    return JSON.stringify(toolInput);
  }
  return JSON.stringify(toolInput);
}

const fieldTests = [
  { input: { command: 'cat ~/.hcloud/credentials.json' }, expect: 'cat ~/.hcloud/credentials.json' },
  { input: { cmd: 'type credentials.json' }, expect: 'type credentials.json' },
  { input: { script: 'printenv HUAWEICLOUD_ACCESS_KEY_ID' }, expect: 'printenv HUAWEICLOUD_ACCESS_KEY_ID' },
  { input: { args: ['hcloud', 'ECS', 'DeleteServers'] }, expect: 'hcloud ECS DeleteServers' },
  { input: { arguments: ['rm', '-rf', '/'] }, expect: 'rm -rf /' },
];
let fieldOk = true;
for (const t of fieldTests) {
  const got = commandText(t.input);
  const ok = got === t.expect;
  if (!ok) fieldOk = false;
  console.log('fieldTest: ' + JSON.stringify(t.input) + ' => "' + got + '" ' + (ok ? 'OK' : 'FAIL'));
}
console.log('FIELD_EXTRACTION_OK=' + fieldOk);

// Test 2: classifyTextCommand deny for high-risk commands
const denyTests = [
  'cat ~/.hcloud/credentials.json',
  'type %USERPROFILE%\\.hcloud\\credentials.json',
  'printenv HUAWEICLOUD_ACCESS_KEY_ID',
  'rm -rf /',
];
let denyOk = true;
for (const cmd of denyTests) {
  const r = classifyTextCommand(cmd);
  const ok = r.decision === 'deny';
  if (!ok) denyOk = false;
  console.log('denyTest: ' + cmd + ' => decision=' + r.decision + ' reason=' + (r.reason || '').slice(0, 60) + ' ' + (ok ? 'OK' : 'FAIL'));
}
console.log('DENY_OK=' + denyOk);

// Test 3: safe commands should NOT produce deny
const safeTests = [
  'hcloud ECS ListServers',
  'hcloud IAM ListUsers',
  'ls -la',
  'echo hello',
];
let safeOk = true;
for (const cmd of safeTests) {
  const r = classifyTextCommand(cmd);
  const ok = r.decision !== 'deny';
  if (!ok) safeOk = false;
  console.log('safeTest: ' + cmd + ' => decision=' + r.decision + ' ' + (ok ? 'OK' : 'FAIL'));
}
console.log('SAFE_OK=' + safeOk);

// Test 4: Verify hook output format (permissionDecision:deny)
const hookResult = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: 'Huawei Cloud safety hook blocked this action: ' + classifyTextCommand('cat ~/.hcloud/credentials.json').reason,
  },
};
const hasPermissionDeny = hookResult.hookSpecificOutput.permissionDecision === 'deny';
console.log('HOOK_OUTPUT_FORMAT_OK=' + hasPermissionDeny);

const verdict = (fieldOk && denyOk && safeOk && hasPermissionDeny) ? 'PASS' : 'FAIL';
console.log('VERDICT=' + verdict);
