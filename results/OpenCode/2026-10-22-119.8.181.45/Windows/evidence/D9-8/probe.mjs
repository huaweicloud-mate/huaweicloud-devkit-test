// D9-8 inputSchema compliance
const tools = r.result.tools;
console.log('all have schema:', tools.every(t => t.inputSchema?.type === 'object'));
