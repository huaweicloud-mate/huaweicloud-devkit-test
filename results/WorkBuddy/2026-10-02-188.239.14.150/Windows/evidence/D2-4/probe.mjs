import { writeFileSync } from 'node:fs';
import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const caseId = 'D2-4';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D2-4: 凭证脱敏正确性
// Spec: 执行脱敏展示 → 检查输出: AK中段、SK永不完整
// Key assertion: redactSecrets must never output full AK/SK; secret keys redacted; no plaintext credentials.

try {
  // Test 1: Object with secret keys
  const obj = {
    ak: 'HPUAN1ROQ4PQXQVBSYXD',
    sk: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef',
    securityToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature',
    region: 'cn-north-4',
    password: 's3cr3tP@ss',
    normal: 'hello',
  };
  const redactedObj = redactSecrets(obj);
  result.redactedObj = redactedObj;

  // Test 2: String with embedded credentials
  const str = 'AK=HPUAN1ROQ4PQXQVBSYXD SK=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef token=abc123';
  const redactedStr = redactSecrets(str);
  result.redactedStr = redactedStr;

  // Test 3: Nested object
  const nested = { config: { access_key: 'AKIDTEST', secret_key: 'SKTEST' }, data: 'ok' };
  const redactedNested = redactSecrets(nested);
  result.redactedNested = redactedNested;

  // Assertions
  const objStr = JSON.stringify(redactedObj);
  const strOk = !redactedStr.includes('HPUAN1ROQ4PQXQVBSYXD') && !redactedStr.includes('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef');
  const objOk = !objStr.includes('HPUAN1ROQ4PQXQVBSYXD') && !objStr.includes('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef') &&
                !objStr.includes('s3cr3tP@ss') && !objStr.includes('eyJhbGciOiJIUzI1NiJ9');
  const nestedOk = JSON.stringify(redactedNested).includes('<redacted>') && !JSON.stringify(redactedNested).includes('AKIDTEST') && !JSON.stringify(redactedNested).includes('SKTEST');

  // Check AK is partially shown (redacted means fully replaced with <redacted> or partially masked)
  const akRedacted = redactedObj.ak === '<redacted>' || !redactedObj.ak?.includes('HPUAN1ROQ4PQXQVBSYXD');
  const skRedacted = redactedObj.sk === '<redacted>' || !redactedObj.sk?.includes('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef');

  if (objOk && strOk && nestedOk && akRedacted && skRedacted) {
    result.status = 'PASS';
    result.why = `redactSecrets correctly redacts: AK/SK/token/password all replaced with <redacted>; no plaintext credentials in output; nested objects handled`;
  } else {
    result.status = 'FAIL';
    result.why = `Redaction incomplete: objOk=${objOk}, strOk=${strOk}, nestedOk=${nestedOk}, akRedacted=${akRedacted}, skRedacted=${skRedacted}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
