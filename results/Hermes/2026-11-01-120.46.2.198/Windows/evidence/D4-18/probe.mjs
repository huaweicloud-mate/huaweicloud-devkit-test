// probe for case D4-18
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D4-18' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const hc = await import('file:///' + M + '/hcloud-cli.mjs');
const p = hc.planHcloudCommand(['ECS','DeleteServer','--server_id=x']);
const confirmNotDeny = (p.classification.decision==='deny') && (!!p.approvalToken) && (p.safeToRun===false);
rec(confirmNotDeny ? 'PASS':'FAIL', 'decision=' + p.classification.decision + ' token=' + (p.approvalToken?'present':'none') + ' safeToRun=' + p.safeToRun);
process.exit(0);
