// Auto-generated probe for D4-19
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-19

const r = evaluateArtifacts([{path:'deploy.sh',content:'access_key=AKIDxxx\nsecret_key=SKxxx'}]);
console.log(JSON.stringify(r));
