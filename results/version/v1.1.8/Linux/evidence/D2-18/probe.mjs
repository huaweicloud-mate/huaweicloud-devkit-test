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
  const out = { case: 'D2-18', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-18', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-18-'));
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
const S1 = join(credDir, 'credentials.json');
const MARKER = join(credDir, '.last_sync');

process.env.HUAWEICLOUD_HOME = HOME;

const { isManualModified } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');

// Case 1: file exists, NO marker → treated as manual (defensive)
writeFileSync(S1, JSON.stringify({ ak: 'AKMTIMEAAA', sk: 'SKMTIMEAAA', region: 'cn-north-4' }), 'utf8');
test('D2-18', 'no-marker-manual', isManualModified(S1) === true, isManualModified(S1), true, 'no marker → manual', 'no marker misclassified');

// Case 2: marker ts strictly AFTER file mtime → NOT manual (R4 auto-rewrite path)
writeFileSync(MARKER, JSON.stringify({ ts: Date.now() + 60000 }), 'utf8'); // ts in the future
test('D2-18', 'mtime-le-marker-not-manual', isManualModified(S1) === false, isManualModified(S1), false, 'mtime <= marker → not manual (R4 rewrite ok)', 'mtime<=marker misclassified as manual');

// Case 3: marker ts in the past + re-written file → manual (R2 arbitration path)
writeFileSync(MARKER, JSON.stringify({ ts: Date.now() - 60000 }), 'utf8'); // marker 60s in the past
writeFileSync(S1, JSON.stringify({ ak: 'AKMTIMEBBB', sk: 'SKMTIMEBBB', region: 'cn-north-4' }), 'utf8'); // fresh mtime now
test('D2-18', 'mtime-gt-marker-manual', isManualModified(S1) === true, isManualModified(S1), true, 'mtime > marker → manual (R2 arbitration)', 'manual edit not detected');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);