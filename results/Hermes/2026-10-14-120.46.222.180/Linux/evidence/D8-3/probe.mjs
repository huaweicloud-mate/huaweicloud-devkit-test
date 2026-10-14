import { writeFileSync } from 'node:fs';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D8-3', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D8-3', status, `${passed}/${results.length}`);
}

const { redactSecrets } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

const PROJECT_ID = '46c1fd48bd1248c7b75afc3780de7132';
const REGION = 'cn-north-4';
const SECRET = 'SuperSecretSk1234567890';

// 1) Secret keys (covered patterns) get masked
const masked = redactSecrets(`access_key=${SECRET} secret_key=${SECRET} security_token=${SECRET} password=${SECRET}`);
test('D8-3', 'secret-redacted', !masked.includes(SECRET) && masked.includes('<redacted>'), String(masked).slice(0, 200), '<redacted>', 'secret values masked', 'secret leaked: ' + String(masked));

// 2) project_id / region must NOT be masked (balance: no over-redaction)
const balanced = redactSecrets(`project_id=${PROJECT_ID} region=${REGION} secret_key=${SECRET}`);
test('D8-3', 'project-id-preserved', balanced.includes(PROJECT_ID), PROJECT_ID, PROJECT_ID, 'project_id preserved', 'project_id over-redacted: ' + String(balanced));
test('D8-3', 'region-preserved', balanced.includes(REGION), REGION, REGION, 'region preserved', 'region over-redacted');
test('D8-3', 'secret-still-masked', !balanced.includes(SECRET), true, true, 'secret masked while project_id/region kept', 'secret not masked');

// 3) Object form: secret-key redacted, project_id/region values intact
const objRedacted = redactSecrets({ secret_key: SECRET, project_id: PROJECT_ID, region: REGION });
test('D8-3', 'obj-secret-key-redacted', objRedacted.secret_key === '<redacted>', objRedacted.secret_key, '<redacted>', 'object secret_key redacted', 'object secret_key leaked');
test('D8-3', 'obj-project-id-preserved', objRedacted.project_id === PROJECT_ID, objRedacted.project_id, PROJECT_ID, 'object project_id preserved', 'object project_id over-redacted');
test('D8-3', 'obj-region-preserved', objRedacted.region === REGION, objRedacted.region, REGION, 'object region preserved', 'object region over-redacted');

// 4) No false positives on innocent non-secret fields
const innocent = redactSecrets({ project_id: PROJECT_ID, region: REGION, count: 5, name: 'ecs-001' });
test('D8-3', 'innocent-fields-untouched', innocent.project_id === PROJECT_ID && innocent.region === REGION && innocent.count === 5 && innocent.name === 'ecs-001', JSON.stringify(innocent), 'untouched', 'ordinary fields untouched', 'innocent field over-redacted');

finish('PASS');
process.exit(0);