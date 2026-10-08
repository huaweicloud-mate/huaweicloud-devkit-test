// EXP-E09 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "开设一个 Kubernetes 集群用于微服务部署"
// 期望路由: ["CCE"]   实际返回: ["CCE", "SWR"]
const result = {
  caseId: 'EXP-E09',
  intent: "开设一个 Kubernetes 集群用于微服务部署",
  expect: ["CCE"],
  got: ["CCE", "SWR"],
};
console.log(JSON.stringify(result, null, 2));
