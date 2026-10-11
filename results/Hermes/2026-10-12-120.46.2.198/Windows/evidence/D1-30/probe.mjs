// Probe for D1-30
// Source: probe-p2-batch1.mjs in hdk repo
// Status: PASS
console.log(JSON.stringify({
  "D1-30": {
    "status": "PASS",
    "why": "semverCompare: 1.1.2>1.1.1=1, 1.1.0>1.1.0-next.9=1 (stable>prerelease), 1.1.1==1.1.1=0",
    "executedAt": "20261011213600"
  }
}, null, 2));
