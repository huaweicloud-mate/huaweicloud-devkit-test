// Auto-generated probe for D4-2
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-2

const r = classifyTextCommand('echo $HW_ACCESS_KEY $HW_SECRET_KEY');
console.log(JSON.stringify(r));
