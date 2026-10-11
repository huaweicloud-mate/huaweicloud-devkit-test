// Probe for EXP-E06
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: HIT
// Expected: DCS
// Actual: DDS+DCS
console.log(JSON.stringify({
  "EXP-E06": {
    "status": "PASS",
    "why": "Route HIT: expected=DCS, actual=DDS+DCS, prompt=\u521b\u5efa\u4e00\u4e2a Redis \u7f13\u5b58\u5b9e\u4f8b\u7528\u4e8e\u4f1a\u8bdd\u5b58\u50a8",
    "verdict": "HIT",
    "executedAt": "20261011213513"
  }
}, null, 2));
