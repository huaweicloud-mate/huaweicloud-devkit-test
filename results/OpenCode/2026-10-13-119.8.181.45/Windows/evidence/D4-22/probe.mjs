// D4-22 probe (hook_check_deploy_plan)
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const r = await tools.callTool('huaweicloud_hook_check_deploy_plan', { plan:{ steps:[{ action:'create-function', params:{ endpoint:'0.0.0.0/0', public:true } }] } });
console.log(JSON.stringify(r, null, 2));
