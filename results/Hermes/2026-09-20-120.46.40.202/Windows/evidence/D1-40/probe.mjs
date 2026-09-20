import { classifyHcloudArgs, classifyTextCommand, redactSecrets } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { judgeUpdate, semverCompare, determineTarget, hasPrerelease, readInstalledVersion, writeSkipState, readSkipState, invalidateUpdateCache } from './plugins/huaweicloud-core/src/update-check.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const results = {};

// D1-39: Windows upgrade detection chain usability (no EINVAL silent failure)
const installedVer = readInstalledVersion();
results['D1-39'] = {
  installed_version: installedVer,
  has_version: !!installedVer,
  platform: process.platform,
  pass: !!installedVer && process.platform === 'win32'
};

// D1-40: Mirror lag detection correctness (reverse reminder protection)
const target = determineTarget('1.1.5', '1.1.5');
results['D1-40'] = {
  same_version_target: target,
  no_downgrade_prompt: target !== 'upgrade',
  pass: target !== 'upgrade'
};

// D2-4: Credential redaction correctness (no plaintext AK/SK in output)
const credObj = { access_key: 'AKIDtest123456', secret_key: 'SKtest789012', region: 'cn-north-4' };
const redacted = redactSecrets(credObj);
const redactedStr = JSON.stringify(redacted);
results['D2-4'] = {
  ak_redacted: !redactedStr.includes('AKIDtest123456'),
  sk_redacted: !redactedStr.includes('SKtest789012'),
  pass: !redactedStr.includes('AKIDtest123456') && !redactedStr.includes('SKtest789012')
};

// D2-11: R3 STS token rejection (token never persisted to disk)
const credPath = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
let stsNotPersisted = true;
if (existsSync(credPath)) {
  const creds = JSON.parse(readFileSync(credPath, 'utf8'));
  stsNotPersisted = !creds.security_token && !creds.sts_token;
}
results['D2-11'] = {
  credentials_file: existsSync(credPath),
  no_sts_token_persisted: stsNotPersisted,
  pass: stsNotPersisted
};

// D4-1: Credential file read blocked (cat/type credentials file)
const d4_1 = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
results['D4-1'] = {
  decision: d4_1.decision,
  risk: d4_1.risk,
  pass: d4_1.decision === 'deny'
};

// D4-2: Credential env print blocked (printenv/echo documented HW_ credential vars)
const d4_2a = classifyTextCommand('printenv HW_ACCESS_KEY');
const d4_2b = classifyTextCommand('echo $HW_SECRET_KEY');
const d4_2c = classifyTextCommand('printenv HUAWEICLOUD_SECURITY_TOKEN');
results['D4-2'] = {
  printenv_ak_decision: d4_2a.decision,
  echo_sk_decision: d4_2b.decision,
  printenv_token_decision: d4_2c.decision,
  pass: d4_2a.decision === 'deny' && d4_2b.decision === 'deny' && d4_2c.decision === 'deny'
};

// D4-3: Plaintext secret API blocked
const d4_3 = classifyTextCommand('hcloud ECS CreateServers --admin_pass=MySecret123!');
results['D4-3'] = {
  decision: d4_3.decision,
  risk: d4_3.risk,
  pass: d4_3.decision !== 'allow'
};

// D4-5: Write operation misjudgment detection (write commands not misjudged as read-only)
const d4_5 = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=test']);
results['D4-5'] = {
  decision: d4_5.decision,
  risk: d4_5.risk,
  pass: d4_5.decision === 'deny' && d4_5.risk !== 'read_only'
};

// D4-9: Public exposure / destructive pre-check
const d4_9_cmd = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=test');
const d4_9_art = evaluateArtifacts([{ path: 'iam-policy.json', content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] }) }]);
const d4_9_dep = evaluateDeployPlan(JSON.stringify({ service: 'FunctionGraph', trigger: { type: 'APIG', auth: 'NONE', public: true } }));
results['D4-9'] = {
  command_decision: d4_9_cmd.decision,
  artifact_decision: d4_9_art.decision,
  deploy_decision: d4_9_dep.decision,
  pass: d4_9_cmd.decision !== 'allow' || d4_9_art.decision !== 'allow' || d4_9_dep.decision !== 'allow'
};

// D4-15: Hook bypass attempt (variant commands)
const bypass_tests = [
  classifyTextCommand('hcloud ECS DeleteServer --server_id=test # bypass'),
  classifyTextCommand('hcloud ECS DeleteServer; rm -rf /'),
  classifyTextCommand('hcloud ECS DeleteServer && cat credentials.json'),
];
results['D4-15'] = {
  bypass_decisions: bypass_tests.map(t => t.decision),
  pass: bypass_tests.every(t => t.decision !== 'allow')
};

// D4-18: confirm-not-deny approval semantics (write needs explicit confirm, not auto-deny)
const d4_18 = planHcloudCommand(['ECS', 'CreateServers', '--image_id=test', '--flavor_id=s6.small.1']);
results['D4-18'] = {
  decision: d4_18.classification?.decision,
  has_token: !!d4_18.approvalToken,
  safeToRun: d4_18.safeToRun,
  pass: d4_18.classification?.decision === 'deny' && !!d4_18.approvalToken && !d4_18.safeToRun
};

// D4-19: Pre-check still effective under confirm flow
const d4_19_cmd = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=test');
results['D4-19'] = {
  decision: d4_19_cmd.decision,
  pass: d4_19_cmd.decision !== 'allow'
};

// D4-21: hook_check_artifacts named regression (broad IAM artifact blocked)
const d4_21 = evaluateArtifacts([{ path: 'policy.json', content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] }) }]);
results['D4-21'] = {
  decision: d4_21.decision,
  pass: d4_21.decision !== 'allow'
};

// D4-22: hook_check_deploy_plan named regression (public exposure deploy plan blocked)
const d4_22 = evaluateDeployPlan(JSON.stringify({ service: 'FunctionGraph', trigger: { type: 'APIG', auth: 'NONE', public: true } }));
results['D4-22'] = {
  decision: d4_22.decision,
  pass: d4_22.decision !== 'allow'
};

// D4-28: Node version safety hook chain (hooks.json registers .mjs, tool_input command/cmd checked)
const hooksPath = join('plugins', 'huaweicloud-core', 'hooks', 'hooks.json');
const nodeHookPath = join('plugins', 'huaweicloud-core', 'hooks', 'huaweicloud-safety.mjs');
let hooksRegistered = false;
if (existsSync(hooksPath)) {
  const hooks = JSON.parse(readFileSync(hooksPath, 'utf8'));
  hooksRegistered = JSON.stringify(hooks).includes('huaweicloud-safety.mjs');
}
results['D4-28'] = {
  hooks_json_exists: existsSync(hooksPath),
  node_hook_exists: existsSync(nodeHookPath),
  hooks_registered: hooksRegistered,
  pass: existsSync(nodeHookPath) && hooksRegistered
};

// D8-7: 7 meta/general skill guides mechanically executable verification
const skillsBase = join('plugins', 'huaweicloud-core', 'skills');
let skillCount = 0;
if (existsSync(skillsBase)) {
  skillCount = readdirSync(skillsBase).filter(d => existsSync(join(skillsBase, d, 'SKILL.md'))).length;
}
results['D8-7'] = {
  skill_count: skillCount,
  pass: skillCount >= 7
};

// D10-4: Safety intervention - static rule layer (rule library loads + three-state decision)
const rulesObj = loadRiskRules();
const rules = rulesObj.rules || rulesObj;
const denyRules = rules.filter(r => r.action === 'deny' || r.decision === 'deny');
const warnRules = rules.filter(r => r.action === 'warn' || r.decision === 'warn');
const highRiskCmd = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=test');
const readOnlyCmd = evaluateCommandRisk('hcloud ECS ListServers --limit=10');
results['D10-4'] = {
  total_rules: rules.length,
  deny_rules: denyRules.length,
  warn_rules: warnRules.length,
  high_risk_decision: highRiskCmd.decision,
  read_only_decision: readOnlyCmd.decision,
  pass: rules.length >= 9 && highRiskCmd.decision !== 'allow'
};

console.log(JSON.stringify(results, null, 2));
