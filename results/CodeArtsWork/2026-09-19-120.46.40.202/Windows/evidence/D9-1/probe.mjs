// Probe: D9-1
// Status: PASS
// Time: 20260919051107
// Detail: Total: 40, Valid: 40, Invalid: 0
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const tools = m.TOOL_DEFINITIONS || m.tools || [];
let valid = 0, invalid = 0;
for (const t of tools) {
  if (t.name && t.description && t.inputSchema) valid++;
  else invalid++;
}
console.log('Total: ' + tools.length + ', Valid: ' + valid + ', Invalid: ' + invalid);