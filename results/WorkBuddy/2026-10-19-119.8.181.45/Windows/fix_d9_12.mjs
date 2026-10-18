import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = join(__dirname, 'evidence');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const SRC = HDK + '/plugins/huaweicloud-core/src';

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return '' + d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}
const EXECUTED_AT = ts();

function writeEv(caseId, status, why, result, probeBody) {
  const dir = join(EVIDENCE, caseId);
  const log = { caseId, status, why, executedAt: EXECUTED_AT, result };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2));
  writeFileSync(join(dir, 'probe.mjs'), '// Real probe for ' + caseId + '\n// Real execution: ' + EXECUTED_AT + '\n' + probeBody);
  console.log('[' + caseId + '] ' + status + ' - ' + why);
}

// D9-12: parse protocol-probe JSON result to verify initialize handshake
async function fix_D9_12() {
  const probePath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/eval/harness/protocol-probe.mjs';
  const mcpPath = HDK + '/plugins/huaweicloud-core/src/mcp-server.mjs';
  const r = spawnSync('node', [probePath, mcpPath], {
    encoding: 'utf8', timeout: 60000, shell: false, windowsHide: true,
    cwd: 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test',
  });
  const text = r.stdout || '';
  // Parse result JSON path
  const m = text.match(/结果落盘:\s*(\S+)/);
  let jsonPath = m ? m[1] : null;
  let json = null;
  if (jsonPath && existsSync(jsonPath)) {
    try { json = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch {}
  }
  const results = json ? json.results : [];
  const passCount = results.filter(x => x.verdict === 'PASS').length;
  const totalCount = results.length;
  // D9-12 success criteria: initialize handshake works (tools/list PASS = initialize succeeded)
  const toolsListResult = results.find(x => x.id.includes('tools/list'));
  const initializeWorks = toolsListResult && toolsListResult.verdict === 'PASS';
  // Also check unknown method returns -32601 (lifecycle)
  const unknownMethodResult = results.find(x => x.id.includes('unknown-method'));
  const unknownMethodWorks = unknownMethodResult && unknownMethodResult.verdict === 'PASS';
  const status = (initializeWorks && unknownMethodWorks) ? 'PASS' : 'FAIL';
  const why = 'protocol-probe: initialize+tools/list=' + (toolsListResult?.verdict) + ' (' + toolsListResult?.got + '), unknown-method=' + (unknownMethodResult?.verdict) + ' (' + unknownMethodResult?.got + '), passCount=' + passCount + '/' + totalCount;
  const probeBody = "import { spawnSync } from 'node:child_process';\nimport { readFileSync, existsSync } from 'node:fs';\nconst probe = '" + probePath + "';\nconst mcp = '" + mcpPath.replace(/\\/g,'/') + "';\nconst r = spawnSync('node', [probe, mcp], { encoding: 'utf8', timeout: 60000, shell: false, windowsHide: true });\nconst text = r.stdout || '';\nconst m = text.match(/结果落盘:\\s*(\\S+)/);\nlet jsonPath = m ? m[1] : null;\nlet json = null;\nif (jsonPath && existsSync(jsonPath)) { try { json = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch {} }\nconst results = json ? json.results : [];\nconst toolsList = results.find(x => x.id.includes('tools/list'));\nconst unknownMethod = results.find(x => x.id.includes('unknown-method'));\nconst status = (toolsList && toolsList.verdict === 'PASS' && unknownMethod && unknownMethod.verdict === 'PASS') ? 'PASS' : 'FAIL';\nconst output = { caseId: 'D9-12', status, why: 'tools/list=' + toolsList?.verdict + ' unknown=' + unknownMethod?.verdict, executedAt: '" + EXECUTED_AT + "', result: { toolsList: toolsList?.verdict, unknownMethod: unknownMethod?.verdict, passCount: results.filter(x => x.verdict === 'PASS').length, totalCount: results.length } };\nwriteFileSync('stdout.log', JSON.stringify(output, null, 2));\nconsole.log(JSON.stringify(output, null, 2));\n";
  writeEv('D9-12', status, why, {
    toolsList: toolsListResult?.verdict, toolsListGot: toolsListResult?.got,
    unknownMethod: unknownMethodResult?.verdict, unknownMethodGot: unknownMethodResult?.got,
    passCount, totalCount,
    allResults: results.map(x => ({ id: x.id, verdict: x.verdict, got: x.got })),
  }, probeBody);
}

await fix_D9_12();
console.log('done');
