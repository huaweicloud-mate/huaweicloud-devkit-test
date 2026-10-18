// Probe for D4-22
// Source: probe-d4-batch.mjs (shared batch probe)
// Assertion: 公网暴露 FunctionGraph (APIG auth:NONE public:true) 被 warn/deny
// Result: PASS
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, createApprovalToken, consumeApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

// See probe-d4-batch.mjs in hdk root for full implementation
