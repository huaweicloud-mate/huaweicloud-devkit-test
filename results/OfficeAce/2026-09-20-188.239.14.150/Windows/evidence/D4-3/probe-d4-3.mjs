// AI生成
/**
 * D4-3: 明文secret API拦截测试
 * 通过源码直调 safety-policy.mjs 的 classifyTextCommand 函数验证拦截行为
 * 预期: 所有明文secret读取命令被 deny (risk=secret)
 */
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const testCases = [
  // --- CSMS (凭据管理服务) 明文secret读取 ---
  { cmd: 'hcloud CSMS ShowSecretVersion --secret_id abc123',              desc: 'CSMS ShowSecretVersion (明文secret读取)' },
  { cmd: 'hcloud CSMS ShowSecretVersion --id 123456',                     desc: 'CSMS ShowSecretVersion (--id)' },
  { cmd: 'hcloud CSMS DownloadSecret --secret_id abc123',                 desc: 'CSMS DownloadSecret (下载secret)' },
  { cmd: 'hcloud CSMS GetSecretValue --secret_name mysecret',             desc: 'CSMS GetSecretValue (获取secret值)' },
  { cmd: 'hcloud CSMS ShowSecret --secret_id abc123',                     desc: 'CSMS ShowSecret (展示secret)' },

  // --- KMS (密钥管理服务) 明文密钥材料 ---
  { cmd: 'hcloud KMS GetSecretValue --key_id abc123',                     desc: 'KMS GetSecretValue' },
  { cmd: 'hcloud KMS ShowSecret --key_id abc123',                         desc: 'KMS ShowSecret' },
  { cmd: 'hcloud KMS DownloadSecret --key_id abc123',                     desc: 'KMS DownloadSecret' },

  // --- secret_string / secret_binary 模式 ---
  { cmd: 'hcloud CSMS ShowSecretVersion --secret_string',                 desc: 'CSMS ShowSecretVersion --secret_string' },
  { cmd: 'hcloud CSMS ShowSecretVersion --secret_binary',                 desc: 'CSMS ShowSecretVersion --secret_binary' },
  { cmd: 'hcloud CSMS CreateSecret --secret_string "plaintext-value"',    desc: 'CSMS CreateSecret --secret_string (含明文)' },
  { cmd: 'hcloud CSMS CreateSecret --secret_binary "base64data"',         desc: 'CSMS CreateSecret --secret_binary (含二进制)' },

  // --- 大小写变体 ---
  { cmd: 'hcloud CSMS showsecretversion --secret_id abc123',              desc: 'CSMS showsecretversion (小写)' },
  { cmd: 'hcloud CSMS getsecretvalue --secret_name mysecret',             desc: 'CSMS getsecretvalue (小写)' },

  // --- 带额外参数的复杂命令 ---
  { cmd: 'hcloud CSMS ShowSecretVersion --secret_id abc123 --version_id v1 --project_id 0', desc: 'CSMS ShowSecretVersion 完整参数' },
  { cmd: 'hcloud CSMS ShowSecretVersion --secret_id=abc123 --version_id=v1',                 desc: 'CSMS ShowSecretVersion 等号参数' },
  { cmd: 'sudo hcloud CSMS ShowSecretVersion --secret_id abc123',                             desc: 'sudo hcloud CSMS ShowSecretVersion' },
  { cmd: 'bash -c "hcloud CSMS ShowSecretVersion --secret_id abc123"',                       desc: 'bash -c wrapped ShowSecretVersion' },

  // --- 直接文本模式 (非hcloud前缀但含secret关键字) ---
  { cmd: 'curl https://csms.myhuaweicloud.com/v1/secrets/abc/versions/v1 --show_secret_value', desc: 'curl CSMS API with show_secret_value' },
  { cmd: 'ShowSecretVersion --secret_id abc123',                      desc: '裸 ShowSecretVersion 命令' },
  { cmd: 'GetSecretValue --secret_name mysecret',                     desc: '裸 GetSecretValue 命令' },

  // --- DownloadSecret 变体 ---
  { cmd: 'hcloud CSMS DownloadSecret --secret_id abc123 --version_id v1', desc: 'CSMS DownloadSecret with version' },
];

const results = [];
let passCount = 0;
let failCount = 0;

console.log('='.repeat(80));
console.log('D4-3: 明文secret API拦截测试 (Plaintext Secret API Interception)');
console.log('='.repeat(80));
console.log(`测试时间: ${new Date().toISOString()}`);
console.log(`测试函数: classifyTextCommand()`);
console.log(`预期结果: decision=deny, risk=secret`);
console.log('');

for (const tc of testCases) {
  const result = classifyTextCommand(tc.cmd);
  // D4-3 预期 deny 且 risk=secret
  const passed = result.decision === 'deny' && result.risk === 'secret';
  if (passed) passCount++; else failCount++;

  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${tc.desc}`);
  console.log(`  命令: ${tc.cmd}`);
  console.log(`  decision=${result.decision}, risk=${result.risk}`);
  console.log(`  reason: ${result.reason}`);
  if (result.blockedByRiskRule) console.log(`  blockedByRiskRule: true, ruleId=${result.findings?.[0]?.ruleId}`);
  console.log('');

  results.push({ ...tc, ...result, passed });
}

console.log('='.repeat(80));
console.log(`汇总: ${passCount}/${testCases.length} PASS, ${failCount}/${testCases.length} FAIL`);
console.log(`总体结果: ${failCount === 0 ? 'PASS' : 'FAIL'}`);
console.log('='.repeat(80));

console.log('\n---JSON_SUMMARY---');
console.log(JSON.stringify({
  testCase: 'D4-3',
  title: '明文secret API拦截',
  total: testCases.length,
  passed: passCount,
  failed: failCount,
  result: failCount === 0 ? 'PASS' : 'FAIL',
  details: results.map(r => ({
    cmd: r.cmd,
    desc: r.desc,
    decision: r.decision,
    risk: r.risk,
    reason: r.reason,
    passed: r.passed,
    blockedByRiskRule: r.blockedByRiskRule || false,
    ruleId: r.findings?.[0]?.ruleId || null,
  })),
}, null, 2));
