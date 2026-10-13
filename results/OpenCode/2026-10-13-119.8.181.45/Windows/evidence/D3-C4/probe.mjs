// D3-C4 probe
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const r = await tools.callTool('huaweicloud_plan_cli_command', { args:['ECS','create-servers','--image-id','xxx','--flavor-id','s6.small.1'] });
console.log(JSON.stringify(r, null, 2));
