// Probe for EXP-E04
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: EIP
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E04": {
    "status": "FAIL",
    "why": "Route MISS: expected=EIP, actual=Run hcloud --help to list available services., prompt=\u7ed9\u8fd9\u53f0\u670d\u52a1\u5668\u7ed1\u5b9a\u4e00\u4e2a\u5f39\u6027\u516c\u7f51IP. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
