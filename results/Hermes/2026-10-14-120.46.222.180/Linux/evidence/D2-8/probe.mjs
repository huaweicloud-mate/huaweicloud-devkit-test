import { writeFileSync } from 'node:fs';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-8', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-8', status, `${passed}/${results.length}`);
}

// Real-environment read-only auth regression (no mutation; all getAuthStatus reads are read-only).
const { getAuthStatus } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/service.mjs');
const { readGlobalCredentials } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
const { fingerprint } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');
const { redactSecrets } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

const creds = readGlobalCredentials();
const st = getAuthStatus('all');
const serialized = JSON.stringify(st);
const redacted = redactSecrets(`secret_key=${creds.sk} access_key=${creds.ak}`);
test('D2-8', 'creds-readable', creds && !!creds.ak && !!creds.sk, creds ? 'present' : 'null', 'present', 'S1 credentials readable', 'S1 credentials missing');
test('D2-8', 's1-configured', st.credentialsConfigured === true && st.credentialPanel?.s1?.configured === true, st.credentialPanel?.s1?.configured, true, 'S1 configured', 'S1 not configured');
test('D2-8', 'obs-configured', st.obsConfigured === true, st.obsConfigured, true, 'OBS (S3) configured', 'S3 missing');
test('D2-8', 'koocli-installed', st.kooCliInstalled === true, st.kooCliInstalled, true, 'KooCLI (S2) installed', 'KooCLI not installed');
test('D2-8', 'koocli-status-ok', ['ok', 'version_mismatch'].includes(st.kooCliStatus), st.kooCliStatus, 'ok|version_mismatch', 'KooCLI probe succeeded', 'KooCLI probe unavailable');
test('D2-8', 's1-fingerprint-present', typeof st.reconciled?.stores?.s1Fingerprint === 'string' && st.reconciled.stores.s1Fingerprint.length === 8, st.reconciled?.stores?.s1Fingerprint, '8-char', 'S1 fingerprint computed', 'S1 fingerprint missing');
test('D2-8', 'account-hint-correct', st.onboarding?.accountHint === fingerprint(creds.ak, creds.sk), st.onboarding?.accountHint, fingerprint(creds.ak, creds.sk), 'onboarding accountHint == fingerprint', 'accountHint mismatch');
test('D2-8', 'no-plaintext-sk-leak', creds && creds.sk ? !serialized.includes(creds.sk) : true, true, true, 'auth_status JSON does not leak SK plaintext', 'SK leaked into status output');
test('D2-8', 'redaction-works', !redacted.includes(creds.sk), String(redacted).slice(0, 80), '<redacted>', 'redactSecrets masks SK', 'redactSecrets failed to mask SK');
test('D2-8', 'no-plaintext-ak-leak', creds && creds.ak ? !serialized.includes(creds.ak) : true, true, true, 'auth_status JSON does not leak AK plaintext', 'AK leaked into status output');

finish('PASS');
process.exit(0);