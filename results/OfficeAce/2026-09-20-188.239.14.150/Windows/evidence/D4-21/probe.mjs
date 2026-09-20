// AI生成
/**
 * D4-21: hook_check_artifacts 具名回归
 * 
 * 目标: 通过源码直调 evaluateArtifacts()，验证宽泛 IAM policy 制品被拦截 (deny)。
 * 
 * 测试步骤:
 *   ① 构造宽泛 IAM policy JSON (Action: ["*"], Resource: ["*"], Effect: "Allow")
 *   ② 直调 evaluateArtifacts() (来自 risk-rule-engine.mjs)
 *   ③ 核对 decision === 'deny'，且命中 hwc-iam-admin-policy 规则
 * 
 * 源码路径: C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\risk-rule-engine.mjs
 */

import { evaluateArtifacts } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

// ── ① 构造宽泛 IAM policy 制品 ──
const broadIamPolicy = JSON.stringify({
  Version: "1.1",
  Statement: [
    {
      Effect: "Allow",
      Action: ["*"],
      Resource: ["*"]
    }
  ]
}, null, 2);

const artifacts = [
  {
    path: "generated/iam-broad-policy.json",
    content: broadIamPolicy
  }
];

console.log("=== D4-21: hook_check_artifacts 具名回归 ===\n");
console.log("[1] 构造宽泛 IAM policy 制品:");
console.log(broadIamPolicy);
console.log("");

// ── ② 直调 evaluateArtifacts ──
console.log("[2] 直调 evaluateArtifacts(artifacts) ...\n");
const result = evaluateArtifacts(artifacts);

console.log("[3] 原始返回 (evaluateArtifacts):");
console.log(JSON.stringify(result, null, 2));
console.log("");

// ── ③ 核对 deny ──
const expectedRule = "hwc-iam-admin-policy";
const matchedRule = result.findings.find(f => f.ruleId === expectedRule);
const decisionOk = result.decision === 'deny';
const ruleOk = matchedRule !== undefined;
const severityOk = matchedRule && matchedRule.severity === 'deny';

console.log("[4] 核对结果:");
console.log(`  decision === 'deny'          : ${decisionOk ? 'PASS' : 'FAIL'}  (actual: ${result.decision})`);
console.log(`  命中 ${expectedRule}  : ${ruleOk ? 'PASS' : 'FAIL'}`);
console.log(`  severity === 'deny'          : ${severityOk ? 'PASS' : 'FAIL'}  (actual: ${matchedRule?.severity})`);
console.log(`  findings count              : ${result.findings.length}`);
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

console.log("[5] hookResult 等价封装 (tools.mjs hookResult 逻辑):");
console.log(JSON.stringify(hookResult, null, 2));
console.log("");

const overallPass = decisionOk && ruleOk && severityOk;
console.log(`[6] 总判定: ${overallPass ? 'PASS' : 'FAIL'}`);
console.log(`    broad IAM 制品被拦截 (deny): ${overallPass ? '是' : '否'}`);

process.exit(overallPass ? 0 : 1);
