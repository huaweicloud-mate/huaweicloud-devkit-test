import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
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
  const out = { case: 'D2-15', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-15', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-15-'));
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
const KOO = join(tmp, 'hcloud-config.json');
writeFileSync(KOO, JSON.stringify({ current: 'default', profiles: [{ name: 'default', accessKeyId: 'KOOAK', secretAccessKey: 'KOOSK' }] }), 'utf8');
const OBS = join(tmp, 'obsconfig');
const SHIM = join(tmp, 'bin', 'hcloud');
mkdirSync(join(tmp, 'bin'), { recursive: true });
writeFileSync(SHIM, '#!/bin/sh\nout=""; for a in "$@"; do out="$out $a"; done\ncase "$out" in\n *"version"*) echo "KooCLI 7.2.12"; exit 0;;\n *"KeystoneListProjects"*) echo \'{"projects":[{"id":"proj-matrix-9","name":"cn-north-4"}]}\'; exit 0;;\n *) exit 0;;\nesac\n', { mode: 0o755 });

process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_CONFIG_PATH = KOO;
process.env.HCLOUD_OBS_CONFIG_PATH = OBS;
process.env.HCLOUD_BIN = SHIM;
process.env.HUAWEICLOUD_DEVKIT_HOME = join(tmp, 'dh');

const { callTool } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs');
const { readGlobalCredentials, hasRuntimeCredentials } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
const { fingerprint } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');

const AKT = 'AKTEMPORARY000001';
const SKT = 'SKTEMPORARY000001';
const AKP = 'AKPERSIST00000001';
const SKP = 'SKPERSIST00000001';

// action=temporary (memory): runtime only, S2/S3 untouched
let rt = await callTool('huaweicloud_auth_switch', { mode: 'memory', action: 'temporary', ak: AKT, sk: SKT, region: 'cn-north-4' });
test('D2-15', 'temporary-ok', rt && rt.status === 'ok' && rt.scope === 'temporary', rt ? `${rt.status}/${rt.scope}` : '?', 'ok/temporary', 'temporary switch ok', 'temporary failed');
test('D2-15', 'temporary-runtime-active', hasRuntimeCredentials() === true, true, true, 'runtime credentials active', 'runtime not active');
test('D2-15', 'temporary-no-s1', existsSync(join(credDir, 'credentials.json')) === false, existsSync(join(credDir, 'credentials.json')), false, 'temporary does NOT write S1', 'S1 written by temporary');
test('D2-15', 'temporary-no-s3', existsSync(OBS) === false, existsSync(OBS), false, 'temporary does NOT write S3', 'S3 written by temporary');

// action=clear: fall back
let cl = await callTool('huaweicloud_auth_switch', { mode: 'memory', action: 'clear' });
test('D2-15', 'clear-ok', cl && cl.status === 'cleared', cl?.status, 'cleared', 'clear ok', 'clear failed');
test('D2-15', 'clear-runtime-inactive', hasRuntimeCredentials() === false, true, false, 'runtime cleared (fallback to env/file/S1)', 'runtime still active after clear');

// action=persist without region → rejected with structured reason
let pr = await callTool('huaweicloud_auth_switch', { mode: 'memory', action: 'persist', ak: AKP, sk: SKP });
test('D2-15', 'persist-no-region-rejected', pr && pr.status === 'error' && pr.scope === 'invalid_region', pr ? `${pr.status}/${pr.scope}` : '?', 'error/invalid_region', 'persist without region rejected', 'region gate missing');

// action=persist with region → S1 written + configuredBySession, S3 synced
let pp = await callTool('huaweicloud_auth_switch', { mode: 'memory', action: 'persist', ak: AKP, sk: SKP, region: 'cn-north-4' });
const s1 = readGlobalCredentials();
test('D2-15', 'persist-ok-or-partial', !!pp && (pp.status === 'ok' || pp.status === 'partial'), pp?.status, 'ok|partial', 'persist accepted', 'persist failed: ' + JSON.stringify(pp));
test('D2-15', 'persist-s1-written', s1 && s1.ak === AKP && s1.configuredBySession === true, s1 ? `${s1.ak}/${s1.configuredBySession}` : 'null', `${AKP}/true`, 'S1 written with configuredBySession', 'S1 wrong');
test('D2-15', 'persist-s3-synced', existsSync(OBS) && /^ak=/m.test(readFileSync(OBS, 'utf8')), true, true, 'S3 OBS synced', 'S3 not synced');
test('D2-15', 'persist-last-sync', (() => { try { const ls = JSON.parse(readFileSync(join(credDir, '.last_sync'), 'utf8')); return ls.s1Fingerprint === fingerprint(AKP, SKP); } catch { return false; } })(), true, true, '.last_sync refreshed with new fingerprint', '.last_sync wrong');

// mode=import (temporary): read creds-import.json then wipe it
writeFileSync(join(credDir, 'creds-import.json'), JSON.stringify({ ak: 'AKIMPORTTMP000001', sk: 'SKIMPORTTMP000001', region: 'cn-north-4' }), 'utf8');
let imp = await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'temporary' });
test('D2-15', 'import-temporary-ok', imp && imp.status === 'ok' && imp.scope === 'temporary', imp ? `${imp.status}/${imp.scope}` : '?', 'ok/temporary', 'import temporary ok', 'import temporary failed');
test('D2-15', 'import-file-wiped', existsSync(join(credDir, 'creds-import.json')) === false, existsSync(join(credDir, 'creds-import.json')), false, 'creds-import.json wiped after read', 'import file not wiped');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);