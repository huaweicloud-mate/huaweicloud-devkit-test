// probe for case D4-7
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const tools = await import('file:///' + M + '/tools.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D4-7' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const names = tools.TOOL_DEFINITIONS.map(t=>t.name);
const hooks = ['huaweicloud_hook_check_command','huaweicloud_hook_check_artifacts','huaweicloud_hook_check_deploy_plan'];
const ok = hooks.every(h=>names.includes(h));
rec(ok ? 'PASS':'FAIL', 'hook tools present=' + ok + ' (total tools=' + names.length + ')');
process.exit(0);
