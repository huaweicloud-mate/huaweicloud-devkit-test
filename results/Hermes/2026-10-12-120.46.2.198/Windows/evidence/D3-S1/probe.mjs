// Probe for D3-S1
// Source: probe-p1-batch1.mjs / probe-p1-batch2.mjs / probe-p1-fixes2.mjs
// Status: FAIL
console.log(JSON.stringify({
  "D3-S1": {
    "status": "FAIL",
    "why": "serviceCatalog(\u67e5\u4e91\u4e3b\u673a): routed to 'Run hcloud --help' fallback instead of ECS. Chinese intent '\u4e91\u4e3b\u673a' not in ECS keyword list. Root cause: tools.mjs:1818 serviceCatalog keywords=['ecs','server','vm','instance','compute','flavor','image'] - no Chinese keywords for ECS.",
    "executedAt": "20261011213400"
  }
}, null, 2));
