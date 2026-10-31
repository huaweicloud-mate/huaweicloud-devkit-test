// probe for case EXP-D5-8-1
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'EXP-D5-8-1' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
import { existsSync, readFileSync } from 'node:fs';
const manifest = PKG + '/plugins/huaweicloud-core/openclaw.plugin.json';
const exists = existsSync(manifest);
let ok = exists; if (exists) { try { JSON.parse(readFileSync(manifest,'utf8')); } catch(e) { ok = false; } }
rec(ok ? 'PASS':'FAIL', 'Hermes 客户端插件清单发现/加载: manifest=' + exists + ' validJSON=' + ok);
process.exit(0);
