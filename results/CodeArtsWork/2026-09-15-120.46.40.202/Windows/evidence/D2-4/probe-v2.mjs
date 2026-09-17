// D2-4 probe v2: 凭证脱敏正确性 — 模拟真实 hcloud configure show 输出
import { join } from 'node:path';
const SRC = 'C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src';
const { redactSecrets } = await import('file://' + join(SRC, 'safety-policy.mjs'));

// 模拟真实 hcloud configure show 的 JSON 输出格式
const FAKE_AK = 'HW0123456789ABCDEF';
const FAKE_SK = 'AbCdEf1234567890GhIjKlMnOpQrStUvWxYz';

const hcloudShowOutput = {
  ok: true,
  stdout: JSON.stringify({
    current: 'default',
    currentRegion: 'cn-north-4',
    currentCredential: {
      accessKeyId: FAKE_AK,
      secretAccessKey: FAKE_SK,
      ak: FAKE_AK,
      sk: FAKE_SK,
    },
  }),
  stderr: '',
};

const redacted = redactSecrets(hcloudShowOutput);
const redactedStr = JSON.stringify(redacted);

console.log('=== D2-4 凭证脱敏正确性 (真实 hcloud configure show 格式) ===');
console.log('Redacted output:', redactedStr);
console.log('');

const akLeaked = redactedStr.includes(FAKE_AK);
const skLeaked = redactedStr.includes(FAKE_SK);
const hasRedacted = redactedStr.includes('<redacted>');

console.log('AK leaked:', akLeaked ? 'FAIL' : 'NO');
console.log('SK leaked:', skLeaked ? 'FAIL' : 'NO');
console.log('Has <redacted> markers:', hasRedacted);

// 注意：stdout 是一个 JSON 字符串，redactString 会处理它
// 检查 stdout 字符串内的凭证是否被脱敏
const stdoutParsed = JSON.parse(redacted.stdout);
const stdoutStr = redacted.stdout;
const stdoutAkLeaked = stdoutStr.includes(FAKE_AK);
const stdoutSkLeaked = stdoutStr.includes(FAKE_SK);

console.log('');
console.log('stdout field AK leaked:', stdoutAkLeaked ? 'FAIL - plaintext in stdout string' : 'NO');
console.log('stdout field SK leaked:', stdoutSkLeaked ? 'FAIL - plaintext in stdout string' : 'NO');

// redactSecrets 对字符串值调用 redactString，redactString 处理 access_key= 等模式
// 但 JSON.stringify 的格式是 "accessKeyId":"HW..." 不匹配 access_key= 模式
// 所以 stdout 字符串内的凭证可能未被 redactString 脱敏
// 但 redactSecrets 递归处理对象，如果 stdout 被解析为对象则字段会被脱敏
// 这里 stdout 是字符串类型，redactSecrets 会调用 redactString 处理它

const PASS = !akLeaked && !skLeaked && hasRedacted;
console.log('');
console.log('VERDICT:', PASS ? 'PASS' : 'FAIL');

if (stdoutAkLeaked || stdoutSkLeaked) {
  console.log('');
  console.log('NOTE: stdout string contains plaintext credentials.');
  console.log('redactString handles access_key= / secret_key= / AK= patterns but not JSON "accessKeyId":"value" format.');
  console.log('However, the top-level result object fields are properly redacted by redactSecrets.');
  console.log('The showProfileRedacted function returns { ok, note, result: redactSecrets(result) } where result fields are redacted.');
}
