// probe for case D9-8
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D9-8' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const tools = await import('file:///' + M + '/tools.mjs');
let ok = true;
for (const t of tools.TOOL_DEFINITIONS) { if (!t.inputSchema || typeof t.inputSchema !== 'object' || !t.inputSchema.type) { ok = false; break; } }
rec(ok ? 'PASS':'FAIL', 'inputSchema 版本合规(全部含 type)=' + ok + ' (tools=' + tools.TOOL_DEFINITIONS.length + ')');
process.exit(0);
