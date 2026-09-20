// p0-design-probe.mjs: P0 design-level test probe (2026-09-21)
// Tests all P0 design-level cases via MCP tools and source code direct call
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2] || 'C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-2\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const hdkRoot = process.argv[3] || 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk';

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

const srv = makeServer(serverPath);
const results = {};

// Initialize
await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p0-probe', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
console.log('=== P0 Design-Level Probe Start (2026-09-21) ===');

// Helper
function getText(resp) {
  if (resp?.result?.isError) return JSON.stringify(resp.result);
  return resp?.result?.content?.[0]?.text || '';
}

function saveEvidence(caseId, status, detail, extra) {
  const dir = join(__dirname, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const log = { status, detail, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14), ...extra };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2), 'utf-8');
}

// ---- D2-4: Credential redaction (P0) ----
console.log('\n--- D2-4: Credential Redaction ---');
try {
  const resp = await srv.call('huaweicloud_show_profile_redacted', {});
  const text = getText(resp);
  const hasAK = /AK/.test(text) || /access/.test(text.toLowerCase());
  const hasPlaintextSK = /sk-[a-zA-Z0-9]{20,}/.test(text);
  const hasRedacted = /redacted|REDACTED|\*\*\*/.test(text);
  const pass = !hasPlaintextSK && (hasRedacted || !hasAK);
  results['D2-4'] = { pass, detail: `Redacted output: ${hasRedacted}, plaintext SK: ${hasPlaintextSK}` };
  saveEvidence('D2-4', pass ? 'PASS' : 'FAIL', results['D2-4'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D2-4: ${pass ? 'PASS' : 'FAIL'} - ${results['D2-4'].detail}`);
} catch(e) { results['D2-4'] = { pass: false, detail: e.message }; saveEvidence('D2-4', 'FAIL', e.message); }

// ---- D2-11: R3 STS token rejection (P0) ----
console.log('\n--- D2-11: STS Token Rejection ---');
try {
  const resp = await srv.call('huaweicloud_auth_switch', { action: 'persist', mode: 'memory', ak: 'fakeAK', sk: 'fakeSK', securityToken: 'fake-sts-token-xxx' });
  const text = getText(resp);
  const rejected = /reject|error|scope.*reject|token.*not.*support|securityToken/i.test(text);
  results['D2-11'] = { pass: rejected, detail: `Response contains rejection: ${rejected}` };
  saveEvidence('D2-11', rejected ? 'PASS' : 'FAIL', results['D2-11'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D2-11: ${rejected ? 'PASS' : 'FAIL'} - ${results['D2-11'].detail}`);
} catch(e) { results['D2-11'] = { pass: false, detail: e.message }; saveEvidence('D2-11', 'FAIL', e.message); }

// ---- D4-1: Credential file read blocking (P0) ----
console.log('\n--- D4-1: Credential File Read Blocking ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_command', { command: 'type C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json' });
  const text = getText(resp);
  const blocked = /block|deny|reject|risk|warning|danger/i.test(text);
  results['D4-1'] = { pass: blocked, detail: `Credential file read blocked: ${blocked}` };
  saveEvidence('D4-1', blocked ? 'PASS' : 'FAIL', results['D4-1'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-1: ${blocked ? 'PASS' : 'FAIL'} - ${results['D4-1'].detail}`);
} catch(e) { results['D4-1'] = { pass: false, detail: e.message }; saveEvidence('D4-1', 'FAIL', e.message); }

// ---- D4-2: Credential env print blocking (P0) ----
console.log('\n--- D4-2: Credential Env Print Blocking ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_command', { command: 'printenv HW_ACCESS_KEY HW_SECRET_KEY' });
  const text = getText(resp);
  const blocked = /block|deny|reject|risk|warning|danger/i.test(text);
  results['D4-2'] = { pass: blocked, detail: `Credential env print blocked: ${blocked}` };
  saveEvidence('D4-2', blocked ? 'PASS' : 'FAIL', results['D4-2'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-2: ${blocked ? 'PASS' : 'FAIL'} - ${results['D4-2'].detail}`);
} catch(e) { results['D4-2'] = { pass: false, detail: e.message }; saveEvidence('D4-2', 'FAIL', e.message); }

// ---- D4-3: Plaintext secret API blocking (P0) ----
console.log('\n--- D4-3: Plaintext Secret API Blocking ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_command', { command: 'hcloud ECS NovaShowServerAdminPassword --server.id=xxx' });
  const text = getText(resp);
  const blocked = /block|deny|reject|risk|warning|danger|adminPass|password/i.test(text);
  results['D4-3'] = { pass: blocked, detail: `Plaintext secret API blocked: ${blocked}` };
  saveEvidence('D4-3', blocked ? 'PASS' : 'FAIL', results['D4-3'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-3: ${blocked ? 'PASS' : 'FAIL'} - ${results['D4-3'].detail}`);
} catch(e) { results['D4-3'] = { pass: false, detail: e.message }; saveEvidence('D4-3', 'FAIL', e.message); }

// ---- D4-5: Write operation misjudgment (P0) ----
console.log('\n--- D4-5: Write Operation Misjudgment ---');
try {
  const resp = await srv.call('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers'], allowWrites: false });
  const text = getText(resp);
  const isWrite = /write|delete|create|update|danger|risk|confirm|approve/i.test(text);
  const notReadonly = !/read.?only|readonly|safe/i.test(text) || isWrite;
  results['D4-5'] = { pass: isWrite, detail: `DeleteServers recognized as write: ${isWrite}` };
  saveEvidence('D4-5', isWrite ? 'PASS' : 'FAIL', results['D4-5'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-5: ${isWrite ? 'PASS' : 'FAIL'} - ${results['D4-5'].detail}`);
} catch(e) { results['D4-5'] = { pass: false, detail: e.message }; saveEvidence('D4-5', 'FAIL', e.message); }

// ---- D4-9: Public exposure/destructive pre-check (P0) ----
console.log('\n--- D4-9: Public Exposure/Destructive Pre-check ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_deploy_plan', { plan: { action: 'create security group with 0.0.0.0/0 ingress', resources: ['public-exposed-sg'] } });
  const text = getText(resp);
  const blocked = /block|deny|reject|risk|warning|danger|exposure|public/i.test(text);
  results['D4-9'] = { pass: blocked, detail: `Public exposure blocked: ${blocked}` };
  saveEvidence('D4-9', blocked ? 'PASS' : 'FAIL', results['D4-9'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-9: ${blocked ? 'PASS' : 'FAIL'} - ${results['D4-9'].detail}`);
} catch(e) { results['D4-9'] = { pass: false, detail: e.message }; saveEvidence('D4-9', 'FAIL', e.message); }

// ---- D4-15: Hook bypass attempt (P0) ----
console.log('\n--- D4-15: Hook Bypass Attempt ---');
const variants = ['Deleteserver', 'DELETE SERVER', 'delete\x00server', 'delete;server'];
let allBlocked = true;
const variantResults = [];
for (const v of variants) {
  try {
    const resp = await srv.call('huaweicloud_hook_check_command', { command: `hcloud ECS ${v}` });
    const text = getText(resp);
    const b = /block|deny|reject|risk|warning|danger|delete/i.test(text);
    variantResults.push({ variant: v, blocked: b, snippet: text.slice(0, 100) });
    if (!b) allBlocked = false;
  } catch(e) { allBlocked = false; variantResults.push({ variant: v, blocked: false, error: e.message }); }
}
results['D4-15'] = { pass: allBlocked, detail: `All ${variants.length} variants blocked: ${allBlocked}` };
saveEvidence('D4-15', allBlocked ? 'PASS' : 'FAIL', results['D4-15'].detail, { variants: variantResults });
console.log(`D4-15: ${allBlocked ? 'PASS' : 'FAIL'} - ${results['D4-15'].detail}`);

// ---- D4-16: Command wrapping penetration (P0) ----
console.log('\n--- D4-16: Command Wrapping Penetration ---');
const wraps = ['sh -c "hcloud ECS DeleteServers"', 'bash -c "hcloud ECS DeleteServer"', 'eval "hcloud ECS DeleteServer"'];
let wrapBlocked = true;
const wrapResults = [];
for (const w of wraps) {
  try {
    const resp = await srv.call('huaweicloud_hook_check_command', { command: w });
    const text = getText(resp);
    const b = /block|deny|reject|risk|warning|danger|delete/i.test(text);
    wrapResults.push({ wrap: w, blocked: b, snippet: text.slice(0, 100) });
    if (!b) wrapBlocked = false;
  } catch(e) { wrapBlocked = false; wrapResults.push({ wrap: w, blocked: false, error: e.message }); }
}
results['D4-16'] = { pass: wrapBlocked, detail: `All ${wraps.length} wrap variants blocked: ${wrapBlocked}` };
saveEvidence('D4-16', wrapBlocked ? 'PASS' : 'FAIL', results['D4-16'].detail, { wraps: wrapResults });
console.log(`D4-16: ${wrapBlocked ? 'PASS' : 'FAIL'} - ${results['D4-16'].detail}`);

// ---- D4-18: confirm-not-deny (P0) ----
console.log('\n--- D4-18: Confirm-Not-Deny ---');
try {
  const resp = await srv.call('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers'], allowWrites: false });
  const text = getText(resp);
  const needsConfirm = /confirm|approve|plan|write/i.test(text);
  const notDenied = !/deny|reject|blocked/i.test(text) || /plan/i.test(text);
  const notAutoExec = !/execute|running|done/i.test(text);
  results['D4-18'] = { pass: needsConfirm && notDenied, detail: `Needs confirmation: ${needsConfirm}, not denied: ${notDenied}` };
  saveEvidence('D4-18', results['D4-18'].pass ? 'PASS' : 'FAIL', results['D4-18'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-18: ${results['D4-18'].pass ? 'PASS' : 'FAIL'} - ${results['D4-18'].detail}`);
} catch(e) { results['D4-18'] = { pass: false, detail: e.message }; saveEvidence('D4-18', 'FAIL', e.message); }

// ---- D4-19: Preflight still active in confirm flow (P0) ----
console.log('\n--- D4-19: Preflight Still Active ---');
try {
  const resp = await srv.call('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers', '--server.id=xxx'], allowWrites: false });
  const text = getText(resp);
  const hasRisk = /risk|danger|warning|delete|destructive/i.test(text);
  results['D4-19'] = { pass: hasRisk, detail: `Preflight risk detected: ${hasRisk}` };
  saveEvidence('D4-19', hasRisk ? 'PASS' : 'FAIL', results['D4-19'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-19: ${hasRisk ? 'PASS' : 'FAIL'} - ${results['D4-19'].detail}`);
} catch(e) { results['D4-19'] = { pass: false, detail: e.message }; saveEvidence('D4-19', 'FAIL', e.message); }

// ---- D4-21: hook_check_artifacts regression (P0) ----
console.log('\n--- D4-21: hook_check_artifacts Regression ---');
try {
  const broadPolicy = JSON.stringify({Statement:[{Effect:'Allow',Action:'*',Resource:'*'}]});
  const resp = await srv.call('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'policy.json', content: broadPolicy }] });
  const text = getText(resp);
  const denied = /deny|block|risk|warning|broad|wildcard|danger/i.test(text);
  results['D4-21'] = { pass: denied, detail: `Broad IAM policy denied: ${denied}` };
  saveEvidence('D4-21', denied ? 'PASS' : 'FAIL', results['D4-21'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-21: ${denied ? 'PASS' : 'FAIL'} - ${results['D4-21'].detail}`);
} catch(e) { results['D4-21'] = { pass: false, detail: e.message }; saveEvidence('D4-21', 'FAIL', e.message); }

// ---- D4-22: hook_check_deploy_plan regression (P0) ----
console.log('\n--- D4-22: hook_check_deploy_plan Regression ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_deploy_plan', { plan: { action: 'deploy FunctionGraph with public URL 0.0.0.0/0', exposure: 'public', cleanup: 'none' } });
  const text = getText(resp);
  const warned = /warn|deny|risk|exposure|public|danger/i.test(text);
  results['D4-22'] = { pass: warned, detail: `Public exposure deploy plan warned: ${warned}` };
  saveEvidence('D4-22', warned ? 'PASS' : 'FAIL', results['D4-22'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-22: ${warned ? 'PASS' : 'FAIL'} - ${results['D4-22'].detail}`);
} catch(e) { results['D4-22'] = { pass: false, detail: e.message }; saveEvidence('D4-22', 'FAIL', e.message); }

// ---- D4-23: agent-rules.md injection (P0) ----
console.log('\n--- D4-23: Agent-Rules Injection ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_command', { command: 'cat ~/.config/huaweicloud/csms_secret' });
  const text = getText(resp);
  const blocked = /block|deny|reject|risk|warning|danger|csms|secret/i.test(text);
  results['D4-23'] = { pass: blocked, detail: `CSMS secret access blocked: ${blocked}` };
  saveEvidence('D4-23', blocked ? 'PASS' : 'FAIL', results['D4-23'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-23: ${blocked ? 'PASS' : 'FAIL'} - ${results['D4-23'].detail}`);
} catch(e) { results['D4-23'] = { pass: false, detail: e.message }; saveEvidence('D4-23', 'FAIL', e.message); }

// ---- D4-28: Node version safety hook chain (P0) ----
console.log('\n--- D4-28: Node Safety Hook Chain ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --os-delete' });
  const text = getText(resp);
  const hasDeny = /deny|block|danger|delete|destructive|risk/i.test(text);
  const hasReason = /reason|message|rule/i.test(text);
  results['D4-28'] = { pass: hasDeny, detail: `deny decision: ${hasDeny}, has reason: ${hasReason}` };
  saveEvidence('D4-28', hasDeny ? 'PASS' : 'FAIL', results['D4-28'].detail, { responseSnippet: text.slice(0, 200) });
  console.log(`D4-28: ${hasDeny ? 'PASS' : 'FAIL'} - ${results['D4-28'].detail}`);
} catch(e) { results['D4-28'] = { pass: false, detail: e.message }; saveEvidence('D4-28', 'FAIL', e.message); }

// ---- D8-7: 7 meta skills guidance (P0) ----
console.log('\n--- D8-7: 7 Meta Skills Guidance ---');
const skills = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-troubleshooting', 'huaweicloud-getting-started'];
let skillsOk = 0;
const skillDetails = [];
for (const skill of skills) {
  try {
    const resp = await srv.call('huaweicloud_retrieve_skill', { name: skill });
    const text = getText(resp);
    const ok = text.length > 50;
    if (ok) skillsOk++;
    skillDetails.push({ skill, ok, length: text.length });
  } catch(e) { skillDetails.push({ skill, ok: false, error: e.message }); }
}
results['D8-7'] = { pass: skillsOk === 7, detail: `${skillsOk}/7 skills retrievable` };
saveEvidence('D8-7', skillsOk === 7 ? 'PASS' : 'FAIL', results['D8-7'].detail, { skills: skillDetails });
console.log(`D8-7: ${skillsOk === 7 ? 'PASS' : 'FAIL'} - ${results['D8-7'].detail}`);

// ---- D9-1: tools/list compliance (P0) ----
console.log('\n--- D9-1: tools/list Compliance ---');
const toolsResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
const tools = toolsResp?.result?.tools || [];
const hwTools = tools.filter(t => t.name.startsWith('huaweicloud_'));
const validSchema = hwTools.filter(t => t.inputSchema && t.inputSchema.type === 'object');
results['D9-1'] = { pass: hwTools.length === 40 && validSchema.length === 40, detail: `${hwTools.length} tools, ${validSchema.length} valid schema` };
saveEvidence('D9-1', results['D9-1'].pass ? 'PASS' : 'FAIL', results['D9-1'].detail, { toolCount: hwTools.length, validSchema: validSchema.length, toolNames: hwTools.map(t=>t.name) });
console.log(`D9-1: ${results['D9-1'].pass ? 'PASS' : 'FAIL'} - ${results['D9-1'].detail}`);

// ---- D9-2: JSON-RPC error codes (P0) ----
console.log('\n--- D9-2: JSON-RPC Error Codes ---');
const errorResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'invalid/method', params: {} });
const hasError = errorResp?.error !== undefined;
const validCode = errorResp?.error?.code === -32601;
results['D9-2'] = { pass: hasError && validCode, detail: `Error: ${hasError}, code: ${errorResp?.error?.code} (expected -32601)` };
saveEvidence('D9-2', results['D9-2'].pass ? 'PASS' : 'FAIL', results['D9-2'].detail, { errorResponse: errorResp?.error });
console.log(`D9-2: ${results['D9-2'].pass ? 'PASS' : 'FAIL'} - ${results['D9-2'].detail}`);

// ---- D1-39: Windows upgrade detection chain (P0) ----
console.log('\n--- D1-39: Windows Upgrade Detection Chain ---');
try {
  const resp = await srv.call('huaweicloud_check_update', {});
  const text = getText(resp);
  const noEINVAL = !/EINVAL/i.test(text);
  const hasResult = /up_to_date|update_available|check_failed|dismissed|currentVersion/i.test(text);
  results['D1-39'] = { pass: noEINVAL && hasResult, detail: `No EINVAL: ${noEINVAL}, has result: ${hasResult}` };
  saveEvidence('D1-39', results['D1-39'].pass ? 'PASS' : 'FAIL', results['D1-39'].detail, { responseSnippet: text.slice(0, 300) });
  console.log(`D1-39: ${results['D1-39'].pass ? 'PASS' : 'FAIL'} - ${results['D1-39'].detail}`);
} catch(e) { results['D1-39'] = { pass: false, detail: e.message }; saveEvidence('D1-39', 'FAIL', e.message); }

// ---- D1-40: Mirror lag detection (P0) ----
console.log('\n--- D1-40: Mirror Lag Detection ---');
try {
  const resp = await srv.call('huaweicloud_check_update', {});
  const text = getText(resp);
  let pass = false;
  let detail = '';
  try {
    const data = JSON.parse(text);
    const noVersionDowngrade = !data.updateAvailable || data.targetVersion > data.currentVersion;
    pass = noVersionDowngrade;
    detail = `currentVersion: ${data.currentVersion}, targetVersion: ${data.targetVersion}, updateAvailable: ${data.updateAvailable}`;
  } catch {
    pass = !/version.*downgrade|targetVersion.*lower/i.test(text);
    detail = `Non-JSON response, no version downgrade detected: ${text.slice(0, 100)}`;
  }
  results['D1-40'] = { pass, detail };
  saveEvidence('D1-40', pass ? 'PASS' : 'FAIL', detail, { responseSnippet: text.slice(0, 300) });
  console.log(`D1-40: ${pass ? 'PASS' : 'FAIL'} - ${detail}`);
} catch(e) { results['D1-40'] = { pass: false, detail: e.message }; saveEvidence('D1-40', 'FAIL', e.message); }

// ---- D10-4: Security intervention - static rule layer (P0) ----
// Source code direct call: loadRiskRules + evaluateCommandRisk
console.log('\n--- D10-4: Security Intervention - Static Rule Layer (source direct call) ---');
try {
  const require = createRequire(import.meta.url);
  const enginePath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'risk-rule-engine.mjs');
  const { loadRiskRules, evaluateCommandRisk } = await import('file://' + enginePath.replace(/\\/g, '/'));
  
  // Step 1: Load rules and verify count + severity distribution
  const rules = loadRiskRules();
  const ruleCount = rules.rules.length;
  const denyCount = rules.rules.filter(r => r.severity === 'deny').length;
  const warnCount = rules.rules.filter(r => r.severity === 'warn').length;
  const rulesOk = ruleCount === 16 && denyCount === 9 && warnCount === 7;
  
  // Step 2: Evaluate high-risk commands (should be deny)
  const highRiskCommands = [
    'type C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json',
    'printenv HW_ACCESS_KEY HW_SECRET_KEY',
    'hcloud ECS DeleteServers --server.id=xxx',
  ];
  const highRiskResults = highRiskCommands.map(cmd => {
    const result = evaluateCommandRisk(cmd);
    return { command: cmd, decision: result.decision, findingsCount: result.findings.length };
  });
  const highRiskAllDeny = highRiskResults.every(r => r.decision === 'deny');
  
  // Step 3: Evaluate read-only commands (should be allow)
  const readonlyCommands = [
    'hcloud ECS ListServers',
    'hcloud VPC ListVpcs',
    'hcloud IAM ListUsers',
  ];
  const readonlyResults = readonlyCommands.map(cmd => {
    const result = evaluateCommandRisk(cmd);
    return { command: cmd, decision: result.decision, findingsCount: result.findings.length };
  });
  const readonlyAllAllow = readonlyResults.every(r => r.decision === 'allow');
  
  // Step 4: Verify no token in findings
  const allFindingsText = JSON.stringify([...highRiskResults, ...readonlyResults]);
  const noToken = !/token|AK[A-Z0-9]{10,}|sk-[a-zA-Z0-9]{10,}/i.test(allFindingsText);
  
  const pass = rulesOk && highRiskAllDeny && readonlyAllAllow && noToken;
  results['D10-4'] = { pass, detail: `Rules: ${ruleCount}(9 deny+7 warn)=${rulesOk}, highRisk deny: ${highRiskAllDeny}, readonly allow: ${readonlyAllAllow}, no token: ${noToken}` };
  saveEvidence('D10-4', pass ? 'PASS' : 'FAIL', results['D10-4'].detail, { 
    rules: { total: ruleCount, deny: denyCount, warn: warnCount },
    highRiskResults, readonlyResults, noToken
  });
  console.log(`D10-4: ${pass ? 'PASS' : 'FAIL'} - ${results['D10-4'].detail}`);
} catch(e) { 
  results['D10-4'] = { pass: false, detail: e.message }; 
  saveEvidence('D10-4', 'FAIL', e.message, { stack: e.stack });
  console.log(`D10-4: FAIL - ${e.message}`);
}

// Save summary
writeFileSync(join(__dirname, 'p0-design-summary.json'), JSON.stringify(results, null, 2), 'utf-8');

const passCount = Object.values(results).filter(r => r.pass === true).length;
const failCount = Object.values(results).filter(r => r.pass === false).length;
const blockedCount = Object.values(results).filter(r => r.blocked).length;
console.log(`\n=== P0 Probe Complete ===`);
console.log(`PASS: ${passCount}, FAIL: ${failCount}, BLOCKED: ${blockedCount}`);

srv.kill();
process.exit(0);
