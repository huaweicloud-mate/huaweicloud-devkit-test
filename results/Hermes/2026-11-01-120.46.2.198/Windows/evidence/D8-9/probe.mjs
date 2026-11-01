// probe for case D8-9
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D8-9' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const tel = await import('file:///' + M + '/telemetry/telemetry.mjs');
const fid = tel.generateOrRecoverInstallId();
const fid2 = tel.generateOrRecoverInstallId();
const stable = (fid && fid === fid2);
const s1 = tel.sanitizeValue('AKIDsecret123'); const s2 = tel.sanitizeValue('normal-value');
const sanObj = {exists: typeof tel.sanitizeValue==='function', s1, s2};
rec(stable ? 'PASS':'FAIL', 'installId stable=' + stable + ' sanitizeValue=' + JSON.stringify(sanObj));
process.exit(0);
