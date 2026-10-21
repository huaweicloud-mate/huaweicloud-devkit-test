// Auto-generated probe for D4-25
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-25

const r = loadRiskRules();
console.log([...new Set(r.rules.map(x=>x.category||x.severity))]);
