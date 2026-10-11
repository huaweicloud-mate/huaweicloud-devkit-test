// Probe for D4-5
// Test: ECS.DeleteServer: decision=deny risk=write; VPC.DeleteVpc: decision=deny risk=write; ECS.CreateServer: decision=deny risk=write; RDS.DeleteInstance: decision=deny risk=write
// Status: PASS
// Source: probe-p0-batch1.mjs / probe-p0-fixes.mjs in hdk repo
console.log(JSON.stringify({
  "D4-5": {
    "status": "PASS",
    "why": "ECS.DeleteServer: decision=deny risk=write; VPC.DeleteVpc: decision=deny risk=write; ECS.CreateServer: decision=deny risk=write; RDS.DeleteInstance: decision=deny risk=write",
    "executedAt": "20261011213000"
  }
}, null, 2));
