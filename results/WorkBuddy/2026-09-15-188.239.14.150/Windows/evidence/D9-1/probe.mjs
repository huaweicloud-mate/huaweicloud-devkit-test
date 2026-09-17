import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const tools = TOOL_DEFINITIONS;
console.log('Tool count:', tools.length);
let validSchemas = 0;
for (const t of tools) {
  if (t.inputSchema && typeof t.inputSchema === 'object') validSchemas++;
}
console.log('Valid schemas:', validSchemas + '/' + tools.length);
const names = tools.map(t => t.name);
const dupes = names.filter((n,i) => names.indexOf(n) !== i);
console.log('Duplicates:', dupes);
if (tools.length >= 39 && validSchemas === tools.length && dupes.length === 0) console.log('PASS');
else console.log('FAIL');