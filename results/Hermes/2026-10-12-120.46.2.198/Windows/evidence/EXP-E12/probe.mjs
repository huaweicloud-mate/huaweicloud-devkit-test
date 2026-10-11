// Probe for EXP-E12
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: CES
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E12": {
    "status": "FAIL",
    "why": "Route MISS: expected=CES, actual=Run hcloud --help to list available services., prompt=\u628a\u5e94\u7528\u65e5\u5fd7\u6307\u6807\u63a8\u9001\u5230\u4e91\u76d1\u63a7\u544a\u8b66. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
