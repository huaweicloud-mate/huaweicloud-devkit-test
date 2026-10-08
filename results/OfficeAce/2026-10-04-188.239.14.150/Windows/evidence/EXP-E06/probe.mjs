// EXP-E06 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "创建一个 Redis 缓存实例用于会话存储"
// 期望路由: ["DCS"]   实际返回: ["OBS", "DDS", "DCS"]
const result = {
  caseId: 'EXP-E06',
  intent: "创建一个 Redis 缓存实例用于会话存储",
  expect: ["DCS"],
  got: ["OBS", "DDS", "DCS"],
};
console.log(JSON.stringify(result, null, 2));
