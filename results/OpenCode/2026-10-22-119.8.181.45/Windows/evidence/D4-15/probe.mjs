// Auto-generated probe for D4-15
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-15

const cmds = ['hcl0ud ECS DeleteServers','hcloud EC S DeleteServers'];
cmds.forEach(c => console.log(c, classifyTextCommand(c).decision));
