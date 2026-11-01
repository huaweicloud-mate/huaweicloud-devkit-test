// probe for case D1-30
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const uc = await import('file:///' + M + '/update-check.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D1-30' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const a = uc.semverCompare('1.1.13','1.1.12');
const b = uc.semverCompare('1.1.12','1.1.13');
const c = uc.semverCompare('1.1.12','1.1.12');
rec((a>0 && b<0 && c===0) ? 'PASS':'FAIL', `a=${a} b=${b} c=${c}`);
process.exit(0);
