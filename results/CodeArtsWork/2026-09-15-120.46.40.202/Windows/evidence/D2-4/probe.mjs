// D2-4 probe: 凭证脱敏正确性
// 直接源码级调用 redactSecrets / redactString 验证输出无明文 AK/SK
import { join } from 'node:path';

const SRC = 'C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src';

const { redactSecrets } = await import('file://' + join(SRC, 'safety-policy.mjs'));

// 测试数据：模拟 show_profile_redacted 的输出对象
const FAKE_AK = 'HW' + '0123456789ABCDEF';
const FAKE_SK = 'AbCdEf1234567890GhIjKlMnOpQrStUvWxYz';
const FAKE_TOKEN = 'IQIJ' + 'DUMMYSTSTOKEN1234567890';

const profileOutput = {
  profile: 'default',
  ak: FAKE_AK,
  sk: FAKE_SK,
  securityToken: FAKE_TOKEN,
  region: 'cn-north-4',
  nested: {
    access_key: FAKE_AK,
    secret_key: FAKE_SK,
    password: 'mySecretPass123',
  },
  command: `hcloud configure set --ak=${FAKE_AK} --sk=${FAKE_SK} --token=${FAKE_TOKEN}`,
};

const redacted = redactSecrets(profileOutput);
const redactedStr = JSON.stringify(redacted);

console.log('=== D2-4 凭证脱敏正确性 ===');
console.log('Input AK:', FAKE_AK);
console.log('Input SK:', FAKE_SK);
console.log('Input Token:', FAKE_TOKEN);
console.log('');
console.log('Redacted output:', redactedStr);
console.log('');

// 断言：输出不含明文凭证
const akLeaked = redactedStr.includes(FAKE_AK);
const skLeaked = redactedStr.includes(FAKE_SK);
const tokenLeaked = redactedStr.includes(FAKE_TOKEN);
const passLeaked = redactedStr.includes('mySecretPass123');

console.log('AK leaked in output:', akLeaked ? 'FAIL' : 'NO');
console.log('SK leaked in output:', skLeaked ? 'FAIL' : 'NO');
console.log('Token leaked in output:', tokenLeaked ? 'FAIL' : 'NO');
console.log('Password leaked in output:', passLeaked ? 'FAIL' : 'NO');

// 检查 redacted 标记存在
const hasRedacted = redactedStr.includes('<redacted>');
console.log('Contains <redacted> markers:', hasRedacted);

const PASS = !akLeaked && !skLeaked && !tokenLeaked && !passLeaked && hasRedacted;
console.log('VERDICT:', PASS ? 'PASS' : 'FAIL');

// 额外：测试 redactString 对命令行格式
const { redactSecrets: rs2 } = await import('file://' + join(SRC, 'safety-policy.mjs'));
const cmdStr = `access_key=${FAKE_AK} secret_key=${FAKE_SK} security_token=${FAKE_TOKEN} password=mySecretPass123`;
const redactedCmd = rs2(cmdStr);
console.log('');
console.log('--- Command string redaction ---');
console.log('Input:', cmdStr);
console.log('Output:', redactedCmd);
const cmdAkLeaked = redactedCmd.includes(FAKE_AK);
const cmdSkLeaked = redactedCmd.includes(FAKE_SK);
console.log('Cmd AK leaked:', cmdAkLeaked ? 'FAIL' : 'NO');
console.log('Cmd SK leaked:', cmdSkLeaked ? 'FAIL' : 'NO');
