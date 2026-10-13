// D4-21 probe (hook_check_artifacts)
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const r = await tools.callTool('huaweicloud_hook_check_artifacts', { artifacts:[{ path:'iam-policy.json', content: JSON.stringify({ Statement:[{ Effect:'Allow', Action:'*', Resource:'*' }] }) }] });
console.log(JSON.stringify(r, null, 2));
