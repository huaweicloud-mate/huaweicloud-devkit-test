// Probe for EXP-E11
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: BSS
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E11": {
    "status": "FAIL",
    "why": "Route MISS: expected=BSS, actual=Run hcloud --help to list available services., prompt=\u67e5\u4e00\u4e0b\u6211\u8d26\u53f7\u8fd9\u4e2a\u6708\u7684\u8d39\u7528\u60c5\u51b5. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
