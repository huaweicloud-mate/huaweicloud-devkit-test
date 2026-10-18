// Probe for D4-15
// Source: probe-d4-batch.mjs (shared batch probe)
// Assertion: 大小写变体/URL编码/参数拆分等绕过尝试均被拦截
// Result: PASS
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, createApprovalToken, consumeApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

// See probe-d4-batch.mjs in hdk root for full implementation
