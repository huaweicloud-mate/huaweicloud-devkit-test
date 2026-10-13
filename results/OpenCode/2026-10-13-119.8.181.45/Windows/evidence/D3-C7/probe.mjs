// D3-C7 probe (cross-region)
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const avail = await tools.callTool('huaweicloud_get_regional_availability', { service:'ECS', region:'ap-southeast-3' });
const plan = await tools.callTool('huaweicloud_plan_cli_command', { args:['ECS','ListServersDetails','--cli-region=ap-southeast-3'] });
const regs = await tools.callTool('huaweicloud_list_regions', {});
console.log(JSON.stringify({ avail, plan, regions: regs }, null, 2));
