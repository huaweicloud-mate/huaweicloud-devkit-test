// D5-3 tool enumeration
const r = await server.listTools();
console.log('count:', r.result.tools.length);
