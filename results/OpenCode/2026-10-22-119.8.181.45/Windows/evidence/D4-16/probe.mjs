// Auto-generated probe for D4-16
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-16

const cmds = ['bash -c \"hcloud ECS DeleteServers\"','sh -c \"hcloud VPC DeleteVpc\"','cmd /c \"hcloud ECS DeleteServers\"','powershell -Command \"hcloud VPC DeleteVpc\"','sudo hcloud ECS DeleteServers'];
cmds.forEach(c => console.log(c, '=>', classifyTextCommand(c).decision));
