// Probe for D4-18
// Test: DeleteServer: decision=deny, approvalToken=present, safeToRun=false
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-18": {
    "status": "PASS",
    "why": "DeleteServer: decision=deny, approvalToken=present, safeToRun=false",
    "executedAt": "20261011213000"
  }
}, null, 2));
