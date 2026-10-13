// Probe for EXP-E13
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: MISS
// Expected: ELB
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E13": {
    "status": "FAIL",
    "why": "Route MISS: expected=ELB, actual=Run hcloud --help to list available services., prompt=\u7533\u8bf7HTTPS\u8bc1\u4e66\u5e76\u914d\u7f6e\u5230\u6211\u7684\u57df\u540d. Root cause: serviceCatalog keyword list missing Chinese terms for this service.",
    "verdict": "MISS",
    "executedAt": "20261011213513"
  }
}, null, 2));
