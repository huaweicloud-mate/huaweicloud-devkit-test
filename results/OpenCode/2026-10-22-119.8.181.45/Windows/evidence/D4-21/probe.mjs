// Auto-generated probe for D4-21
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-21

const arts = [{path:'main.tf',content:'admin_pass=Secret123'},{path:'deploy.yaml',content:'access_key:AKIDxxx'},{path:'script.sh',content:'hcloud ECS DeleteServers'}];
const r = evaluateArtifacts(arts);
console.log(JSON.stringify(r));
