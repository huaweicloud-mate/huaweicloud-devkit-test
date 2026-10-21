// D9-1 tools/list compliance
const r = await server.listTools();
console.log('tools count:', r.result.tools.length);
