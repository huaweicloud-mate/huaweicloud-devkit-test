// EXP-E02 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型"
// 期望路由: ["ECS"]   实际返回: ["ECS"]
const result = {
  caseId: 'EXP-E02',
  intent: "创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型",
  expect: ["ECS"],
  got: ["ECS"],
};
console.log(JSON.stringify(result, null, 2));
