// Auto-generated probe for D4-1
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-1

// cat credentials.json should be denied
const r = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
console.log(JSON.stringify(r, null, 2));
