// EXP-E12 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "把应用日志指标推送到云监控告警"
// 期望路由: ["CES"]   实际返回: ["CES"]
const result = {
  caseId: 'EXP-E12',
  intent: "把应用日志指标推送到云监控告警",
  expect: ["CES"],
  got: ["CES"],
};
console.log(JSON.stringify(result, null, 2));
