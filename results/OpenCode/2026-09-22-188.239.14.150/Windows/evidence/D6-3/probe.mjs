// D6-3: MCP cold start
const start = Date.now();
await import('C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs');
console.log('Cold start:', Date.now() - start, 'ms');
