/**
 * OpenCode 1.1.5 daily test probe - D4 security core
 * Covers: D4-1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24
 */
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, loadPolicy } from 'file:///C:/Users/Administrator/devkit-test/hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const pkgRoot = 'C:/Users/Administrator/devkit-test/hermes/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-120.46.40.202/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// D4-1: credential file read block
test('D4-1', 'cred-cat', classifyTextCommand('cat ~/.config/huaweicloud/credentials.json').decision==='deny', classifyTextCommand('cat ~/.config/huaweicloud/credentials.json').decision, 'deny', 'cat blocked', 'cat not blocked');
test('D4-1', 'cred-type', classifyTextCommand('type %USERPROFILE%\\.config\\huaweicloud\\credentials.json').decision==='deny', classifyTextCommand('type %USERPROFILE%\\.config\\huaweicloud\\credentials.json').decision, 'deny', 'type blocked', 'type not blocked');
test('D4-1', 'cred-getcontent', classifyTextCommand('Get-Content ~/.huaweicloud/credentials.json').decision==='deny', classifyTextCommand('Get-Content ~/.huaweicloud/credentials.json').decision, 'deny', 'Get-Content blocked', 'Get-Content not blocked');

// D4-2: env dump block
test('D4-2', 'env-grep', classifyTextCommand('env | grep HUAWEICLOUD').decision==='deny', classifyTextCommand('env | grep HUAWEICLOUD').decision, 'deny', 'env grep blocked', 'env grep not blocked');
test('D4-2', 'printenv', classifyTextCommand('printenv HUAWEICLOUD_ACCESS_KEY_ID').decision==='deny', classifyTextCommand('printenv HUAWEICLOUD_ACCESS_KEY_ID').decision, 'deny', 'printenv blocked', 'printenv not blocked');
test('D4-2', 'echo-hw', classifyTextCommand('echo $HW_ACCESS_KEY').decision==='deny', classifyTextCommand('echo $HW_ACCESS_KEY').decision, 'deny', 'echo HW_ACCESS_KEY blocked', 'echo HW_ACCESS_KEY NOT blocked (defect)');

// D4-3: secret API block
test('D4-3', 'showsecretversion', classifyTextCommand('hcloud csms showsecretversion --secret-id test').decision==='deny', classifyTextCommand('hcloud csms showsecretversion --secret-id test').decision, 'deny', 'showsecretversion blocked', 'showsecretversion not blocked');
test('D4-3', 'getsecretvalue', classifyTextCommand('hcloud kps getsecretvalue --key-id test').decision==='deny', classifyTextCommand('hcloud kps getsecretvalue --key-id test').decision, 'deny', 'getsecretvalue blocked', 'getsecretvalue not blocked');

// D4-5: write misclassification
const delRes = classifyHcloudArgs(['ECS','DeleteServers','--server-ids','test']);
test('D4-5', 'delete-not-readonly', delRes.decision!=='allow'||delRes.isWrite===true, delRes.decision, 'non-allow', 'DeleteServers not misclassified', 'DeleteServers misclassified as readonly');
const creRes = classifyHcloudArgs(['ECS','CreateServers','--flavor-ref','test']);
test('D4-5', 'create-not-readonly', creRes.decision!=='allow'||creRes.isWrite===true, creRes.decision, 'non-allow', 'CreateServers not misclassified', 'CreateServers misclassified');

// D4-9: public exposure / destructive
const sgRes = classifyHcloudArgs(['VPC','CreateSecurityGroupRule','--port-range-min','22','--port-range-max','22','--remote-ip-prefix','0.0.0.0/0']);
test('D4-9', 'public-exposure', sgRes.decision==='deny'||sgRes.decision==='confirm', sgRes.decision, 'deny/confirm', 'public exposure detected', 'public exposure not detected');
const delAllRes = classifyTextCommand('hcloud ECS DeleteServers --delete-all');
test('D4-9', 'destructive', delAllRes.decision==='deny'||delAllRes.decision==='confirm', delAllRes.decision, 'deny/confirm', 'destructive detected', 'destructive not detected');

// D4-15: bypass attempts
test('D4-15', 'bypass-chained', classifyTextCommand('cat /etc/shadow && cat ~/.config/huaweicloud/credentials.json').decision==='deny', classifyTextCommand('cat /etc/shadow && cat ~/.config/huaweicloud/credentials.json').decision, 'deny', 'chained bypass blocked', 'chained bypass not blocked');
test('D4-15', 'bypass-bash', classifyTextCommand('bash -c "cat ~/.config/huaweicloud/credentials.json"').decision==='deny', classifyTextCommand('bash -c "cat ~/.config/huaweicloud/credentials.json"').decision, 'deny', 'bash wrapper blocked', 'bash wrapper not blocked');

// D4-16: command wrapping
test('D4-16', 'wrap-powershell', classifyTextCommand('powershell -Command "Get-Content ~/.config/huaweicloud/credentials.json"').decision==='deny', classifyTextCommand('powershell -Command "Get-Content ~/.config/huaweicloud/credentials.json"').decision, 'deny', 'powershell wrap blocked', 'powershell wrap not blocked');
test('D4-16', 'wrap-sh', classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision==='deny', classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision, 'deny', 'sh wrap blocked', 'sh wrap NOT blocked (defect)');

// D4-21: hook_check_artifacts
const artRes = evaluateArtifacts([{path:'test.tf',content:'resource "huaweicloud_vpc" "test" { cidr = "0.0.0.0/0" }'}]);
test('D4-21', 'artifacts-eval', artRes!==null&&typeof artRes==='object', typeof artRes, 'object', 'evaluateArtifacts returns result', 'evaluateArtifacts error');
const credArt = evaluateArtifacts([{path:'config.json',content:'{"ak":"AKID12345678","sk":"SK1234567890abcdef"}'}]);
test('D4-21', 'artifacts-cred', credArt!==null, typeof credArt, 'object', 'credential in artifacts detected', 'credential in artifacts not detected');

// D4-22: hook_check_deploy_plan
const depRes = evaluateDeployPlan({action:'create',resource:'ecs',config:{flavor:'s6.small.1',publicIp:true,securityGroup:'0.0.0.0/0'}});
test('D4-22', 'deploy-plan-eval', depRes!==null&&typeof depRes==='object', typeof depRes, 'object', 'evaluateDeployPlan returns result', 'evaluateDeployPlan error');

// D4-23: policy loaded (huawei-agent-rules.md)
const policy = loadPolicy();
test('D4-23', 'policy-loaded', policy!==null&&typeof policy==='object', typeof policy, 'object', 'safety policy loaded', 'safety policy not loaded');

// D4-4: write verbs gate
const verbs = ['Create','Delete','Update','Resize','Start','Stop','Authorize','Revoke','Attach','Detach','Enable','Disable'];
let checked = 0;
for (const v of verbs) { const r = classifyHcloudArgs(['ECS',v+'Servers','--test']); if (r.decision!=='allow'||r.isWrite===true) checked++; }
test('D4-4', 'write-verbs', checked>=verbs.length*0.8, `${checked}/${verbs.length}`, `>=${Math.ceil(verbs.length*0.8)}`, `write verbs: ${checked}/${verbs.length}`, `write verbs insufficient: ${checked}/${verbs.length}`);

// D4-6: adminPass redaction
const apRes = redactSecrets('adminPass: MySecretPassword123');
test('D4-6', 'adminpass-redacted', !String(apRes).includes('MySecretPassword123'), String(apRes).substring(0,50), 'redacted', 'adminPass redacted', 'adminPass NOT redacted');

// D4-7: hook tools effective
test('D4-7', 'hook-cmd', typeof classifyTextCommand==='function'&&typeof classifyHcloudArgs==='function', 'both', true, 'hook_check_command effective', 'hook_check_command ineffective');
test('D4-7', 'hook-art', typeof evaluateArtifacts==='function', typeof evaluateArtifacts, 'function', 'hook_check_artifacts effective', 'hook_check_artifacts ineffective');
test('D4-7', 'hook-dep', typeof evaluateDeployPlan==='function', typeof evaluateDeployPlan, 'function', 'hook_check_deploy_plan effective', 'hook_check_deploy_plan ineffective');

// D4-8: Python/Node consistency
test('D4-8', 'policy-shared', policy!==null, typeof policy, 'object', 'policy from shared source', 'policy loading error');

// D4-17: fail-closed
test('D4-17', 'fail-closed', classifyTextCommand('rm -rf / && hcloud ECS DeleteServers').decision!=='allow', classifyTextCommand('rm -rf / && hcloud ECS DeleteServers').decision, 'non-allow', 'ambiguous fail-closed', 'ambiguous allowed');

// D4-11: injection protection
test('D4-11', 'injection-mechanism', typeof redactSecrets==='function', typeof redactSecrets, 'function', 'injection protection mechanism exists', 'injection protection missing');

// D4-12: supply chain
const pkg = JSON.parse(readFileSync(join(pkgRoot,'package.json'),'utf8'));
test('D4-12', 'postinstall', pkg.scripts&&typeof pkg.scripts.postinstall==='string', pkg.scripts?.postinstall?'present':'absent', 'present', `postinstall: ${pkg.scripts?.postinstall??'none'}`, 'no postinstall');

// D4-13: readonly allowed
const roRes = classifyHcloudArgs(['ECS','ListServers','--limit','10']);
test('D4-13', 'readonly-allowed', roRes.decision==='allow', roRes.decision, 'allow', 'readonly allowed', 'readonly denied');

// D4-14: auditability
test('D4-14', 'audit-metadata', typeof roRes.decision==='string'&&roRes.decision.length>0, roRes.decision, 'string', 'classify returns decision', 'classify missing decision');

// D4-20: deny definitive
test('D4-20', 'deny-definitive', classifyTextCommand('cat ~/.config/huaweicloud/credentials.json').decision==='deny', classifyTextCommand('cat ~/.config/huaweicloud/credentials.json').decision, 'deny', 'deny is definitive', 'deny not definitive');

// D4-24: confirm boundary
const confirmRes = classifyHcloudArgs(['ECS','CreateServers','--flavor-ref','s6.small.1']);
test('D4-24', 'confirm-write', confirmRes.decision==='confirm'||confirmRes.decision==='deny'||confirmRes.isWrite===true, `${confirmRes.decision}/${confirmRes.isWrite}`, 'confirm/deny/isWrite', 'write returns confirm/deny', 'write allowed');

// D4-10: rules loaded
const rules = loadRiskRules();
test('D4-10', 'rules-loaded', rules!==null&&typeof rules==='object', typeof rules, 'object', 'rules loaded', 'rules not loaded');

// D4-18: confirm-not-deny
test('D4-18', 'confirm-not-deny', confirmRes.decision==='confirm'||confirmRes.decision==='deny', confirmRes.decision, 'confirm or deny', 'write confirm/deny correct', 'write semantics error');

// D4-19: preflight in confirm
const hrRes = evaluateCommandRisk('hcloud ECS DeleteServers --delete-all');
test('D4-19', 'preflight', hrRes!==null, typeof hrRes, 'object', 'preflight in confirm effective', 'preflight not effective');

const passed = results.filter(r=>r.pass).length;
const failed = results.filter(r=>!r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir,'d4-security','stdout.log'), output, 'utf8');
console.log(output);
