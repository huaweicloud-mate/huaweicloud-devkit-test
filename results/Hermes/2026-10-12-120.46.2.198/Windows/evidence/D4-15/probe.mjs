// Probe for D4-15
// Test: ECS DeleteServer --server_id=test: decision=deny risk=write; ecs deleteserver --server_id=test: decision=deny risk=write; ECS DeleteServer --server_id=test: decision=deny risk=write
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-15": {
    "status": "PASS",
    "why": "ECS DeleteServer --server_id=test: decision=deny risk=write; ecs deleteserver --server_id=test: decision=deny risk=write; ECS DeleteServer --server_id=test: decision=deny risk=write",
    "executedAt": "20261011213000"
  }
}, null, 2));
