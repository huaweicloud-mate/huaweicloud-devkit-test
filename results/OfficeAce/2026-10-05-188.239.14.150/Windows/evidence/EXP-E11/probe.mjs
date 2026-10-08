// EXP-E11 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "查一下我账号这个月的费用情况"
// 期望路由: ["BSS"]   实际返回: ["BSS"]
const result = {
  caseId: 'EXP-E11',
  intent: "查一下我账号这个月的费用情况",
  expect: ["BSS"],
  got: ["BSS"],
};
console.log(JSON.stringify(result, null, 2));
