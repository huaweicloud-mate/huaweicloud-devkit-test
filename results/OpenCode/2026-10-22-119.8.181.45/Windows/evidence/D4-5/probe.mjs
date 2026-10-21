// Auto-generated probe for D4-5
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-5

const r1 = classifyHcloudArgs(['ECS','ListServers']);
const r2 = classifyHcloudArgs(['ECS','CreateServers']);
console.log(JSON.stringify({r1,r2}));
