// EXP-E01 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "帮我查一下我账号在华北北京四有哪些云主机"
// 期望路由: ["ECS"]   实际返回: ["Run hcloud --help to list available services."]
const result = {
  caseId: 'EXP-E01',
  intent: "帮我查一下我账号在华北北京四有哪些云主机",
  expect: ["ECS"],
  got: ["Run hcloud --help to list available services."],
};
console.log(JSON.stringify(result, null, 2));
