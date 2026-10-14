import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-22', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-22', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-22-'));
const CAK = 'CAKCODEARTS0000001';
const CSK = 'CSKCODEARTS0000001';
const emptyHome = join(tmp, 'emptyhome');
mkdirSync(join(emptyHome, '.config', 'huaweicloud'), { recursive: true });

// CodeArts-style mcp_settings.json with injected env creds
const caDir = join(tmp, 'codearts');
mkdirSync(join(caDir, '.codeartsdoer', 'mcp'), { recursive: true });
writeFileSync(join(caDir, '.codeartsdoer', 'mcp', 'mcp_settings.json'), JSON.stringify({
  mcpServers: {
    'huaweicloud-devkit': {
      env: { HW_ACCESS_KEY: CAK, HW_SECRET_KEY: CSK, HW_SECURITY_TOKEN: '', HW_REGION: 'cn-north-4' },
    },
  },
}), 'utf8');

process.chdir(caDir);
process.env.CODEARTS_PROJECT_DIR = caDir;
process.env.HUAWEICLOUD_HOME = emptyHome;

const creds = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');

const ca = creds.readCodeArtsCredentials();
test('D2-22', 'readCodeArtsCredentials', ca && ca.ak === CAK && ca.sk === CSK, ca ? `${ca.ak}/${ca.region}` : 'null', `${CAK}/cn-north-4`, 'readCodeArtsCredentials reads injected creds', 'codearts creds not read');

const resolved = creds.resolveCredentials();
test('D2-22', 'codearts-branch-used', resolved && resolved.ak === CAK && resolved.sk === CSK, resolved ? resolved.ak : 'null', CAK, 'resolveCredentials adopts CodeArts creds (S1/env empty)', 'codearts branch not used');

// Non-CodeArts context → nothing injected → structured missing error (falls to S1/env)
const plainDir = join(tmp, 'plain');
mkdirSync(plainDir, { recursive: true });
process.chdir(plainDir);
process.env.CODEARTS_PROJECT_DIR = '';
let err = null;
try { creds.resolveCredentials(); } catch (e) { err = e; }
test('D2-22', 'non-codearts-falls-through', err && err.code === 'HDKIT_CRED_MISSING', err?.code, 'HDKIT_CRED_MISSING', 'non-CodeArts falls through to S1/env (missing)', 'non-codearts path misbehaved');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);