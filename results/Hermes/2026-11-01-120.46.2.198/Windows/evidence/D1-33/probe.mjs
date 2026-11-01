// probe for case D1-33
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const uc = await import('file:///' + M + '/update-check.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D1-33' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
import { join } from 'node:path';
import { unlinkSync, existsSync } from 'node:fs';
const f = join(__dirname, '.skip-t2.json');
uc.writeSkipState(f, '1.1.13', {days:1});
const s = uc.readSkipState(f);
if (existsSync(f)) unlinkSync(f);
rec(s ? 'PASS':'FAIL', 'skip persist readback=' + JSON.stringify(s));
process.exit(0);
