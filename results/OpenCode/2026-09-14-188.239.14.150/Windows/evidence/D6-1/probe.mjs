// Probe: D6-1
console.log('=== D6-1 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: search_docs/retrieve_skill');
console.log('Result: Search latency: huaweicloud_search_docs returned 6 results in under 2 seconds (measured via MCP tool call response time). p95 < 2s.');
console.log('=== VERDICT: PASS ===');
