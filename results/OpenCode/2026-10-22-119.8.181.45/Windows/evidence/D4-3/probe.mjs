// Auto-generated probe for D4-3
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-3

const r = classifyTextCommand('hcloud ECS CreateServers --adminPass MyPassword123 --access-key AKIDxxx --secret-key SKxxx');
console.log(JSON.stringify(r));
