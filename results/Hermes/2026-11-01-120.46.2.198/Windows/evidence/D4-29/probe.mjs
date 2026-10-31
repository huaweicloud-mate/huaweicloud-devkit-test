// probe for case D4-29
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const sp = await import('file:///' + M + '/safety-policy.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D4-29' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const raw = sp.classifyHcloudArgs(['ECS','DeleteServer','--server_id=x']);
const txt = sp.classifyTextCommand('hcloud ECS DeleteServer --server_id=x');
rec((raw.decision==='deny' && txt.decision==='deny') ? 'PASS':'FAIL', 'args=' + raw.decision + ' text=' + txt.decision);
process.exit(0);
