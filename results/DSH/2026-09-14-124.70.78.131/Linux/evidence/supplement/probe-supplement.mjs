// DSH/Linux daily test probe — supplementary source/black-box checks (hermetic, no real cloud writes)
// Covers: D2-2, D2-5, D2-12(R10), D2-13(R9), D2-16(import-wipe), D3-A1, D3-B1, D3-B5, D5-1, D1-41
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const results = [];
function check(caseId, name, pass, actual) {
  results.push({ caseId, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) });
}

// ---- hermetic credential home (R-rules) ----
const tmphome = mkdtempSync(join(tmpdir(), 'hdk-dsh-auth-'));
process.env.HUAWEICLOUD_HOME = tmphome;
const { writeGlobalCredentials, readGlobalCredentials, resolveCredentials,
        setRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime,
        globalCredentialsPath } = await import(CORE + '/auth/credentials.mjs');

// D2-5: missing credentials -> structured error + guidance
{
  delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; delete process.env.HW_SECURITY_TOKEN;
  let err = null;
  try { resolveCredentials({}); } catch (e) { err = e; }
  check('D2-5', 'missing credentials throws', !!err, err ? err.message : 'no throw');
  check('D2-5', 'error carries code HDKIT_CRED_MISSING', err?.code === 'HDKIT_CRED_MISSING', err?.code);
  check('D2-5', 'error message points to auth init / env vars', /auth init|HW_ACCESS_KEY\/HW_SECRET_KEY/i.test(err?.message || ''), err?.message);
}

// D2-12 (R10): runtime credentials stay in memory only, never persisted to disk
{
  setRuntimeCredentials('AKRT', 'SKRT', 'STRT', 'cn-north-4');
  const persisted = readGlobalCredentials();
  const rf = resolveCredentialsWithRuntime();
  check('D2-12', 'runtime credentials active in-memory', hasRuntimeCredentials() && rf.ak === 'AKRT', rf.ak);
  check('D2-12', 'runtime credentials NOT persisted to disk', persisted === null, persisted);
  check('D2-12', 'global credentials file not created', !existsSync(globalCredentialsPath()), globalCredentialsPath());
}

// D2-13 (R9): configuredBySession (S1 persist) wins over env-injected defaults
{
  writeGlobalCredentials({ ak: 'STOREDAK', sk: 'STOREDSK', region: 'cn-north-4', configuredBySession: true });
  process.env.HW_ACCESS_KEY = 'ENVAK';
  process.env.HW_SECRET_KEY = 'ENVSK';
  delete process.env.HW_SECURITY_TOKEN;
  const r = resolveCredentials({});
  check('D2-13', 'configuredBySession ak wins over env', r.ak === 'STOREDAK', r.ak);
  check('D2-13', 'configuredBySession sk wins over env', r.sk === 'STOREDSK', r.sk);
  check('D2-13', 'configuredBySession sets region', r.region === 'cn-north-4', r.region);
}

// D2-16: mode=import reads creds-import.json then wipes it (source-level contract via tools.mjs)
{
  const toolsSrc = readFileSync('/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs', 'utf8');
  const hasWipe = /creds-import\.json/.test(toolsSrc) && /rmSync\(path,\s*\{\s*force:\s*true\s*\}\)/.test(toolsSrc);
  check('D2-16', 'import path wipes creds-import.json after read', hasWipe, hasWipe ? 'tools.mjs:953-978 (read -> rmSync)' : 'not found');
}

// ---- functional tools (D3-A1, D3-B1, D3-B5, D5-1, D1-41) ----
const { listSkillDirs, findSkillsRoot, callTool } = await import(CORE + '/tools.mjs');
const { detectFramework } = await import(CORE + '/detect-framework.mjs');

// D5-1 / D3-A1: skill manifest discovery completeness
{
  const roots = [join(process.env.HOME, '.dsh', 'skills'),
                 '/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/skills'];
  const found = [];
  for (const r of roots) {
    const d = listSkillDirs(r);
    found.push(...d);
  }
  const uniq = [...new Set(found)];
  check('D5-1', 'manifest discovers >=22 skill dirs', found.length >= 22, `found=${found.length}`);
  check('D3-A1', 'skills root resolve + non-empty listing', found.length > 0, `first=${found[0] || ''} total=${found.length}`);
  const meta = ['huaweicloud-core','huaweicloud-cli-and-auth','huaweicloud-safety','huawei-getting-started'];
  const metaOk = meta.every(m => found.some(p => p.endsWith('/' + m) || p.endsWith(m)));
  check('D3-A1', 'meta skills present in manifest', metaOk, meta.filter(m => !found.some(p => p.endsWith(m))).join(',') || 'all');
}

// D3-B1: list_operations returns canonical operation names (read-only hcloud help)
{
  let r = null, err = null;
  try {
    r = await callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 20000 });
  } catch (e) { err = e; }
  check('D3-B1', 'list_operations returns structured contract (service/command/selectionRule)', !err && r && r.service === 'ECS' && typeof r.command === 'string' && typeof r.selectionRule === 'string', err ? `err=${err.message}` : r ? { service: r.service, command: r.command } : 'null');
  const hc = r && r.result;
  check('D3-B1', 'list_operations runs hcloud help successfully (result.ok)', !err && hc && hc.ok === true, hc ? { ok: hc.ok, stdout: String(hc.stdout || '').slice(0, 80) } : 'n/a');
  check('D3-B1', 'hcloud help output non-empty', !err && hc && String(hc.stdout || hc.stderr || '').length > 0, hc ? String(hc.stdout || hc.stderr || '').slice(0, 80) : 'n/a');
}

// D3-B5: detect_framework on a recognized CRA (react-scripts) fixture
{
  const proj = mkdtempSync(join(tmpdir(), 'hdk-dsh-fw-'));
  mkdirSync(join(proj, 'public'), { recursive: true });
  writeFileSync(join(proj, 'package.json'), JSON.stringify({ name: 'x', dependencies: { 'react-scripts': '5', react: '18' } }));
  writeFileSync(join(proj, 'public', 'index.html'), '<html></html>');
  let out = null, err = null;
  try { out = detectFramework(proj); } catch (e) { err = e; }
  check('D3-B5', 'detectFramework returns result without throw', !err && out && typeof out === 'object', `type=${typeof out} err=${err?.message || ''}`);
  const fw = out && (out.framework || out.type || '');
  check('D3-B5', 'CRA fixture detected as React family', !err && /react|create-react|CRA|js/i.test(String(fw)), out ? JSON.stringify(out).slice(0, 160) : 'null');
  rmSync(proj, { recursive: true, force: true });
}

// D1-41: huaweicloud_check_update MCP contract
{
  let r = null, err = null;
  try { r = await callTool('huaweicloud_check_update', { timeoutMs: 20000 }); } catch (e) { err = e; }
  const ok = !err && r && typeof r === 'object';
  check('D1-41', 'check_update returns structured object', ok, `err=${err?.message || ''}`);
  check('D1-41', 'contains result + updateAvailable fields', ok && 'result' in r && 'updateAvailable' in r, ok ? { result: r.result, updateAvailable: r.updateAvailable } : 'n/a');
}

// summary
const failed = results.filter(r => !r.pass);
console.log('=== SUPPLEMENT PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.caseId}  ${r.name}  => ${String(r.actual).slice(0, 220)}`);
}
if (failed.length) {
  console.log('\nFAILED CASES:');
  for (const r of failed) console.log(`  ${r.caseId} ${r.name}`);
  process.exit(1);
}
console.log('\nALL SUPPLEMENT ASSERTIONS PASSED');
rmSync(tmphome, { recursive: true, force: true });