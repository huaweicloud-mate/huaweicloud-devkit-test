// probe for case EXP-NR3-23
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'EXP-NR3-23' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const uc = await import('file:///' + M + '/update-check.mjs');
uc.invalidateUpdateCache();
const mock = async () => ({latest:'1.1.13', next:null});
const cold = await uc.getCachedUpdateInfo('1.1.12', {doQuery: mock, now: Date.now()});
const warm = await uc.getCachedUpdateInfo('1.1.12', {doQuery: mock, now: Date.now()+1000});
rec((cold.result && warm.result) ? 'PASS':'FAIL', 'D1-45 预热竞态: cold=' + cold.result + ' warm=' + warm.result);
process.exit(0);
