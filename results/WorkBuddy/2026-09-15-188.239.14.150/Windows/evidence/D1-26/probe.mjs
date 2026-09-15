import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const tools = TOOL_DEFINITIONS.map(t => t.name);
console.log('Total tools:', tools.length);
console.log('has check_update:', tools.includes('huaweicloud_check_update'));
console.log('has upgrade:', tools.includes('huaweicloud_upgrade'));
if (tools.includes('huaweicloud_check_update') && tools.includes('huaweicloud_upgrade')) {
  const cu = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
  console.log('check_update has description:', !!cu.description);
  console.log('check_update has inputSchema:', !!cu.inputSchema);
  console.log('PASS');
} else {
  console.log('FAIL: check_update or upgrade not registered');
}