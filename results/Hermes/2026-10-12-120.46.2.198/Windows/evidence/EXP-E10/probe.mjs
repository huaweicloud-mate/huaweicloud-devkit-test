// Probe for EXP-E10
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: FunctionGraph
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E10": {
    "status": "FAIL",
    "why": "Route MISS: expected=FunctionGraph, actual=Run hcloud --help to list available services., prompt=\u90e8\u7f72\u4e00\u4e2a\u51fd\u6570\u5904\u7406\u56fe\u7247\u81ea\u52a8\u538b\u7f29. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
