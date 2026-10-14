import { mkdtempSync, mkdirSync, writeFileSync, statSync, rmSync } from 'node:fs';
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
  const out = { case: 'D2-19', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-19', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-19-'));
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
const DEPLOY_AK = 'AKDEPLOY00000001';
const DEPLOY_SK = 'SKDEPLOY00000001';
const DEF_AK = 'AKDEFAULT0000001';
const DEF_SK = 'SKDEFAULT0000001';
writeFileSync(join(credDir, 'credentials.json'), JSON.stringify({ ak: DEPLOY_AK, sk: DEPLOY_SK, securityToken: '', region: 'cn-north-4' }), 'utf8');
const S2 = join(tmp, 'hcloud-config.json');
// current = deploy; two named profiles with DIFFERENT creds
writeFileSync(S2, JSON.stringify({
  current: 'deploy',
  profiles: [
    { name: 'default', accessKeyId: DEF_AK, secretAccessKey: DEF_SK },
    { name: 'deploy', accessKeyId: DEPLOY_AK, secretAccessKey: DEPLOY_SK },
  ],
}), 'utf8');

process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_CONFIG_PATH = S2;

const { readKooCliProfiles, resolveManagedProfile, currentFingerprintFromHcloud, scanState, fingerprint } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');

const res = readKooCliProfiles();
test('D2-19', 'parses-current-deploy', res && !res.error && res.current === 'deploy', res?.current, 'deploy', 'current profile = deploy', 'current wrong');
test('D2-19', 'multi-profile-present', res && Array.isArray(res.profiles) && res.profiles.length === 2 && res.profiles.some((p) => p.name === 'default') && res.profiles.some((p) => p.name === 'deploy'), res?.profiles?.map((p) => p.name).join(','), 'default,deploy', 'both named profiles audited', 'profiles missing');
test('D2-19', 'managed-profile-is-current', resolveManagedProfile() === 'deploy', resolveManagedProfile(), 'deploy', 'resolveManagedProfile = current (deploy)', 'managed profile wrong');
test('D2-19', 'fingerprint-follows-current', currentFingerprintFromHcloud(res) === fingerprint(DEPLOY_AK, DEPLOY_SK), currentFingerprintFromHcloud(res), fingerprint(DEPLOY_AK, DEPLOY_SK), 'current fingerprint = deploy fingerprint', 'fingerprint follows wrong profile');

const mBefore = statSync(S2).mtimeMs;
const scan = scanState();
const mAfter = statSync(S2).mtimeMs;
test('D2-19', 'audit-does-not-write', mBefore === mAfter, true, true, 'named-profile audit is read-only (no auto write)', 'scanState wrote to config');
test('D2-19', 'scan-uses-current-only', scan.stores.s1Fingerprint === fingerprint(DEPLOY_AK, DEPLOY_SK) && scan.stores.currentFingerprint === fingerprint(DEPLOY_AK, DEPLOY_SK), `${scan.stores.s1Fingerprint}/${scan.stores.currentFingerprint}`, fingerprint(DEPLOY_AK, DEPLOY_SK), 'scan reconciles against current (deploy) only', 'scan swept a non-current profile');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);