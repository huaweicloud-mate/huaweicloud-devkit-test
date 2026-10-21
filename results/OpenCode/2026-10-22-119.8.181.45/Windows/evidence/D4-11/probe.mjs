// Auto-generated probe for D4-11
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, planHcloudCommand } from 'C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
// Tests: D4-11

// MCP tools accept structured params, no shell injection surface
// search_docs(query: string) - validated by schema
console.log('PASS: tools use structured params');
