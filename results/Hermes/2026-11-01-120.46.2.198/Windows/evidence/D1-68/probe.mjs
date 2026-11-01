// probe for case D1-68
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D1-68' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
import { readFileSync } from 'node:fs';
const ic = readFileSync(PKG + '/plugins/huaweicloud-core/src/icon-library.mjs', 'utf8');
const cred = readFileSync(PKG + '/plugins/huaweicloud-core/src/auth/credentials.mjs', 'utf8');
const iconsoff = /ICONS_OFFLINE/.test(ic);
const region = /HUAWEICLOUD_REGION/.test(cred);
rec((iconsoff && region) ? 'PASS':'FAIL', 'ICONS_OFFLINE(icon-library)=' + iconsoff + ' HUAWEICLOUD_REGION(credentials)=' + region);
process.exit(0);
