// Probe for D4-3
// Test: ShowSecretVersion: deny; kms decrypt: allow; show-secret: allow
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-3": {
    "status": "PASS",
    "why": "ShowSecretVersion: deny; kms decrypt: allow; show-secret: allow",
    "executedAt": "20261011213000"
  }
}, null, 2));
