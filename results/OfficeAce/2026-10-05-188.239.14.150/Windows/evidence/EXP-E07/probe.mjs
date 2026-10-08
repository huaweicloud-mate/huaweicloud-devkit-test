// EXP-E07 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "给生产环境的服务器配置一个每日备份策略"
// 期望路由: ["CBR"]   实际返回: ["ECS", "IAM", "CBR"]
const result = {
  caseId: 'EXP-E07',
  intent: "给生产环境的服务器配置一个每日备份策略",
  expect: ["CBR"],
  got: ["ECS", "IAM", "CBR"],
};
console.log(JSON.stringify(result, null, 2));
