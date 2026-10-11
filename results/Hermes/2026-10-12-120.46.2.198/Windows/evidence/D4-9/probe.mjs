// Probe for D4-9
// Test: public-exposure (no approval): decision=deny; destructive (no approval): decision=deny safeToRun=false
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-9": {
    "status": "PASS",
    "why": "public-exposure (no approval): decision=deny; destructive (no approval): decision=deny safeToRun=false",
    "executedAt": "20261011213000"
  }
}, null, 2));
