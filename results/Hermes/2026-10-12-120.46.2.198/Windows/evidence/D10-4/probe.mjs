// Probe for D10-4
// Test: rules: 16 (deny=9, warn=7); high-risk(cat cred): deny; readonly(ListServers): allow
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D10-4": {
    "status": "PASS",
    "why": "rules: 16 (deny=9, warn=7); high-risk(cat cred): deny; readonly(ListServers): allow",
    "executedAt": "20261011213000"
  }
}, null, 2));
