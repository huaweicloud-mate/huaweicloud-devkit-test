// Probe for EXP-E02
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: ECS
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E02": {
    "status": "FAIL",
    "why": "Route MISS: expected=ECS, actual=Run hcloud --help to list available services., prompt=\u521b\u5efa\u4e00\u53f0 2C4G \u7684 Ubuntu \u4e91\u670d\u52a1\u5668 \u89c4\u683c\u901a\u7528\u578b. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
