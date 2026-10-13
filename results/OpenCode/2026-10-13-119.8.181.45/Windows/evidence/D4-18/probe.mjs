// D4-18 probe (confirm-not-deny)
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const r = await tools.callTool('huaweicloud_plan_cli_command', { args:['ECS','delete-servers','--server-ids','test123'] });
console.log(JSON.stringify(r, null, 2));
