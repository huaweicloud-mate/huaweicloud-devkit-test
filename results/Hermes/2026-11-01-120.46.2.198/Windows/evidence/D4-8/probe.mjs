// probe for case D4-8
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D4-8' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
import { readFileSync } from 'node:fs';
const py = readFileSync(PKG + '/plugins/huaweicloud-core/hooks/huaweicloud-safety.py', 'utf8');
const nde = readFileSync(PKG + '/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs', 'utf8');
const both = (py.length > 0 && nde.length > 0);
const sp = await import('file:///' + M + '/safety-policy.mjs');
const nodeDeny = sp.classifyTextCommand('hcloud ECS DeleteServer').decision === 'deny';
rec((both && nodeDeny) ? 'PASS':'FAIL', 'py+mjs hooks present=' + both + ' node classify deny=' + nodeDeny);
process.exit(0);
