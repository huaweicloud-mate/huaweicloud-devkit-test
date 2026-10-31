// probe for case D9-13
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D9-13' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const hc = await import('file:///' + M + '/hcloud-cli.mjs');
const sp = await import('file:///' + M + '/safety-policy.mjs');
const rd = sp.redactSecrets({access_key:'AKID', secret_key:'SK', security_token:'TK'});
const noLeak = (rd.access_key!=='AKID' && rd.secret_key!=='SK' && rd.security_token!=='TK');
const t = hc.createApprovalToken(['ECS','DeleteServer','--x']);
const single = (hc.consumeApprovalToken(t) && !hc.consumeApprovalToken(t));
const hash = hc.hashArgs(['ECS','DeleteServer']);
rec((noLeak && single && !!hash) ? 'PASS':'FAIL', 'noLeak=' + noLeak + ' tokenSingleUse=' + single + ' hashArgs=' + (hash?'ok':'nil'));
process.exit(0);
