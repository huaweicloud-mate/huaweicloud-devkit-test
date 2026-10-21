// Auto-generated probe for D4-22
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-22

const plans = ['Create ECS with 0.0.0.0/0 port 22','Deploy with adminPass=Secret123','OBS Principal=* PutObject'];
plans.forEach(p => console.log(JSON.stringify(evaluateDeployPlan(p))));
