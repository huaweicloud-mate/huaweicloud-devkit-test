// AI生成
// D4-21: hook_check_artifacts 具名回归
// D4-22: hook_check_deploy_plan 具名回归
// D4-23: 全局规则 huawei-agent-rules.md 注入生效性

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src';
const toolsContent = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');

console.log('=== D4-21: hook_check_artifacts Named Regression ===');

// Check 1: Tool is registered with correct name
const hasToolName = toolsContent.includes("name: 'huaweicloud_hook_check_artifacts'");
console.log('Check 1 - Tool registered:', hasToolName);

// Check 2: Tool has correct input schema (artifacts array with path+content)
const hasSchema = toolsContent.includes("required: ['artifacts']") &&
                  toolsContent.includes("required: ['path', 'content']");
console.log('Check 2 - Schema requires artifacts with path+content:', hasSchema);

// Check 3: Tool dispatches to evaluateArtifacts
const hasDispatch = toolsContent.includes("case 'huaweicloud_hook_check_artifacts'") &&
                    toolsContent.includes("evaluateArtifacts(args.artifacts");
console.log('Check 3 - Dispatches to evaluateArtifacts:', hasDispatch);

// Check 4: Functional test - artifact with public exposure is denied
const artifactResult = evaluateArtifacts([{
  path: 'main.tf',
  content: 'remote_ip_prefix = "0.0.0.0/0" port_range_max = 22'
}]);
const functionalTest = artifactResult.decision === 'deny';
console.log('Check 4 - Functional test (0.0.0.0/0:22 denied):', functionalTest);

// Check 5: Clean artifact is allowed
const cleanResult = evaluateArtifacts([{
  path: 'main.tf',
  content: 'resource "huaweicloud_vpc" "main" { cidr = "192.168.0.0/16" }'
}]);
const cleanAllowed = cleanResult.decision === 'allow';
console.log('Check 5 - Clean artifact allowed:', cleanAllowed);

const d4_21_pass = hasToolName && hasSchema && hasDispatch && functionalTest && cleanAllowed;
console.log('D4-21 RESULT:', d4_21_pass ? 'PASS' : 'FAIL');

console.log('\n=== D4-22: hook_check_deploy_plan Named Regression ===');

// Check 1: Tool is registered
const hasDeployToolName = toolsContent.includes("name: 'huaweicloud_hook_check_deploy_plan'");
console.log('Check 1 - Tool registered:', hasDeployToolName);

// Check 2: Tool requires plan parameter
const hasPlanSchema = toolsContent.includes("required: ['plan']");
console.log('Check 2 - Schema requires plan:', hasPlanSchema);

// Check 3: Tool dispatches to evaluateDeployPlan
const hasDeployDispatch = toolsContent.includes("case 'huaweicloud_hook_check_deploy_plan'") &&
                          toolsContent.includes("evaluateDeployPlan(args.plan");
console.log('Check 3 - Dispatches to evaluateDeployPlan:', hasDeployDispatch);

// Check 4: Functional test - IAM admin policy denied
const deployResult = evaluateDeployPlan('{"Statement": [{"Action": "*", "Effect": "Allow"}]}');
const deployFunctional = deployResult.decision === 'deny';
console.log('Check 4 - Functional test (IAM admin denied):', deployFunctional);

// Check 5: Clean deploy plan allowed
const cleanDeploy = evaluateDeployPlan('Deploy ECS instance in cn-north-4 with security group');
const cleanDeployAllowed = cleanDeploy.decision === 'allow' || cleanDeploy.decision === 'warn';
console.log('Check 5 - Clean deploy plan allowed/warned:', cleanDeployAllowed);

const d4_22_pass = hasDeployToolName && hasPlanSchema && hasDeployDispatch && deployFunctional && cleanDeployAllowed;
console.log('D4-22 RESULT:', d4_22_pass ? 'PASS' : 'FAIL');

console.log('\n=== D4-23: Global Rules Injection ===');

const rulesPath = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\rules\\huawei-agent-rules.mdc';
const rulesExist = existsSync(rulesPath);
console.log('Check 1 - Rules file exists:', rulesExist);

if (rulesExist) {
  const rulesContent = readFileSync(rulesPath, 'utf8');
  
  // Check 2: Contains secret safety rules
  const hasSecretSafety = rulesContent.includes('Secret Safety') && 
                          rulesContent.includes('MUST NOT') &&
                          rulesContent.includes('AK/SK');
  console.log('Check 2 - Secret safety rules present:', hasSecretSafety);
  
  // Check 3: Contains IAM security rules
  const hasIamSecurity = rulesContent.includes('IAM Security') &&
                         rulesContent.includes('Least privilege');
  console.log('Check 3 - IAM security rules present:', hasIamSecurity);
  
  // Check 4: Contains network security rules
  const hasNetworkSecurity = rulesContent.includes('Network Security') &&
                             rulesContent.includes('public access');
  console.log('Check 4 - Network security rules present:', hasNetworkSecurity);
  
  // Check 5: Contains red flags / stop conditions
  const hasRedFlags = rulesContent.includes('Red Flags') &&
                      rulesContent.includes('STOP');
  console.log('Check 5 - Red flags present:', hasRedFlags);
  
  // Check 6: Contains MCP usage rules
  const hasMcpRules = rulesContent.includes('MCP Usage Rules') &&
                      rulesContent.includes('huaweicloud_run_approved_command');
  console.log('Check 6 - MCP usage rules present:', hasMcpRules);
  
  const d4_23_pass = rulesExist && hasSecretSafety && hasIamSecurity && hasNetworkSecurity && hasRedFlags && hasMcpRules;
  console.log('D4-23 RESULT:', d4_23_pass ? 'PASS' : 'FAIL');
} else {
  console.log('D4-23 RESULT: FAIL (rules file not found)');
}
