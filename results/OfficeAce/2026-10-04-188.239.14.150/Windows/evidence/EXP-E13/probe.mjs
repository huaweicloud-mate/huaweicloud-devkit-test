// EXP-E13 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "申请HTTPS证书并配置到我的域名"
// 期望路由: ["ELB"]   实际返回: ["CSMS", "KMS", "ELB"]
const result = {
  caseId: 'EXP-E13',
  intent: "申请HTTPS证书并配置到我的域名",
  expect: ["ELB"],
  got: ["CSMS", "KMS", "ELB"],
};
console.log(JSON.stringify(result, null, 2));
