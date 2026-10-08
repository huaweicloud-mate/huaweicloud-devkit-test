// EXP-E10 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "部署一个函数处理图片自动压缩"
// 期望路由: ["FunctionGraph"]   实际返回: ["FunctionGraph"]
const result = {
  caseId: 'EXP-E10',
  intent: "部署一个函数处理图片自动压缩",
  expect: ["FunctionGraph"],
  got: ["FunctionGraph"],
};
console.log(JSON.stringify(result, null, 2));
