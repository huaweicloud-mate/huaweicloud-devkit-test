// Auto-generated probe for D4-9
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-9

const cmds = ['hcloud ECS CreateServers --public-ip','hcloud EIP CreatePublicip','hcloud VPC DeleteVpc'];
cmds.forEach(c => console.log(c, classifyTextCommand(c).decision));
