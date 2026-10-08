// EXP-E05 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "看一下我的云数据库MySQL实例的状态"
// 期望路由: ["RDS"]   实际返回: ["RDS"]
const result = {
  caseId: 'EXP-E05',
  intent: "看一下我的云数据库MySQL实例的状态",
  expect: ["RDS"],
  got: ["RDS"],
};
console.log(JSON.stringify(result, null, 2));
