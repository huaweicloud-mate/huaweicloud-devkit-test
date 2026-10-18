// Real probe for D9-12
// Real execution: 20261019051034
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
const probe = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/eval/harness/protocol-probe.mjs';
const mcp = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const r = spawnSync('node', [probe, mcp], { encoding: 'utf8', timeout: 60000, shell: false, windowsHide: true });
const text = r.stdout || '';
const m = text.match(/结果落盘:\s*(\S+)/);
let jsonPath = m ? m[1] : null;
let json = null;
if (jsonPath && existsSync(jsonPath)) { try { json = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch {} }
const results = json ? json.results : [];
const toolsList = results.find(x => x.id.includes('tools/list'));
const unknownMethod = results.find(x => x.id.includes('unknown-method'));
const status = (toolsList && toolsList.verdict === 'PASS' && unknownMethod && unknownMethod.verdict === 'PASS') ? 'PASS' : 'FAIL';
const output = { caseId: 'D9-12', status, why: 'tools/list=' + toolsList?.verdict + ' unknown=' + unknownMethod?.verdict, executedAt: '20261019051034', result: { toolsList: toolsList?.verdict, unknownMethod: unknownMethod?.verdict, passCount: results.filter(x => x.verdict === 'PASS').length, totalCount: results.length } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
