// D9-1: tools/list schema compliance
import { TOOL_DEFINITIONS } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/tools.mjs';
let valid=0, invalid=0;
for (const t of TOOL_DEFINITIONS) {
  if (t.name && t.inputSchema) valid++; else invalid++;
}
console.log(JSON.stringify({count: TOOL_DEFINITIONS.length, valid, invalid}));
