// probe for case EXP-NR3-03
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'EXP-NR3-03' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const uc = await import('file:///' + M + '/update-check.mjs');
import { join } from 'node:path';
import { unlinkSync, existsSync } from 'node:fs';
const f = join(__dirname, '.nr3-skip.json');
uc.writeSkipState(f, '1.1.13', {days:3});
const s = uc.readSkipState(f); if (existsSync(f)) unlinkSync(f);
rec(s ? 'PASS':'FAIL', 'D1-42 dismiss 落盘复查=' + JSON.stringify(s));
process.exit(0);
