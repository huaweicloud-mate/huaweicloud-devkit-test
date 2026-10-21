// D1-26 check_update/upgrade tool registration
const { TOOL_DEFINITIONS } = await import('file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/tools.mjs');
const hasCU = TOOL_DEFINITIONS.some(t => t.name === 'huaweicloud_check_update');
const hasUp = TOOL_DEFINITIONS.some(t => t.name === 'huaweicloud_upgrade');
console.log('check_update:', hasCU, 'upgrade:', hasUp);
