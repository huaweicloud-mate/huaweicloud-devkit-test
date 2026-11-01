// probe for case D4-24
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const hc = await import('file:///' + M + '/hcloud-cli.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D4-24' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const t = hc.createApprovalToken(['ECS','DeleteServer','--server_id=x']);
const c1 = hc.consumeApprovalToken(t);
const c2 = hc.consumeApprovalToken(t);
rec((c1 && !c2) ? 'PASS':'FAIL', 'single-use=' + (c1 ? 'yes' : 'no') + ' replay-blocked=' + (!c2 ? 'yes' : 'no'));
process.exit(0);
