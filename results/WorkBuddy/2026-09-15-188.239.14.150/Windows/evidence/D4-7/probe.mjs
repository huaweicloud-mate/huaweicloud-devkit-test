import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
// Test hook_check_command
const cmdRisk = evaluateCommandRisk('hcloud ECS DeleteServers --server-ids 1,2,3');
console.log('command risk:', cmdRisk?.decision || 'N/A');
// Test hook_check_artifacts
const artRisk = evaluateArtifacts([{path:'policy.json',content:'{"Statement":[{"Effect":"Allow","Action":["*"],"Resource":["*"]}]}'}]);
console.log('artifact risk:', artRisk?.decision || 'N/A');
// Test hook_check_deploy_plan
const planRisk = evaluateDeployPlan({resources:[{type:'ECS',publicIP:true}]});
console.log('deploy plan risk:', planRisk?.decision || 'N/A');
if (cmdRisk?.decision === 'deny' || artRisk?.decision !== 'allow' || planRisk?.decision !== 'allow') console.log('PASS');
else console.log('FAIL');