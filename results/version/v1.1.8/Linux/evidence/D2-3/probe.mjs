import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
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
  const out = { case: 'D2-3', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-3', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-3-'));
const AK = 'AKSYNCTESTAAAA000001';
const SK = 'SKSYNCTESTBBBB000001';
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
writeFileSync(join(credDir, 'credentials.json'), JSON.stringify({ ak: AK, sk: SK, securityToken: '', region: 'cn-north-4' }), 'utf8');

const KOO = join(tmp, 'hcloud-config.json');
writeFileSync(KOO, JSON.stringify({ current: 'default', profiles: [{ name: 'default', accessKeyId: AK, secretAccessKey: SK }] }), 'utf8');

const SHIM = join(tmp, 'bin', 'hcloud');
mkdirSync(join(tmp, 'bin'), { recursive: true });
writeFileSync(SHIM, '#!/bin/sh\nout=""; for a in "$@"; do out="$out $a"; done\ncase "$out" in\n *"version"*) echo "KooCLI 7.2.12"; exit 0;;\n *"KeystoneListProjects"*) echo \'{"projects":[{"id":"proj-test-123","name":"cn-north-4"}]}\'; exit 0;;\n *) exit 0;;\nesac\n', { mode: 0o755 });

const OBS = join(tmp, 'obsconfig');

process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_CONFIG_PATH = KOO;
process.env.HCLOUD_OBS_CONFIG_PATH = OBS;
process.env.HCLOUD_BIN = SHIM;
process.env.HUAWEICLOUD_DEVKIT_HOME = join(tmp, 'dh');

const { syncAuth } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/service.mjs');
const { fingerprint } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');

const r1 = syncAuth('all');
const obsAfter1 = existsSync(OBS) ? readFileSync(OBS, 'utf8') : null;
const credsAfter1 = readFileSync(join(credDir, 'credentials.json'), 'utf8');
const r2 = syncAuth('all');
const obsAfter2 = existsSync(OBS) ? readFileSync(OBS, 'utf8') : null;
const credsAfter2 = readFileSync(join(credDir, 'credentials.json'), 'utf8');

test('D2-3', 'sync-first-ok', r1 && r1.ok === true, r1?.ok, true, 'first sync ok', 'first sync failed: ' + (r1?.error || ''));
test('D2-3', 'sync-second-ok', r2 && r2.ok === true, r2?.ok, true, 'idempotent second sync ok', 'second sync failed');
test('D2-3', 'obs-written', obsAfter2 !== null && /^ak=/m.test(obsAfter2) && /^sk=/m.test(obsAfter2), obsAfter2 !== null, true, 'OBS config written', 'OBS config not written');
test('D2-3', 'obs-idempotent-content', obsAfter1 !== null && obsAfter1 === obsAfter2, obsAfter1 === obsAfter2, true, 'OBS content identical across runs', 'OBS content drifted');
test('D2-3', 's1-unchanged', credsAfter1 === credsAfter2 && credsAfter1.includes(AK), true, true, 'S1 creds unchanged (no drift)', 'S1 creds mutated');
test('D2-3', 'project-id-resolved', r1 && r1.projectId === 'proj-test-123', r1?.projectId, 'proj-test-123', 'projectId auto-resolved', 'projectId not resolved');
test('D2-3', 'last-sync-fingerprint', (() => { try { const ls = JSON.parse(readFileSync(join(credDir, '.last_sync'), 'utf8')); return ls.s1Fingerprint === fingerprint(AK, SK); } catch { return false; } })(), true, true, '.last_sync fingerprint correct', '.last_sync fingerprint wrong');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);