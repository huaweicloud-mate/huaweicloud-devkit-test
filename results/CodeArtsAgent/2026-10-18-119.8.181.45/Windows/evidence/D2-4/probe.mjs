import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const results = [];

const testCases = [
  {
    name: 'access_key 脱敏',
    input: { accessKeyId: 'AKID1234567890', secretAccessKey: 'secret123', region: 'cn-north-1' },
    expectedRedacted: ['accessKeyId', 'secretAccessKey']
  },
  {
    name: 'secret_key 脱敏',
    input: { secret_key: 'my-secret-key', access_key: 'my-access-key' },
    expectedRedacted: ['secret_key', 'access_key']
  },
  {
    name: 'AK/SK 简写脱敏',
    input: { AK: 'AKVALUE', SK: 'SKVALUE' },
    expectedRedacted: ['AK', 'SK']
  },
  {
    name: '嵌套对象脱敏',
    input: { 
      profile: 'prod',
      credentials: { 
        accessKeyId: 'real-ak', 
        secretAccessKey: 'real-sk',
        token: 'real-token'
      },
      normal: 'should-keep'
    },
    expectedRedacted: ['accessKeyId', 'secretAccessKey', 'token']
  },
  {
    name: '数组内脱敏',
    input: [
      { name: 'prod', access_key: 'ak-prod', secret_key: 'sk-prod' },
      { name: 'dev', access_key: 'ak-dev', secret_key: 'sk-dev' }
    ],
    expectedRedacted: ['access_key', 'secret_key']
  },
  {
    name: '字符串 AK= 模式脱敏',
    input: 'AK=HPUAI12345\nSK=abcdef\nnormal output here',
    expectedRedacted: ['AK', 'SK'],
    expectedNotContain: ['HPUAI12345', 'abcdef']
  },
  {
    name: 'user_data 完整脱敏',
    input: ['ECS', 'CreateServers', '--server.user_data=ZXhwb3J0IEFQUF9TRUNSRVQ9czNjcjN0'],
    expectedRedacted: ['user_data'],
    expectedNotContain: ['SECRET', 'TOKEN', 's3cr3t']
  },
  {
    name: 'private_key 完整脱敏',
    input: { '--keypair.private_key': '-----BEGIN RSA PRIVATE KEY-----' },
    expectedRedacted: ['private_key'],
    expectedNotContain: ['RSA', 'PRIVATE']
  }
];

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  const redacted = redactSecrets(tc.input);
  const redactedStr = JSON.stringify(redacted);
  
  let passed = true;
  const checks = [];
  
  for (const field of tc.expectedRedacted) {
    const found = redactedStr.includes(`"${field}":"<redacted>"`) || 
                  (Array.isArray(redacted) && redacted.some(item => item[field] === '<redacted>'));
    if (!found) {
      const nested = JSON.stringify(redacted).includes(`${field}<redacted>`) || 
                     JSON.stringify(redacted).includes(`${field}=<redacted>`);
      if (!nested) {
        passed = false;
        checks.push(`field ${field} not redacted`);
      }
    }
  }
  
  if (tc.expectedNotContain) {
    for (const plain of tc.expectedNotContain) {
      if (redactedStr.includes(plain)) {
        passed = false;
        checks.push(`plain text ${plain} found in output`);
      }
    }
  }
  
  results.push({
    case: tc.name,
    passed: passed,
    checks: checks,
    status: passed ? 'PASS' : 'FAIL'
  });
  if (passed) passCount++;
  else failCount++;
}

const output = {
  suite: 'D2-4',
  description: '凭证脱敏正确性 (show_profile_redacted 输出无明文 AK/SK)',
  total: testCases.length,
  pass: passCount,
  fail: failCount,
  status: failCount === 0 ? 'PASS' : 'FAIL',
  tests: results
};

console.log(JSON.stringify(output, null, 2));
