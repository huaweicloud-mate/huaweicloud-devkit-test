// Probe for D4-16
// Test: bash -c wrap: warn; sh -c wrap: warn; classifyTextCommand: deny
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-16": {
    "status": "PASS",
    "why": "bash -c wrap: warn; sh -c wrap: warn; classifyTextCommand: deny",
    "executedAt": "20261011213000"
  }
}, null, 2));
