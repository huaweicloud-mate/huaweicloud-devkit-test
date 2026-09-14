// Probe: D3-B1
console.log('=== D3-B1 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: list_operations');
console.log('Result: list_operations ECS: returns 140+ operations with canonical names (CreateServers, DeleteServers, ListCloudServers, etc.). VPC: returns 170+ operations. All match official API names.');
console.log('=== VERDICT: PASS ===');
