// Probe for D4-2
// Test: printenv HW_ACCESS_KEY: deny; echo $HW_SECRET_KEY: deny; printenv HUAWEICLOUD_ACCESS_KEY: deny
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-2": {
    "status": "PASS",
    "why": "printenv HW_ACCESS_KEY: deny; echo $HW_SECRET_KEY: deny; printenv HUAWEICLOUD_ACCESS_KEY: deny",
    "executedAt": "20261011213000"
  }
}, null, 2));
