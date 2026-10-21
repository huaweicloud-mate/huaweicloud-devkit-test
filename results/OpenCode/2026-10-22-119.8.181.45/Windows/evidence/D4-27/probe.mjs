// Auto-generated probe for D4-27
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-27

const r = redactSecrets({access_key:'AKIDxxx',secret_key:'SKxxx',password:'Secret123'});
console.log(JSON.stringify(r));
