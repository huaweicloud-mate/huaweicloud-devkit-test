// EXP-E03 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "把本地 dist 目录部署成一个公网静态网站"
// 期望路由: ["OBS"]   实际返回: ["OBS", "Sandbox", "DevStation"]
const result = {
  caseId: 'EXP-E03',
  intent: "把本地 dist 目录部署成一个公网静态网站",
  expect: ["OBS"],
  got: ["OBS", "Sandbox", "DevStation"],
};
console.log(JSON.stringify(result, null, 2));
