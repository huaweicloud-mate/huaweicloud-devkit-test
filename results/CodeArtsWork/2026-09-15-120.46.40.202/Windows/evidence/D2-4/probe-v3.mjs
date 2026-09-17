// D2-4 probe v3: 凭证脱敏正确性 — 通过 redactOutput 验证真实脱敏链路
import { join } from 'node:path';
const SRC = 'C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src';
const { redactOutput } = await import('file://' + join(SRC, 'hcloud-cli.mjs'));
const { redactSecrets } = await import('file://' + join(SRC, 'safety-policy.mjs'));

const FAKE_AK = 'HW0123456789ABCDEF';
const FAKE_SK = 'AbCdEf1234567890GhIjKlMnOpQrStUvWxYz';

// 模拟真实 hcloud configure show 的 JSON 输出
const hcloudJson = JSON.stringify({
  current: 'default',
  currentRegion: 'cn-north-4',
  currentCredential: {
    accessKeyId: FAKE_AK,
    secretAccessKey: FAKE_SK,
    ak: FAKE_AK,
    sk: FAKE_SK,
  },
});

console.log('=== D2-4 凭证脱敏正确性 (通过 redactOutput 真实链路) ===');
console.log('Input hcloud JSON:', hcloudJson);
console.log('');

// Step 1: runHcloud 内部调用 redactOutput(stdout) — 这是实际发生的
const redactedStdout = redactOutput(hcloudJson);
console.log('redactOutput(stdout):', redactedStdout);
console.log('');

const akInStdout = redactedStdout.includes(FAKE_AK);
const skInStdout = redactedStdout.includes(FAKE_SK);
console.log('AK in redacted stdout:', akInStdout ? 'LEAK FAIL' : 'NO');
console.log('SK in redacted stdout:', skInStdout ? 'LEAK FAIL' : 'NO');

// Step 2: showProfileRedacted 再调用 redactSecrets(result)
const result = { ok: true, stdout: redactedStdout, stderr: '' };
const finalResult = redactSecrets(result);
const finalStr = JSON.stringify(finalResult);
console.log('Final redactSecrets(result):', finalStr);
console.log('');

const akInFinal = finalStr.includes(FAKE_AK);
const skInFinal = finalStr.includes(FAKE_SK);
const hasRedacted = finalStr.includes('<redacted>');
console.log('AK in final output:', akInFinal ? 'LEAK FAIL' : 'NO');
console.log('SK in final output:', skInFinal ? 'LEAK FAIL' : 'NO');
console.log('Has <redacted> markers:', hasRedacted);

const PASS = !akInFinal && !skInFinal && hasRedacted;
console.log('');
console.log('VERDICT:', PASS ? 'PASS' : 'FAIL');
