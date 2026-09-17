import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const tools = TOOL_DEFINITIONS;
console.log('Tool count:', tools.length);
const allHaveSchema = tools.every(t => t.inputSchema && typeof t.inputSchema === 'object');
console.log('All have schema:', allHaveSchema);
if (tools.length >= 39 && allHaveSchema) console.log('PASS: tools/list enumerates all tools with complete schema');
else console.log('FAIL: count='+tools.length+' schema='+allHaveSchema);