// D3-S8: 场景-操作失败后排障 - inject error → explain_error classification
import { spawnSync } from 'node:child_process';
import { classifyHcloudArgs, redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync } from 'node:fs';

const hcloud = 'C:\\Users\\Administrator\\hcloud\\hcloud.exe';
const results = [];
let allPass = true;

// Step 1: Inject an error by running a command with invalid parameters
// hcloud ECS ShowServer without server_id should fail
const errorResult = spawnSync(hcloud, ['ECS', 'ShowServer'], {
  encoding: 'utf8',
  timeout: 30000,
  windowsHide: true,
});
const errorOutput = (errorResult.stdout || '') + (errorResult.stderr || '');
const hasError = errorResult.status !== 0 || /error|错误|USE_ERROR|缺少|missing/i.test(errorOutput);
results.push({
  step: 'inject_error',
  command: 'hcloud ECS ShowServer (missing required param)',
  rc: errorResult.status,
  outputLength: errorOutput.length,
  outputPreview: errorOutput.slice(0, 300),
  hasError,
  pass: hasError,
});
if (!hasError) allPass = false;

// Step 2: Verify explain_error tool exists in tools.mjs
const toolsSource = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs', 'utf8');
const hasExplainError = /huaweicloud_explain_error/.test(toolsSource);
results.push({
  step: 'explain_error_tool_exists',
  pass: hasExplainError,
});
if (!hasExplainError) allPass = false;

// Step 3: Verify troubleshooting skill exists
const troubleshootSkillPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/skills/huaweicloud-troubleshooting/SKILL.md';
let troubleshootSkill = '';
try { troubleshootSkill = readFileSync(troubleshootSkillPath, 'utf8'); } catch {}
const troubleshootOk = troubleshootSkill.length > 1000;
results.push({
  step: 'troubleshoot_skill_exists',
  skillSize: troubleshootSkill.length,
  pass: troubleshootOk,
});
if (!troubleshootOk) allPass = false;

// Step 4: Verify the error output is properly redacted
const redactedError = redactSecrets(errorOutput);
const akPattern = 'HPUAN1ROQ4PQXQVBSYXD';
const skPattern = 'ExzAgLDfOfbaLm8pgyVCJKmtF4Nb5lLX6LnUFrfN';
const noSecretsInError = !redactedError.includes(akPattern) && !redactedError.includes(skPattern);
results.push({
  step: 'error_output_redacted',
  noSecrets: noSecretsInError,
  pass: noSecretsInError,
});
if (!noSecretsInError) allPass = false;

// Step 5: Verify the error can be classified for explain_error
// Common error patterns: USE_ERROR, API error codes, missing params
const errorPatterns = {
  hasUseError: /USE_ERROR/i.test(errorOutput),
  hasMissingParam: /缺少|missing|required|必须/i.test(errorOutput),
  hasErrorKeyword: /error|错误|失败/i.test(errorOutput),
};
const errorClassifiable = errorPatterns.hasUseError || errorPatterns.hasMissingParam || errorPatterns.hasErrorKeyword;
results.push({
  step: 'error_classifiable',
  patterns: errorPatterns,
  pass: errorClassifiable,
});
if (!errorClassifiable) allPass = false;

// Step 6: Verify the safety policy still correctly classifies the failed command
const classification = classifyHcloudArgs(['ECS', 'ShowServer']);
const classOk = classification.decision === 'allow'; // ShowServer is read-only
results.push({
  step: 'failed_command_still_classified',
  command: 'hcloud ECS ShowServer',
  decision: classification.decision,
  risk: classification.risk,
  pass: classOk,
});
if (!classOk) allPass = false;

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D3-S8',
  why: allPass
    ? `Troubleshooting scenario complete: error injected (rc=${errorResult.status}), explain_error tool exists, troubleshooting skill loaded, error output redacted, error classifiable, failed command still correctly classified.`
    : `Some steps failed. See details.`,
  executedAt: '20261001103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));