// D3-S2 probe
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const r = await tools.callTool('huaweicloud_plan_cli_command', { args:['VPC','DeleteVpc','--vpc-id','vpc-xxxx'] });
console.log(JSON.stringify(r, null, 2));
