// D8-10 MCP config backup & merge
const { readAgentDelta } = await import('mcp-config-backup.mjs');
const { detectOpenCodeEra } = await import('mcp-config-merge.mjs');
console.log('backup:', typeof readAgentDelta, 'merge:', typeof detectOpenCodeEra);
