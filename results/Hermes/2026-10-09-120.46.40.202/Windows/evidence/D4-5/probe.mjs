// Probe for D4-5
// Source: probe-d4-batch.mjs (shared batch probe)
// Assertion: 写操作(DeleteServer/DeleteVpc/DeleteBucket)不被误判为只读
// Result: PASS
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, createApprovalToken, consumeApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

// See probe-d4-batch.mjs in hdk root for full implementation
