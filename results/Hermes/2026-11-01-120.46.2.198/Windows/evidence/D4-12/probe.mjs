// probe for case D4-12
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D4-12' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
import { readFileSync } from 'node:fs';
const pj = JSON.parse(readFileSync(PKG + '/package.json', 'utf8'));
const post = pj.scripts?.postinstall || '(none)';
const safe = /dsh-postinstall/.test(post);
rec(safe ? 'PASS':'FAIL', 'postinstall=' + post + ' deps=' + Object.keys(pj.dependencies||{}).length);
process.exit(0);
