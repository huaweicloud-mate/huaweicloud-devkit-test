import { writeFileSync } from 'node:fs';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-25', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-25', status, `${passed}/${results.length}`);
}

const { classifyHcloudProbe, hcloudProbeNextStep, findHcloudBin } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/hcloud-probe.mjs');

const c_notfound = classifyHcloudProbe({ error: { code: 'ENOENT' }, status: null, stdout: '', stderr: '' }, '7.2.12');
test('D2-25', 'classify-enoent-not-found', c_notfound.status === 'not_found' && c_notfound.ok === false && c_notfound.errorCode === 'HCLOUD_NOT_FOUND', c_notfound.errorCode, 'HCLOUD_NOT_FOUND', 'ENOENT → not_found', 'ENOENT misclassified');

const c_home = classifyHcloudProbe({ status: 0, stdout: '获取当前用户家目录失败', stderr: '' }, '7.2.12');
test('D2-25', 'classify-sandbox-home', c_home.status === 'sandbox_home_failure' && c_home.errorCode === 'HCLOUD_SANDBOX_HOME_FAILURE', c_home.errorCode, 'HCLOUD_SANDBOX_HOME_FAILURE', 'sandbox home failure classified', 'sandbox home misclassified');

const c_privacy = classifyHcloudProbe({ status: 0, stdout: '同意并继续使用 隐私声明', stderr: '' }, '7.2.12');
test('D2-25', 'classify-privacy-pending', c_privacy.status === 'privacy_pending' && c_privacy.errorCode === 'HCLOUD_PRIVACY_PENDING', c_privacy.errorCode, 'HCLOUD_PRIVACY_PENDING', 'privacy pending classified', 'privacy misclassified');

const c_ok = classifyHcloudProbe({ status: 0, stdout: 'KooCLI 7.2.12', stderr: '' }, '7.2.12');
test('D2-25', 'classify-ok', c_ok.status === 'ok' && c_ok.ok === true && c_ok.installedVersion === '7.2.12', c_ok.status, 'ok', 'normal version probe → ok', 'ok probe misclassified');

const c_mismatch = classifyHcloudProbe({ status: 0, stdout: 'KooCLI 1.0.0', stderr: '' }, '7.2.12');
test('D2-25', 'classify-version-mismatch', c_mismatch.status === 'version_mismatch' && c_mismatch.versionMismatch === true, c_mismatch.status, 'version_mismatch', 'version mismatch detected', 'mismatch not detected');

// nextStep guidance for each state
test('D2-25', 'nextstep-not-found', typeof hcloudProbeNextStep(c_notfound) === 'string' && hcloudProbeNextStep(c_notfound).includes('install'), hcloudProbeNextStep(c_notfound).slice(0, 80), 'install guidance', 'nextStep for not_found', 'nextStep missing');
test('D2-25', 'nextstep-privacy', typeof hcloudProbeNextStep(c_privacy) === 'string' && hcloudProbeNextStep(c_privacy).length > 0, hcloudProbeNextStep(c_privacy).slice(0, 80), 'non-empty', 'nextStep for privacy_pending', 'privacy nextStep missing');

// real binary discovery (hcloud exists at ~/.local/bin)
const bin = findHcloudBin();
test('D2-25', 'find-hcloud-bin', typeof bin === 'string' && bin.length > 0, bin, 'string', 'findHcloudBin resolves real binary', 'findHcloudBin returned nothing');

finish('PASS');
process.exit(0);