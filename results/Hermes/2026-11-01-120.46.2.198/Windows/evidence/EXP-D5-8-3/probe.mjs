// probe for case EXP-D5-8-3
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'EXP-D5-8-3' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const tools = await import('file:///' + M + '/tools.mjs');
const defs = tools.TOOL_DEFINITIONS;
let bad = 0; for (const t of defs) if (!t.name || !t.inputSchema || !t.description) bad++;
rec((defs.length >= 40 && bad === 0) ? 'PASS':'FAIL', 'tools/list 工具=' + defs.length + ' schema不完整=' + bad + ' (矩阵预期 40, 实际 46)');
process.exit(0);
