// Auto-generated probe for D4-8
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-8

const rules = loadRiskRules();
console.log('rules:', rules.rules.length);
const r = evaluateCommandRisk('hcloud VPC DeleteVpc --vpc-id vpc-xxx');
console.log(JSON.stringify(r));
