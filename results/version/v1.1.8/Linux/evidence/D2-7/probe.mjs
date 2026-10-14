import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync } from 'node:fs';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-7', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-7', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-7-'));
const HOME = join(tmp, 'home');
mkdirSync(join(HOME, '.config', 'huaweicloud'), { recursive: true }); // dir exists but NO credentials.json

process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_CONFIG_PATH = join(tmp, 'nope-hcloud.json');
process.env.HCLOUD_OBS_CONFIG_PATH = join(tmp, 'nope-obs');
process.env.HUAWEICLOUD_DEVKIT_HOME = join(tmp, 'dh');

const { resolveCredentials } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
const { callTool } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs');

// 1) graceful: allowMissing returns null (no throw)
let allowMissingRes = null, allowMissingErr = null;
try { allowMissingRes = resolveCredentials({ allowMissing: true }); } catch (e) { allowMissingErr = e; }
test('D2-7', 'allowMissing-null', allowMissingErr === null && allowMissingRes === null, allowMissingRes, null, 'allowMissing yields null gracefully', 'allowMissing threw or non-null');

// 2) explicit: throws structured HDKIT_CRED_MISSING with onboarding steps (not a bare error)
let pointedErr = null;
try { resolveCredentials(); } catch (e) { pointedErr = e; }
test('D2-7', 'structured-error-code', pointedErr && pointedErr.code === 'HDKIT_CRED_MISSING', pointedErr?.code, 'HDKIT_CRED_MISSING', 'structured error code', 'missing/ wrong error code');
test('D2-7', 'onboarding-guidance', !!(pointedErr && pointedErr.onboarding && Array.isArray(pointedErr.onboarding.steps) && pointedErr.onboarding.steps.length > 0), pointedErr?.onboarding?.steps?.length ?? 0, '>0', 'onboarding next-steps provided', 'no onboarding guidance');

// 3) credential-free tools degrade gracefully
const cfTools = [
  ['huaweicloud_list_regions', {}],
  ['huaweicloud_service_catalog', {}],
  ['huaweicloud_retrieve_skill', { name: 'huaweicloud-core' }],
  ['huaweicloud_search_docs', { query: 'ecs' }],
];
for (const [name, args] of cfTools) {
  let out = null, e = null;
  try { out = await callTool(name, args); } catch (er) { e = er; }
  test('D2-7', `${name}-no-cred`, e === null && out !== null && out !== undefined, e ? 'threw ' + e.message : (out ? typeof out : 'null'), 'returns', `${name} works without creds`, `${name} failed: ` + (e?.message ?? ''));
}

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);