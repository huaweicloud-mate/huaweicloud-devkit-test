// Probe for D10-3
// Source: probe-p1-batch1.mjs / probe-p1-batch2.mjs / probe-p1-fixes2.mjs
// Status: FAIL
console.log(JSON.stringify({
  "D10-3": {
    "status": "FAIL",
    "why": "Route accuracy=21.4% (3 HIT, 11 MISS, 1 N/A via eval harness). Expected>=90%. Chinese intents for ECS/RDS/OBS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM all MISS. Root cause: serviceCatalog keyword lists missing Chinese terms for most services. tools.mjs:1815-1900.",
    "executedAt": "20261011213400"
  }
}, null, 2));
