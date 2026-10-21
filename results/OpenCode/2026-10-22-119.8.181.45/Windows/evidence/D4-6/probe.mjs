// Auto-generated probe for D4-6
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-6

const r = classifyTextCommand('hcloud ECS CreateServers --adminPass Test123456!');
console.log(JSON.stringify(r));
