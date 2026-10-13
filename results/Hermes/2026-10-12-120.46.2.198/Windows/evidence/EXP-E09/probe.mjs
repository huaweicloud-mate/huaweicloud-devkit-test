// Probe for EXP-E09
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: HIT
// Expected: CCE
// Actual: CCE+SWR
console.log(JSON.stringify({
  "EXP-E09": {
    "status": "PASS",
    "why": "Route HIT: expected=CCE, actual=CCE+SWR, prompt=\u5f00\u8bbe\u4e00\u4e2a Kubernetes \u96c6\u7fa4\u7528\u4e8e\u5fae\u670d\u52a1\u90e8\u7f72",
    "verdict": "HIT",
    "executedAt": "20261011213513"
  }
}, null, 2));
