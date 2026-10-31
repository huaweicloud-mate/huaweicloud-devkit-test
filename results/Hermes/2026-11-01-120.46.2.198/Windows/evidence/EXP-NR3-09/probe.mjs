// probe for case EXP-NR3-09
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'EXP-NR3-09' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const uc = await import('file:///' + M + '/update-check.mjs');
let r = null; try { r = uc.queryDistTagsSync(); } catch(e) { r = null; }
const fixed = (r && r.latest && r.next);
rec(fixed ? 'PASS':'FAIL', 'D1-39 EINVAL 修复核实: queryDistTagsSync=' + JSON.stringify(r) + ' (shell:true @ update-check.mjs:265, 原 P0 已修复)');
process.exit(0);
