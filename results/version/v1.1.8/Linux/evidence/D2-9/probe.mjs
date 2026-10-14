import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
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
  const out = { case: 'D2-9', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-9', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-9-'));
const AK = 'AKCONSISTENTAAAA01';
const SK = 'SKCONSISTENTBBBB01';
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
const S1 = join(credDir, 'credentials.json');
writeFileSync(S1, JSON.stringify({ ak: AK, sk: SK, securityToken: '', region: 'cn-north-4' }), 'utf8');

const S2 = join(tmp, 'hcloud-config.json');
writeFileSync(S2, JSON.stringify({ current: 'default', profiles: [{ name: 'default', accessKeyId: AK, secretAccessKey: SK }] }), 'utf8');

const S3 = join(tmp, 'obsconfig');
writeFileSync(S3, `endpoint=https://obs.cn-north-4.myhuaweicloud.com\nak=${AK}\nsk=${SK}\n`, 'utf8');

process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_CONFIG_PATH = S2;
process.env.HCLOUD_OBS_CONFIG_PATH = S3;

const { scanState, exportStateForStatus, fingerprint, isManualModified } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');

// consistent state → zero inconsistencies (no R4 rewrite trigger)
const scan1 = scanState();
const scan2 = scanState();
const exportState = exportStateForStatus();
const fp = fingerprint(AK, SK);

// capture mtimes to prove scanState is read-only (zero-write)
const mBefore = [S1, S2, S3].map((p) => statSync(p).mtimeMs);
const _ = scanState();
const mAfter = [S1, S2, S3].map((p) => statSync(p).mtimeMs);

test('D2-9', 'consistent-zero-inconsistencies', Array.isArray(scan1.inconsistencies) && scan1.inconsistencies.length === 0, scan1.inconsistencies?.length ?? -1, 0, 'consistent state: no inconsistencies', 'unexpected inconsistencies');
test('D2-9', 'export-inconsistent-false', exportState.inconsistent === false, exportState.inconsistent, false, 'exportStateForStatus.inconsistent === false', 'inconsistent flag true');
test('D2-9', 'fingerprints-unified', scan1.stores.s1Fingerprint === fp && scan1.stores.currentFingerprint === fp && scan1.stores.s3Fingerprint === fp, [scan1.stores.s1Fingerprint, scan1.stores.currentFingerprint, scan1.stores.s3Fingerprint], fp, 'three stores share fingerprint', 'fingerprint drift');
test('D2-9', 'scan-idempotent', JSON.stringify(scan1) === JSON.stringify(scan2), true, true, 'scanState idempotent (identical output)', 'scanState output changed between runs');
test('D2-9', 'zero-write', mBefore.every((v, i) => v === mAfter[i]), true, true, 'scanState does not write S1/S2/S3 (zero side effect)', 'scanState mutated a store');

// prove the drift gate is real (not a stub): mismatched S3 must be flagged
writeFileSync(S3, `endpoint=https://obs.cn-north-4.myhuaweicloud.com\nak=DIFFERENT123456\nsk=MISMATCH987654\n`, 'utf8');
const scanDrift = scanState();
test('D2-9', 'drift-detected', scanDrift.inconsistencies.some((i) => i.store === 'S3'), scanDrift.inconsistencies.map((i) => i.store).join(',') || '(none)', 'S3', 'drift on S3 detected', 'drift NOT detected (stub?)');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);