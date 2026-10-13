// D4-20 probe
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const r = await tools.callTool('huaweicloud_run_approved_command', { args:['ECS','ListServersDetails'], approvalToken:'', approvedByUser:false }).catch(e=>({__error:String(e)}));
console.log(JSON.stringify(r, null, 2));
