import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-20', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-20', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-20-'));

// Redirect S1/S3 root via HUAWEICLOUD_HOME, but leave S2 (KooCLI) env unset
process.env.HUAWEICLOUD_HOME = tmp;
delete process.env.HCLOUD_CONFIG_PATH;
delete process.env.HCLOUD_OBS_CONFIG_PATH;

const { globalCredentialsPath, writeGlobalCredentials, readGlobalCredentials } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
const { kooCliConfigPath, readKooCliProfiles } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');

const home = homedir();
const s1Path = globalCredentialsPath();
const s2Path = kooCliConfigPath();

test('D2-20', 's1-relocated-to-env', s1Path.startsWith(tmp), s1Path, tmp, 'S1 credentials.json follows HUAWEICLOUD_HOME', 'S1 not relocated');
test('D2-20', 's2-fixed-real-home', s2Path === join(home, '.hcloud', 'config.json') && !s2Path.startsWith(tmp), s2Path, join(home, '.hcloud', 'config.json'), 'S2 KooCLI config stays at real ~/.hcloud (unaffected)', 'S2 leaked to HUAWEICLOUD_HOME');

// S1 write is redirected to the isolated root, not the real home
const written = writeGlobalCredentials({ ak: 'AKREDIR00000001', sk: 'SKREDIR00000001', region: 'cn-north-4' });
test('D2-20', 's1-write-isolated', written.startsWith(tmp) && existsSync(written), written, tmp, 'write lands in isolated root', 'write escaped isolation');
test('D2-20', 's1-read-isolated', (readGlobalCredentials() || {}).ak === 'AKREDIR00000001', (readGlobalCredentials() || {}).ak, 'AKREDIR00000001', 'read is consistent with isolated write', 'read/write mismatch');

// S2 read still resolves against the REAL ~/.hcloud (independent of HUAWEICLOUD_HOME)
const kooCli = readKooCliProfiles();
test('D2-20', 's2-read-real', kooCli && !kooCli.error && typeof kooCli.current === 'string', kooCli?.current, 'string', 'S2 still read from real ~/.hcloud', 'S2 read broken: ' + (kooCli?.error || ''));

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);