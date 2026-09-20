// AI生成
/**
 * D4-22: hook_check_deploy_plan 具名回归
 * 
 * 目标: 通过源码直调 evaluateDeployPlan()，验证高危 deploy plan (公网暴露 FunctionGraph) 被告警/拦截 (warn/deny)。
 * 
 * 测试步骤:
 *   ① 构造高危 deploy plan (FunctionGraph + APIG trigger + auth=NONE + public)
 *   ② 直调 evaluateDeployPlan() (来自 risk-rule-engine.mjs)
 *   ③ 核对 decision === 'warn' 或 'deny'，且命中 hwc-functiongraph-public-no-auth 规则
 * 
 * 源码路径: C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\risk-rule-engine.mjs
 */

import { evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

// ── ① 构造高危 deploy plan ──
const deployPlan = {
  service: "FunctionGraph",
  operation: "CreateFunction",
  functionName: "preview-api-handler",
  runtime: "Python3.9",
  trigger: {
    type: "APIG",
    gateway: "DEDICATEDGATEWAY",
    auth: "NONE",
    path: "/api/preview",
    public_access: true
  },
  description: "Publicly exposed FunctionGraph via API Gateway with no authentication"
};

console.log("=== D4-22: hook_check_deploy_plan 具名回归 ===\n");
console.log("[1] 构造高危 deploy plan (公网暴露 FunctionGraph, auth=NONE):");
console.log(JSON.stringify(deployPlan, null, 2));
console.log("");

// ── ② 直调 evaluateDeployPlan ──
console.log("[2] 直调 evaluateDeployPlan(plan) ...\n");
const result = evaluateDeployPlan(deployPlan);

console.log("[3] 原始返回 (evaluateDeployPlan):");
console.log(JSON.stringify(result, null, 2));
console.log("");

// ── ③ 核对 warn/deny ──
const expectedRule = "hwc-functiongraph-public-no-auth";
const matchedRule = result.findings.find(f => f.ruleId === expectedRule);
const decisionOk = result.decision === 'warn' || result.decision === 'deny';
const ruleOk = matchedRule !== undefined;
const severityOk = matchedRule && (matchedRule.severity === 'warn' || matchedRule.severity === 'deny');

console.log("[4] 核对结果:");
console.log(`  decision in ['warn','deny']   : ${decisionOk ? 'PASS' : 'FAIL'}  (actual: ${result.decision})`);
console.log(`  命中 ${expectedRule}  : ${ruleOk ? 'PASS' : 'FAIL'}`);
console.log(`  severity in ['warn','deny']   : ${severityOk ? 'PASS' : 'FAIL'}  (actual: ${matchedRule?.severity})`);
console.log(`  findings count               : ${result.findings.length}`);
console.log("");

// 列出所有命中规则
console.log("[5] 所有命中规则:");
for (const f of result.findings) {
  console.log(`  - ${f.ruleId} [${f.severity}] ${f.title}`);
}
console.log("");

// hookResult 等价封装 (与 tools.mjs hookResult 逻辑一致)
const hookResult = {
  ok: result.decision !== 'deny',
  decision: result.decision,
  findings: result.findings,
  nextStep: result.decision === 'deny'
    ? 'Revise the command, artifact, or deployment plan before execution.'
    : result.decision === 'warn'
      ? 'Review the warnings with the user before proceeding.'
      : 'No Huawei Cloud hook risk rule matched.',
};

console.log("[6] hookResult 等价封装 (tools.mjs hookResult 逻辑):");
console.log(JSON.stringify(hookResult, null, 2));
console.log("");

const overallPass = decisionOk && ruleOk && severityOk;
console.log(`[7] 总判定: ${overallPass ? 'PASS' : 'FAIL'}`);
console.log(`    公网暴露 FunctionGraph 被拦截/告警: ${overallPass ? '是' : '否'} (${result.decision})`);

process.exit(overallPass ? 0 : 1);
