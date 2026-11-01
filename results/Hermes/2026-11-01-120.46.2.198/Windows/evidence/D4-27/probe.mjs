// probe for case D4-27
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const sp = await import('file:///' + M + '/safety-policy.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D4-27' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const rd = sp.redactSecrets({access_key:'AKIDtest', secret_key:'SKtest', region:'cn-north-4'});
const ok = rd.access_key==='<redacted>' && rd.secret_key==='<redacted>' && rd.region==='cn-north-4';
rec(ok ? 'PASS':'FAIL', 'redacted=' + JSON.stringify(rd));
process.exit(0);
