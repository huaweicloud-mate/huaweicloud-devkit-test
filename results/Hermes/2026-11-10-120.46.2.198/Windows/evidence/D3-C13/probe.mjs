// huaweicloud-devkit real-cloud probe: D3-C13
// 真机执行: hcloud obs mb testbot5-hermes-obs-4259895546 -> callTool huaweicloud_obs_set_website_config(set/get) -> hcloud obs rm -r obs://testbot5-hermes-obs-4259895546
// assert: 带 securityToken 凭证下 obs_set_website_config set/get 返回 {ok:true,status:200}
const NPM='C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-4eb50f70acb9/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const {callTool}=await import('file:///'+NPM+'/tools.mjs');
// 见 stdout.log 真机输出