// probe for case D1-39
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const uc = await import('file:///' + M + '/update-check.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D1-39' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
let r;
try { r = uc.queryDistTagsSync ? uc.queryDistTagsSync() : null; } catch(e) { r = 'err:' + e.message; }
const ok = r && typeof r !== 'string';
rec(ok ? 'PASS':'FAIL', 'queryDistTagsSync=' + JSON.stringify(r).slice(0,120));
process.exit(0);
