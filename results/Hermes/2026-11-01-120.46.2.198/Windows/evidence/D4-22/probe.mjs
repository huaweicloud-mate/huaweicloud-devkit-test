// probe for case D4-22
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const rre = await import('file:///' + M + '/risk-rule-engine.mjs');
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,'') , caseId: 'D4-22' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
const p = rre.evaluateDeployPlan(JSON.stringify({service:'FunctionGraph', trigger:{type:'APIG', auth:'NONE', public:true}}));
const p2 = rre.evaluateDeployPlan(JSON.stringify({service:'FunctionGraph', trigger:{type:'APIG', auth:'IAM', public:false}}));
rec((p.decision==='deny'||p.decision==='warn') ? 'PASS':'FAIL', 'public=' + p.decision + ' private=' + p2.decision);
process.exit(0);
