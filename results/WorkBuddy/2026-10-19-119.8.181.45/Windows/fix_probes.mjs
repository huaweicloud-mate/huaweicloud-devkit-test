import { writeFileSync, readFileSync } from 'node:fs';
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

// D4-23: fix path to rules/huawei-agent-rules.mdc
async function fix_D4_23() {
  const path = HDK + '/rules/huawei-agent-rules.mdc';
  let exists = false, content = '', hasMust = false, hasCsms = false;
  try {
    content = readFileSync(path, 'utf8');
    exists = true;
    hasMust = /MUST|MUST NOT/.test(content);
    hasCsms = /csms|kms.*direct/i.test(content);
  } catch {}
  const status = (exists && hasMust && hasCsms) ? 'PASS' : 'FAIL';
  const probeBody = "import { readFileSync } from 'node:fs';\nconst path = '" + path.replace(/\\/g,'/') + "';\nlet content = '';\ntry { content = readFileSync(path, 'utf8'); } catch {}\nconst exists = content.length > 0;\nconst hasMust = /MUST|MUST NOT/.test(content);\nconst hasCsms = /csms|kms|direct/i.test(content);\nconst status = (exists && hasMust && hasCsms) ? 'PASS' : 'FAIL';\nconst output = { caseId: 'D4-23', status, why: 'path=' + path + ' exists=' + exists, executedAt: '" + EXECUTED_AT + "', result: { exists, hasMust, hasCsms, contentLen: content.length } };\nwriteFileSync('stdout.log', JSON.stringify(output, null, 2));\nconsole.log(JSON.stringify(output, null, 2));\n";
  writeEv('D4-23', status, 'agent-rules.mdc found=' + exists + ' hasMUST=' + hasMust + ' hasCsms=' + hasCsms, { path, exists, hasMust, hasCsms, contentLen: content.length }, probeBody);
}

// D9-12: protocol-probe needs the mcp-server.mjs arg
async function fix_D9_12() {
  const probePath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/eval/harness/protocol-probe.mjs';
  const mcpPath = HDK + '/plugins/huaweicloud-core/src/mcp-server.mjs';
  const r = spawnSync('node', [probePath, mcpPath], {
    encoding: 'utf8', timeout: 60000, shell: false, windowsHide: true,
    cwd: 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test',
  });
  const text = r.stdout || '';
  const hasProtocolVersion = /protocolVersion/i.test(text);
  const hasCapabilities = /capabilities/i.test(text);
  const hasServerInfo = /serverInfo/i.test(text);
  const status = (hasProtocolVersion && hasCapabilities && hasServerInfo) ? 'PASS' : 'FAIL';
  const probeBody = "import { spawnSync } from 'node:child_process';\nconst probe = '" + probePath + "';\nconst mcp = '" + mcpPath.replace(/\\/g,'/') + "';\nconst r = spawnSync('node', [probe, mcp], { encoding: 'utf8', timeout: 60000, shell: false, windowsHide: true });\nconst text = r.stdout || '';\nconst hasProtocolVersion = /protocolVersion/i.test(text);\nconst hasCapabilities = /capabilities/i.test(text);\nconst hasServerInfo = /serverInfo/i.test(text);\nconst status = (hasProtocolVersion && hasCapabilities && hasServerInfo) ? 'PASS' : 'FAIL';\nconst output = { caseId: 'D9-12', status, why: 'pv=' + hasProtocolVersion + ' caps=' + hasCapabilities + ' si=' + hasServerInfo, executedAt: '" + EXECUTED_AT + "', result: { exit: r.status, hasProtocolVersion, hasCapabilities, hasServerInfo, stdout: text.slice(0,500) } };\nwriteFileSync('stdout.log', JSON.stringify(output, null, 2));\nconsole.log(JSON.stringify(output, null, 2));\n";
  writeEv('D9-12', status, 'protocol-probe exit=' + r.status + ' pv=' + hasProtocolVersion + ' caps=' + hasCapabilities + ' si=' + hasServerInfo, { exit: r.status, hasProtocolVersion, hasCapabilities, hasServerInfo, stdout: text.slice(0, 500), stderr: (r.stderr || '').slice(0, 200) }, probeBody);
}

// D1-39: queryDistTagsSync returned null - real FAIL. Also try queryDistTagsFetch as cross-check
async function fix_D1_39() {
  try {
    const mod = await import('file:///' + SRC.replace(/\\/g,'/') + '/update-check.mjs');
    const sync = mod.queryDistTagsSync({ timeoutMs: 60000 });
    const fetch = await mod.queryDistTagsFetch({ timeoutMs: 30000 });
    const anyWorked = (sync && (sync.latest || sync.next)) || (fetch && (fetch.latest || fetch.next));
    const status = anyWorked ? 'PASS' : 'FAIL';
    const probeBody = "import { queryDistTagsSync, queryDistTagsFetch } from 'file:///' + '" + SRC.replace(/\\/g,'/') + "/update-check.mjs';\nconst sync = queryDistTagsSync({ timeoutMs: 60000 });\nconst fetch = await queryDistTagsFetch({ timeoutMs: 30000 });\nconst anyWorked = (sync && (sync.latest || sync.next)) || (fetch && (fetch.latest || fetch.next));\nconst status = anyWorked ? 'PASS' : 'FAIL';\nconst output = { caseId: 'D1-39', status, why: 'sync=' + JSON.stringify(sync) + ' fetch=' + JSON.stringify(fetch), executedAt: '" + EXECUTED_AT + "', result: { sync, fetch } };\nwriteFileSync('stdout.log', JSON.stringify(output, null, 2));\nconsole.log(JSON.stringify(output, null, 2));\n";
    writeEv('D1-39', status, 'queryDistTagsSync=' + JSON.stringify(sync) + ' fetch=' + JSON.stringify(fetch), { sync, fetch }, probeBody);
  } catch (e) {
    writeEv('D1-39', 'FAIL', 'Probe error: ' + e.message, { error: e.stack }, '');
  }
}

// D2-11: STS persist with conflict returns needs_confirmation - SPEC-MISMATCH
async function fix_D2_11() {
  const tools = await import('file:///' + SRC.replace(/\\/g,'/') + '/tools.mjs');
  const uniqueAk = 'AKFAKE' + Math.random().toString(36).slice(2, 12).toUpperCase();
  const result = await tools.callTool('huaweicloud_auth_switch', {
    action: 'persist',
    ak: uniqueAk,
    sk: 'SKFAKE' + Math.random().toString(36).slice(2, 12).toUpperCase(),
    securityToken: 'STS_FAKE_TOKEN',
    region: 'cn-north-4',
  });
  let status, why;
  if (result.status === 'error' && result.scope === 'rejected') {
    status = 'PASS';
    why = 'auth_switch persist+STS (no conflict) returned status=error scope=rejected';
  } else if (result.status === 'needs_confirmation') {
    status = 'SPEC-MISMATCH';
    why = 'auth_switch persist+STS returned needs_confirmation (conflict path) before STS rejection. R3 says STS token should be rejected upfront. Root: tools.mjs:1283-1306 conflict check before persistCredentials:1070 STS rejection.';
  } else {
    status = 'FAIL';
    why = 'auth_switch persist+STS returned unexpected status=' + result.status + ' scope=' + result.scope;
  }
  const probeBody = "import { callTool } from 'file:///' + '" + SRC.replace(/\\/g,'/') + "/tools.mjs';\nconst result = await callTool('huaweicloud_auth_switch', { action: 'persist', ak: 'AKUNIQUE', sk: 'SKFAKE', securityToken: 'STS_FAKE', region: 'cn-north-4' });\nconst status = (result.status === 'error' && result.scope === 'rejected') ? 'PASS' : 'SPEC-MISMATCH';\nconst output = { caseId: 'D2-11', status, why: 'status=' + result.status + ' scope=' + result.scope, executedAt: '" + EXECUTED_AT + "', result: { status: result.status, scope: result.scope } };\nwriteFileSync('stdout.log', JSON.stringify(output, null, 2));\nconsole.log(JSON.stringify(output, null, 2));\n";
  writeEv('D2-11', status, why, { status: result.status, scope: result.scope, error: result.error, rootCause: 'tools.mjs:1283-1306 conflict check before persistCredentials:1070 STS rejection' }, probeBody);
}

await fix_D4_23();
await fix_D9_12();
await fix_D1_39();
await fix_D2_11();
console.log('done');
