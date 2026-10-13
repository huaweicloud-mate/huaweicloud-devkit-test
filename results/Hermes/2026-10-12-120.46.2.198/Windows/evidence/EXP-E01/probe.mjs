// Probe for EXP-E01
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: ECS
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E01": {
    "status": "FAIL",
    "why": "Route MISS: expected=ECS, actual=Run hcloud --help to list available services., prompt=\u5e2e\u6211\u67e5\u4e00\u4e0b\u6211\u8d26\u53f7\u5728\u534e\u5317\u5317\u4eac\u56db\u6709\u54ea\u4e9b\u4e91\u4e3b\u673a. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
