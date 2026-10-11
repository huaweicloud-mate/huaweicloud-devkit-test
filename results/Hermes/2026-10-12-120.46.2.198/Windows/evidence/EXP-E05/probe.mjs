// Probe for EXP-E05
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: RDS
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E05": {
    "status": "FAIL",
    "why": "Route MISS: expected=RDS, actual=Run hcloud --help to list available services., prompt=\u770b\u4e00\u4e0b\u6211\u7684\u4e91\u6570\u636e\u5e93MySQL\u5b9e\u4f8b\u7684\u72b6\u6001. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
