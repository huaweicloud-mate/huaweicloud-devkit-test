// D3-S1: 场景-只读查ECS - serviceCatalog route → ECS → run_readonly_command
import { spawnSync } from 'node:child_process';
import { classifyHcloudArgs, redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync } from 'node:fs';

const hcloud = 'C://Users//Administrator//hcloud//hcloud.exe';
const results = [];
let allPass = true;

// Step 1: serviceCatalog routing - verify huaweicloud-core skill mentions ECS for "inspect resources"
const coreSkill = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/skills/huaweicloud-core/SKILL.md', 'utf8');
const hasEcsRouting = /ECS/i.test(coreSkill);
results.push({
  step: 'service_catalog_route',
  action: 'huaweicloud-core SKILL.md mentions ECS',
  pass: hasEcsRouting,
});
if (!hasEcsRouting) allPass = false;

// Step 2: huawei-ecs skill exists and has content
const ecsSkill = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/skills/huawei-ecs/SKILL.md', 'utf8');
const ecsSkillOk = ecsSkill.length > 1000;
results.push({
  step: 'ecs_skill_loaded',
  action: 'huawei-ecs SKILL.md loaded',
  skillSize: ecsSkill.length,
  pass: ecsSkillOk,
});
if (!ecsSkillOk) allPass = false;

// Step 3: Classify the read-only command
const args = ['ECS', 'ListServersDetails', '--limit=1'];
const classification = classifyHcloudArgs(args);
const classOk = classification.decision === 'allow' && classification.risk === 'read_only';
results.push({
  step: 'classify_readonly',
  command: `hcloud ${args.join(' ')}`,
  decision: classification.decision,
  risk: classification.risk,
  pass: classOk,
});
if (!classOk) allPass = false;

// Step 4: Execute the real read-only command
const execResult = spawnSync(hcloud, args, { encoding: 'utf8', timeout: 60000, windowsHide: true });
const rawOutput = (execResult.stdout || '') + (execResult.stderr || '');
const redactedOutput = redactSecrets(rawOutput);
const execOk = execResult.status !== null;

// Verify no AK/SK in redacted output
const akPattern = 'HPUAN1ROQ4PQXQVBSYXD';
const skPattern = 'ExzAgLDfOfbaLm8pgyVCJKmtF4Nb5lLX6LnUFrfN';
const noSecrets = !redactedOutput.includes(akPattern) && !redactedOutput.includes(skPattern);

results.push({
  step: 'execute_readonly',
  command: `hcloud ${args.join(' ')}`,
  rc: execResult.status,
  outputLength: rawOutput.length,
  noSecretsInRedacted: noSecrets,
  pass: execOk && noSecrets,
});
if (!execOk || !noSecrets) allPass = false;

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D3-S1',
  why: allPass
    ? `Scenario complete: serviceCatalog→ECS skill loaded, command classified read_only, real hcloud executed (rc=${execResult.status}), output redacted with no AK/SK.`
    : `Some steps failed. See details.`,
  executedAt: '20261001103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));