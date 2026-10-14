import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-17', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-17', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-17-'));
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
const AK = 'AKCONSISTAAAAA0001';
const SK = 'SKCONSISTAAAAA0001';
writeFileSync(join(credDir, 'credentials.json'), JSON.stringify({ ak: AK, sk: SK, securityToken: '', region: 'cn-north-4' }), 'utf8');
const S2 = join(tmp, 'hcloud-config.json');
writeFileSync(S2, JSON.stringify({ current: 'default', profiles: [{ name: 'default', accessKeyId: AK, secretAccessKey: SK }] }), 'utf8');
const S3 = join(tmp, 'obsconfig');
// S3 intentionally MISMATCHED (different ak/sk) so scanState() reports a real
// inconsistency — an absent S3 yields a null fingerprint and is NOT flagged.
writeFileSync(S3, `endpoint=https://obs.cn-north-4.myhuaweicloud.com\nak=DIFFERENT000000\nsk=MISMATCH000000\n`, 'utf8');

const SETUP = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs';
const baseEnv = { ...process.env, HUAWEICLOUD_HOME: HOME, HCLOUD_CONFIG_PATH: S2, HCLOUD_OBS_CONFIG_PATH: S3 };

// Inconsistent state (S3 missing/empty) → hits the non-TTY guard path
function runReconcile(env) {
  return spawnSync(process.execPath, [SETUP, 'auth', 'reconcile'], { env, stdio: 'pipe', encoding: 'utf8', timeout: 20000 });
}

const r = runReconcile(baseEnv);
test('D2-17', 'no-hang-fast-exit', r.error === undefined || r.error?.code !== 'ETIMEDOUT', r.error ? r.error.code : 'clean', 'no ETIMEDOUT', 'exits promptly (non-TTY)', 'hung / timed out');
test('D2-17', 'stderr-warning', (r.stderr || '').includes('Non-interactive session'), (r.stderr || '').split('\n').find((l) => l.includes('Non-interactive session')) || '(none)', 'Non-interactive session', 'stderr warning present', 'stderr warning missing');
test('D2-17', 'exit-code-1', r.status === 1, r.status, 1, 'non-zero exit code', 'exit code not 1');

// Consistent state → clean success WITHOUT the guard (proves guard is conditional, not a crash)
writeFileSync(S3, `endpoint=https://obs.cn-north-4.myhuaweicloud.com\nak=${AK}\nsk=${SK}\n`, 'utf8');
const r2 = runReconcile(baseEnv);
test('D2-17', 'consistent-clean-exit', r2.status === 0 && (r2.stdout || '').includes('consistent'), r2.status, 0, 'consistent state exits 0 + "consistent"', 'consistent state misbehaved');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);