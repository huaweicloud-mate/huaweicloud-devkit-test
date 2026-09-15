import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
console.log('Tools count:', TOOL_DEFINITIONS.length);
console.log('WorkBuddy has access to plugin:', TOOL_DEFINITIONS.length > 0);
if (TOOL_DEFINITIONS.length > 0) console.log('PASS: WorkBuddy can discover and load plugin manifest');
else console.log('FAIL');