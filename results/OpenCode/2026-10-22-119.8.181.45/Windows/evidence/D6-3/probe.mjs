// D6-3 MCP cold start time
const start = Date.now();
const s = makeServer();
await s.initialize();
console.log('cold start:', Date.now()-start, 'ms');
