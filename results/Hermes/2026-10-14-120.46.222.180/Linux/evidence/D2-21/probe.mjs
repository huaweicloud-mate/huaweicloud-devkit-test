import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
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
  const out = { case: 'D2-21', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-21', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-21-'));
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
const OLD_AK = 'AKOLDROTATE0000001';
const OLD_SK = 'SKOLDROTATE0000001';
const NEW_AK = 'AKNEWROTATE0000001';
const NEW_SK = 'SKNEWROTATE0000001';
const S1 = join(credDir, 'credentials.json');
const S2 = join(tmp, 'hcloud-config.json');
const S3 = join(tmp, 'obsconfig');
writeFileSync(S1, JSON.stringify({ ak: OLD_AK, sk: OLD_SK, securityToken: '', region: 'cn-north-4' }), 'utf8');
writeFileSync(S2, JSON.stringify({ current: 'default', profiles: [{ name: 'default', accessKeyId: OLD_AK, secretAccessKey: OLD_SK }] }), 'utf8');
writeFileSync(S3, `endpoint=https://obs.cn-north-4.myhuaweicloud.com\nak=${OLD_AK}\nsk=${OLD_SK}\n`, 'utf8');

process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_CONFIG_PATH = S2;
process.env.HCLOUD_OBS_CONFIG_PATH = S3;

const { fingerprint, scanState } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');
const { writeObsConfig, writeLastSync } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');

const F1 = fingerprint(OLD_AK, OLD_SK);
const F2 = fingerprint(NEW_AK, NEW_SK);

test('D2-21', 'fingerprint-f1-8hex', typeof F1 === 'string' && F1.length === 8 && /^[0-9a-f]+$/.test(F1), F1, '8-hex', 'F1 = sha256(ak+sk)[:8]', 'F1 malformed');
test('D2-21', 'fingerprint-rotation-changes', F1 !== F2, `${F1} -> ${F2}`, 'different', 'rotation changes fingerprint', 'fingerprint unchanged after rotation');

// Before rotation: all three stores agree on F1
const before = scanState();
test('D2-21', 'before-rotation-consistent', before.inconsistencies.length === 0 && before.stores.s1Fingerprint === F1 && before.stores.currentFingerprint === F1 && before.stores.s3Fingerprint === F1, [before.stores.s1Fingerprint, before.stores.currentFingerprint, before.stores.s3Fingerprint], F1, 'pre-rotation: all F1, no inconsistency', 'pre-rotation drift');

// Rotate S1 → drift must be detected on S2 and S3
writeFileSync(S1, JSON.stringify({ ak: NEW_AK, sk: NEW_SK, securityToken: '', region: 'cn-north-4' }), 'utf8');
const after = scanState();
const driftStores = after.inconsistencies.map((i) => i.store);
test('D2-21', 'rotation-drift-detected', after.stores.s1Fingerprint === F2 && driftStores.includes('S2-current') && driftStores.includes('S3'), `${after.stores.s1Fingerprint} drifts=${driftStores.join(',')}`, `F2 + S2-current,S3`, 'post-rotation drift flagged on S2/S3', 'drift NOT flagged');

// Propagation: writeObsConfig writes NEW creds to S3; writeLastSync records F2 marker
writeObsConfig({ ak: NEW_AK, sk: NEW_SK, region: 'cn-north-4' });
writeLastSync({ kooCliProfile: 'default', s1Fingerprint: F2 });
const propagated = scanState();
test('D2-21', 's3-propagates-f2', propagated.stores.s3Fingerprint === F2, propagated.stores.s3Fingerprint, F2, 'S3 propagates to F2', 'S3 still old fingerprint');
test('D2-21', 'last-sync-marker-f2', (() => { try { return JSON.parse(readFileSync(join(credDir, '.last_sync'), 'utf8')).s1Fingerprint === F2; } catch { return false; } })(), true, true, 'writeLastSync records F2', '.last_sync marker wrong');

rmSync(tmp, { recursive: true, force: true });
// True-cloud portion (real IAM AK/SK rotation + 30s polling of 3 stores + read-only API 200)
// cannot be executed: rotating a live account credential would break the shared
// admin account used by the rest of the suite (violates no-mutate-credentials /
// no-real-cloud-create constraint). Source-level fingerprint + drift + propagation
// verification above is the safe, faithful substitute.
finish('BLOCKED', {
  blockedReason: '真云 IAM 凭证轮换 + 30s 三端指纹轮询 + 只读 API 返回 200 无法安全执行：会轮换共享管理账号凭证、触碰真云资源（违反"不破坏凭证文件 / 不真云建删"约束）。已源码级验证指纹算法、轮换漂移检测与传播标记（见 results）。',
});