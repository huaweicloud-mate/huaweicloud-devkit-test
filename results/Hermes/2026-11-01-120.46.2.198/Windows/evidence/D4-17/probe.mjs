// probe for case D4-17
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D4-17' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const rre = await import('file:///' + M + '/risk-rule-engine.mjs');
let crashed = false; let misallowed = false;
for (const inp of ['', '   ', '{{', 'hcloud', 12345, null]) {
  try { const r = rre.evaluateCommandRisk(inp); if (r && r.decision === 'allow' && typeof inp === 'string' && inp.trim() !== '') misallowed = true; } catch(e) { crashed = true; }
}
const sp = await import('file:///' + M + '/safety-policy.mjs');
const malformed = (() => { try { return sp.classifyHcloudArgs(['ECS']).decision; } catch(e) { return 'crash'; } })();
rec((!crashed && malformed !== 'crash') ? 'PASS':'FAIL', 'fuzz crashed=' + crashed + ' malformed classify=' + malformed);
process.exit(0);
