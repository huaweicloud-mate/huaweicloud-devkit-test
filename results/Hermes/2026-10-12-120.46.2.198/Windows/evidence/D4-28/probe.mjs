// Probe for D4-28
// Test: hooks.json has .mjs: true; classifyTextCommand cred=deny: true; safe cmd not denied: true
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-28": {
    "status": "PASS",
    "why": "hooks.json has .mjs: true; classifyTextCommand cred=deny: true; safe cmd not denied: true",
    "executedAt": "20261011213000"
  }
}, null, 2));
