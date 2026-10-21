// Auto-generated probe for D4-23
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-23

const fs = require('fs');
const p = 'C:/Users/Administrator/devkit-test/OpenCode/hdk/rules/huawei-agent-rules.mdc';
console.log('exists:', fs.existsSync(p), 'length:', fs.existsSync(p) ? fs.readFileSync(p,'utf-8').length : 0);
