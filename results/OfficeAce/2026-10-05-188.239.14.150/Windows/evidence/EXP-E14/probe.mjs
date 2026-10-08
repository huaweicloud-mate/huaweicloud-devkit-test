// EXP-E14 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "我账号下的用户都有哪些权限 帮我审计一下"
// 期望路由: ["IAM"]   实际返回: ["IAM", "CTS"]
const result = {
  caseId: 'EXP-E14',
  intent: "我账号下的用户都有哪些权限 帮我审计一下",
  expect: ["IAM"],
  got: ["IAM", "CTS"],
};
console.log(JSON.stringify(result, null, 2));
