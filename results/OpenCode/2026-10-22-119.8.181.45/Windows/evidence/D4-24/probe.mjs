// Auto-generated probe for D4-24
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-24

const t = createApprovalToken(['ECS','CreateServers']);
const c1 = consumeApprovalToken(t);
const c2 = consumeApprovalToken(t);
console.log('first:', !!c1, 'second:', !!c2);
