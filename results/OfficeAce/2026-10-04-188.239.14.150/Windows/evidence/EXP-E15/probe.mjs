// EXP-E15 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "帮我领一下华为云的代金券"
// 期望路由: ["Incentive Voucher"]   实际返回: ["Incentive Voucher"]
const result = {
  caseId: 'EXP-E15',
  intent: "帮我领一下华为云的代金券",
  expect: ["Incentive Voucher"],
  got: ["Incentive Voucher"],
};
console.log(JSON.stringify(result, null, 2));
