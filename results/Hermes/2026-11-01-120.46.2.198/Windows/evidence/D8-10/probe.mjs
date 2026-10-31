// probe for case D8-10
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D8-10' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const mc = await import('file:///' + M + '/mcp-config-merge.mjs');
const cb = await import('file:///' + M + '/mcp-config-backup.mjs');
const delta = mc.extractUserDelta({mcpServers:{a:{command:'old',args:['-x']}}}, {mcpServers:{a:{command:'new',args:['-y']}}});
const reapplied = mc.applyUserDelta({mcpServers:{a:{command:'old',args:['-x']}}}, delta);
const okFns = ['mergeCommandStyle','mergeArgsStyle','mergeMcpServersFile','extractUserDelta','applyUserDelta'].every(f=>typeof mc[f]==='function');
const okBk = ['takeAgentDelta','saveAgentDelta','purgeBackup'].every(f=>typeof cb[f]==='function');
rec((okFns && okBk) ? 'PASS':'FAIL', 'merge fns=' + okFns + ' backup fns=' + okBk + ' extract/apply=' + (delta && reapplied ? 'ok':'err'));
process.exit(0);
