// Auto-generated probe for D4-7
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-7

const cmd = evaluateCommandRisk('hcloud ECS DeleteServers --instance-ids i-123');
const art = evaluateArtifacts([{path:'terraform.tf',content:'admin_pass=Secret123'}]);
const plan = evaluateDeployPlan({action:'delete',resource:'VPC'});
console.log(JSON.stringify({cmd,art,plan}));
