// Auto-generated probe for D4-4
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-4

const r = planHcloudCommand(['ECS','CreateServers','--image-id','img-123']);
console.log(JSON.stringify(r));
