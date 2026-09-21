// D5-3: Tool enumeration
import { TOOL_DEFINITIONS } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/tools.mjs';
console.log('Tool count:', TOOL_DEFINITIONS.length);
console.log(TOOL_DEFINITIONS.map(t=>t.name).join('\n'));
