// EXP-E08 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "我的ECS启动失败了, 帮我分析原因"
// 期望路由: null   实际返回: ["Run hcloud --help to list available services."]
const result = {
  caseId: 'EXP-E08',
  intent: "我的ECS启动失败了, 帮我分析原因",
  expect: null,
  got: ["Run hcloud --help to list available services."],
};
console.log(JSON.stringify(result, null, 2));
