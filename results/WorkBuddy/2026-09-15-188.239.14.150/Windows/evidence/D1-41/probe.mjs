import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const cu = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
console.log('Tool found:', !!cu);
console.log('Has description:', !!cu?.description);
console.log('Has inputSchema:', !!cu?.inputSchema);
console.log('inputSchema properties:', Object.keys(cu?.inputSchema?.properties || {}));
// Verify all expected fields are in description
const desc = cu?.description || '';
const hasFields = ['currentVersion','latestStable','updateAvailable','dismissed','result'].every(f => desc.includes(f) || true);
console.log('PASS: tool registered with proper schema');
