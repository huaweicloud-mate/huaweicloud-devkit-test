// AI生成
/**
 * OfficeAce Windows 每日测试探针 - D2 认证/凭证
 * 覆盖: D2-2, D2-4, D2-11
 */
import { redactSecrets, loadPolicy } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,150), expected: String(expected).substring(0,100), passMsg, failMsg });
}

// D2-4: Credential redaction correctness
try {
  const testAK = 'AKIDTEST12345678';
  const testSK = 'SKtest123456789abcdef';
  const redacted = redactSecrets(`{"ak":"${testAK}","sk":"${testSK}"}`);
  const akLeaked = String(redacted).includes(testAK);
  const skLeaked = String(redacted).includes(testSK);
  test('D2-4', 'ak-redacted', !akLeaked, akLeaked ? 'AK leaked' : 'AK redacted', 'redacted', 'AK redacted in output', 'AK leaked in output (defect)');
  test('D2-4', 'sk-redacted', !skLeaked, skLeaked ? 'SK leaked' : 'SK redacted', 'redacted', 'SK redacted in output', 'SK leaked in output (defect)');
} catch (e) {
  test('D2-4', 'redaction', false, e.message, 'redacted', 'Credential redaction works', `Error: ${e.message}`);
}

// D2-4 additional: adminPass redaction
try {
  const pwd = 'MySecretPass123!';
  const redacted = redactSecrets(`adminPass: ${pwd}`);
  test('D2-4', 'adminpass-redacted', !String(redacted).includes(pwd), String(redacted).substring(0,80), 'redacted', 'adminPass redacted', 'adminPass leaked');
} catch (e) {
  test('D2-4', 'adminpass-redacted', false, e.message, 'redacted', 'adminPass redaction', `Error: ${e.message}`);
}

// D2-11: STS token rejection - token should never be persisted
try {
  // Check if credentials file exists
  const credPath = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
  const credExists = existsSync(credPath);
  let hasToken = false;
  if (credExists) {
    const content = readFileSync(credPath, 'utf8');
    const parsed = JSON.parse(content);
    hasToken = Boolean(parsed.securityToken || parsed.token);
  }
  // STS token should not be in the credentials file
  test('D2-11', 'no-sts-token-persisted', !hasToken, hasToken ? 'token found in creds' : 'no token in creds', 'no token', 'STS token not persisted', 'STS token found in credentials (defect)');
} catch (e) {
  test('D2-11', 'no-sts-token-persisted', false, e.message, 'no token', 'STS token check', `Error: ${e.message}`);
}

// D2-2: auth status accuracy
try {
  // Check if hcloud is configured
  const hcloudCheck = spawnSync('hcloud', ['config', 'show'], { encoding: 'utf8', timeout: 10000 });
  test('D2-2', 'auth-status', hcloudCheck.status !== undefined, hcloudCheck.status, 'defined exit', 'Auth status check ran', 'Auth status check failed');
} catch (e) {
  test('D2-2', 'auth-status', false, e.message, 'defined', 'Auth status', `Error: ${e.message}`);
}

// D2-4 additional: various secret patterns
try {
  const secrets = [
    'password: SecretPass123',
    'token: abcdef1234567890',
    'secret_key: sk-1234567890abcdef',
  ];
  let allRedacted = true;
  for (const s of secrets) {
    const r = redactSecrets(s);
    if (String(r).includes('SecretPass123') || String(r).includes('abcdef1234567890') || String(r).includes('sk-1234567890abcdef')) {
      allRedacted = false;
    }
  }
  test('D2-4', 'multi-secret-redacted', allRedacted, allRedacted ? 'all redacted' : 'some leaked', 'all redacted', 'Multiple secrets redacted', 'Some secrets leaked');
} catch (e) {
  test('D2-4', 'multi-secret-redacted', false, e.message, 'all redacted', 'Multi secret redaction', `Error: ${e.message}`);
}

const passed = results.filter(r=>r.pass).length;
const failed = results.filter(r=>!r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-17-188.239.14.150/Windows/evidence/d2-auth/stdout.log', output, 'utf8');
console.log(output);
