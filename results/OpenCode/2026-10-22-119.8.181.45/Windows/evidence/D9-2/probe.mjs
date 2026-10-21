// D9-2 JSON-RPC error codes
const r = await server.call('nonexistent', {});
console.log(JSON.stringify(r.error));
