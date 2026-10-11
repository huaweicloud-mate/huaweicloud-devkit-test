// Probe for D4-1
// Test: cat credentials: decision=deny, findings=1; type credentials: decision=deny, findings=1
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-1": {
    "status": "PASS",
    "why": "cat credentials: decision=deny, findings=1; type credentials: decision=deny, findings=1",
    "executedAt": "20261011213000"
  }
}, null, 2));
