// D4-19 probe (preflight in confirm flow)
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const c = await tools.callTool('huaweicloud_hook_check_command', { command:'hcloud ECS delete-servers --server-ids prod123 --force' });
const dp = await tools.callTool('huaweicloud_hook_check_deploy_plan', { plan:{ steps:[{ action:'create-function', params:{ endpoint:'0.0.0.0/0', public:true } }] } });
console.log(JSON.stringify({ hook:c, deploy:dp }, null, 2));
