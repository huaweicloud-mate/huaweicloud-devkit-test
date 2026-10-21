// Auto-generated probe for D4-13
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-13

const fs = require('fs');
const p = require('os').homedir() + '/.config/huaweicloud/credentials.readonly.json';
console.log('exists:', fs.existsSync(p));
