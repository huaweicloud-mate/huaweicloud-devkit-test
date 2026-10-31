// probe for case D4-15
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const sp = await import('file:///' + M + '/safety-policy.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D4-15' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const variants = [['ecs','deleteserver','--server_id=x'],['ECS','DeleteServer'],['ECS','delete-server','--id=x']];
const decs = variants.map(v=>sp.classifyHcloudArgs(v).decision);
const ok = decs.every(d=>d==='deny');
rec(ok ? 'PASS':'FAIL', 'variants decisions=' + JSON.stringify(decs));
process.exit(0);
