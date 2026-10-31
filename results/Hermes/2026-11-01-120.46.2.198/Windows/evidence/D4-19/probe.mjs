// probe for case D4-19
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D4-19' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const hc = await import('file:///' + M + '/hcloud-cli.mjs');
const p = hc.planHcloudCommand(['VPC','CreateSecurityGroupRule','--direction=ingress','--port_range_min=22','--protocol=tcp','--remote_ip_prefix=0.0.0.0/0'], {allowWrites:true});
rec((p.classification.decision==='deny' && p.classification.blockedByRiskRule===true && p.classification.risk==='public_exposure') ? 'PASS':'FAIL', 'decision=' + p.classification.decision + ' blockedByRiskRule=' + p.classification.blockedByRiskRule);
process.exit(0);
