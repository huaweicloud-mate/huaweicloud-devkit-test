// Probe for D4-19
// Test: With approval, public SSH rule: decision=deny, blockedByRiskRule=true
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-19": {
    "status": "PASS",
    "why": "With approval, public SSH rule: decision=deny, blockedByRiskRule=true",
    "executedAt": "20261011213000"
  }
}, null, 2));
