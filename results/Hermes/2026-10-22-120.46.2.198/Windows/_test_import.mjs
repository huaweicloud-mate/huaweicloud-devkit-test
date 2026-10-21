import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL('C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-fe1b399ab162/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs').href);
const classifyTextCommand = mod.classifyTextCommand || mod.default?.classifyTextCommand;
if (!classifyTextCommand) {
  console.log(JSON.stringify({error: 'function not found', exports: Object.keys(mod)}));
} else {
  const r = classifyTextCommand('cat ~/.hcloud/credentials.json');
  console.log(JSON.stringify({decision: r?.decision, reason: r?.reason}));
}
