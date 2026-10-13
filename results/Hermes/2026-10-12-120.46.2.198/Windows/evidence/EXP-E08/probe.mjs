// Probe for EXP-E08
// Source: eval/harness/run-eval.mjs (D10-3 routing eval harness)
// Verdict: N/A
// Expected: (诊断)
// Actual: Run hcloud --help to list available services.
console.log(JSON.stringify({
  "EXP-E08": {
    "status": "NOT_RUN",
    "why": "Diagnostic case (explain_error), not a routing test. Expected: (\u8bca\u65ad), Actual: Run hcloud --help to list available services.",
    "verdict": "N/A",
    "executedAt": "20261011213513"
  }
}, null, 2));
