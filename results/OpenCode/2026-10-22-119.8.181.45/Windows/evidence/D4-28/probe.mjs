// Auto-generated probe for D4-28
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-28

const c = classifyTextCommand('hcloud ECS CreateServers --adminPass Secret123 --access-key AKIDxxx');
const r = evaluateCommandRisk('hcloud ECS CreateServers --adminPass Secret123');
const m = mergeRiskDecision(c, r);
console.log(JSON.stringify({classify:c.decision, risk:r?.decision, merged:m.decision}));
