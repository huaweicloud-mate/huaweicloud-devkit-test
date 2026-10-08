// EXP-E04 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "给这台服务器绑定一个弹性公网IP"
// 期望路由: ["EIP"]   实际返回: ["ECS", "VPC", "EIP"]
const result = {
  caseId: 'EXP-E04',
  intent: "给这台服务器绑定一个弹性公网IP",
  expect: ["EIP"],
  got: ["ECS", "VPC", "EIP"],
};
console.log(JSON.stringify(result, null, 2));
