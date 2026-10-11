// Probe for EXP-E14
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: IAM
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E14": {
    "status": "FAIL",
    "why": "Route MISS: expected=IAM, actual=Run hcloud --help to list available services., prompt=\u6211\u8d26\u53f7\u4e0b\u7684\u7528\u6237\u90fd\u6709\u54ea\u4e9b\u6743\u9650 \u5e2e\u6211\u5ba1\u8ba1\u4e00\u4e0b. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
