// probe for case D2-4
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const sp = await import('file:///' + M + '/safety-policy.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D2-4' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const rd = sp.redactSecrets({access_key:'AKID', secret_key:'SK', security_token:'TK'});
const ok = rd.access_key!=='AKID' && rd.secret_key!=='SK';
rec(ok ? 'PASS':'FAIL', 'redacted=' + JSON.stringify(rd));
process.exit(0);
