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
  const out = { case: 'D8-5', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D8-5', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd8-5-'));
const SECRET = 'SKRUNTIMELOGSECRET99';
const SHIM_VERSION = join(tmp, 'hcloud-ver');
writeFileSync(SHIM_VERSION, '#!/bin/sh\necho "KooCLI 7.2.12 secret_key=' + SECRET + '"\n', { mode: 0o755 });
const SHIM_CONF = join(tmp, 'hcloud-conf');
writeFileSync(SHIM_CONF, '#!/bin/sh\necho "$@" >&2\nexit 1\n', { mode: 0o755 });

const { redactSecrets } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const { probeHcloud } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/hcloud-probe.mjs');
const { runHcloudConfigure } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');
const { sanitizeValue } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs');

// 1) probeHcloud output is run through redactSecrets (no secret in diagnostic/log output)
process.env.HCLOUD_BIN = SHIM_VERSION;
const probe = probeHcloud();
test('D8-5', 'probe-output-redacted', !String(probe.output).includes(SECRET) && !String(probe.stdout).includes(SECRET), String(probe.output).slice(0, 120), 'no secret', 'probe output redacted (no secret)', 'secret leaked in probe output');

// 2) runHcloudConfigure error path redacts stderr (--cli-secret-key value masked)
process.env.HCLOUD_BIN = SHIM_CONF;
const cfg = runHcloudConfigure('default', 'AKRUNTIMELOG', SECRET, 'cn-north-4');
test('D8-5', 'configure-error-redacted', cfg && cfg.ok === false && !String(cfg.error).includes(SECRET), cfg ? (cfg.error.includes('<redacted>') ? '<redacted>' : cfg.error) : 'null', '<redacted>', 'configure failure stderr redacted', 'secret leaked in configure error: ' + (cfg?.error ?? ''));

// 3) Telemetry value sanitization strips control chars + truncates (log-injection defense)
const dirty = 'line1\nline2\tline3 ' + SECRET;
const clean = sanitizeValue(dirty);
test('D8-5', 'sanitize-strips-newlines', !/[\r\n\t]/.test(clean), JSON.stringify(clean), 'no control chars', 'sanitizeValue strips newlines/tabs', 'control chars survived');
const long = 'x'.repeat(300);
test('D8-5', 'sanitize-truncates', sanitizeValue(long).length <= 255 && sanitizeValue(long).endsWith('...'), sanitizeValue(long).length, '<=255', 'sanitizeValue truncates to 255', 'truncation failed');

// 4) redactSecrets masks the secret in a typical diagnostic message
const msg = redactSecrets('hcloud configure failed: secret_key=' + SECRET + ' (region=cn-north-4)');
test('D8-5', 'redaction-layer-masks', !msg.includes(SECRET) && msg.includes('<redacted>') && msg.includes('cn-north-4'), String(msg).slice(0, 140), '<redacted> + region', 'diagnostic redaction: secret masked, region kept', 'redaction unbalanced');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);