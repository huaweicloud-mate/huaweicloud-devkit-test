// Probe for EXP-E03
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: OBS
// Actual: Sandbox+DevStation
console.log(JSON.stringify({
  "EXP-E03": {
    "status": "FAIL",
    "why": "Route MISS: expected=OBS, actual=Sandbox+DevStation, prompt=\u628a\u672c\u5730 dist \u76ee\u5f55\u90e8\u7f72\u6210\u4e00\u4e2a\u516c\u7f51\u9759\u6001\u7f51\u7ad9. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
