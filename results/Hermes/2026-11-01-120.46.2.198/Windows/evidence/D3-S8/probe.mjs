// probe for case D3-S8
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-S8' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const tools = await import('file:///' + M + '/tools.mjs');
const hc = await import('file:///' + M + '/hcloud-cli.mjs');
const hasExplain = tools.TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_explain_error');
const hasExtract = typeof hc.extractApiError === 'function';
rec((hasExplain && hasExtract) ? 'PASS':'FAIL', '排障 explain_error 工具=' + hasExplain + ' extractApiError=' + hasExtract);
process.exit(0);
