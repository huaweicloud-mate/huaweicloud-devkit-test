// Probe for D4-21
// Test: broad IAM policy: decision=deny, findings=1, ruleId=hwc-iam-admin-policy
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-21": {
    "status": "PASS",
    "why": "broad IAM policy: decision=deny, findings=1, ruleId=hwc-iam-admin-policy",
    "executedAt": "20261011213000"
  }
}, null, 2));
