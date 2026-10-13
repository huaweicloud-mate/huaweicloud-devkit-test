// Probe for EXP-E07
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: CBR
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E07": {
    "status": "FAIL",
    "why": "Route MISS: expected=CBR, actual=Run hcloud --help to list available services., prompt=\u7ed9\u751f\u4ea7\u73af\u5883\u7684\u670d\u52a1\u5668\u914d\u7f6e\u4e00\u4e2a\u6bcf\u65e5\u5907\u4efd\u7b56\u7565. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
