// AI生成
/**
 * D4-2: 凭证env打印拦截测试
 * 通过源码直调 safety-policy.mjs 的 classifyTextCommand 函数验证拦截行为
 * 预期: 所有凭证环境变量打印命令被 deny
 */
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const testCases = [
  // --- printenv 直接打印凭证变量 ---
  { cmd: 'printenv HUAWEICLOUD_ACCESS_KEY_ID',           desc: 'printenv HUAWEICLOUD_ACCESS_KEY_ID' },
  { cmd: 'printenv HUAWEICLOUD_SECRET_ACCESS_KEY',       desc: 'printenv HUAWEICLOUD_SECRET_ACCESS_KEY' },
  { cmd: 'printenv HUAWEICLOUD_SECURITY_TOKEN',          desc: 'printenv HUAWEICLOUD_SECURITY_TOKEN' },
  { cmd: 'printenv HWC_ACCESS_KEY_ID',                   desc: 'printenv HWC_ACCESS_KEY_ID' },
  { cmd: 'printenv HWC_SECRET_ACCESS_KEY',               desc: 'printenv HWC_SECRET_ACCESS_KEY' },
  { cmd: 'printenv HW_ACCESS_KEY',                       desc: 'printenv HW_ACCESS_KEY' },
  { cmd: 'printenv HW_SECRET_KEY',                       desc: 'printenv HW_SECRET_KEY' },
  { cmd: 'printenv HW_SECURITY_TOKEN',                   desc: 'printenv HW_SECURITY_TOKEN' },
  { cmd: 'printenv OS_ACCESS_KEY_ID',                    desc: 'printenv OS_ACCESS_KEY_ID (OpenStack compat)' },
  { cmd: 'printenv OS_SECRET_ACCESS_KEY',                desc: 'printenv OS_SECRET_ACCESS_KEY' },

  // --- env + grep 过滤凭证变量 ---
  { cmd: 'env | grep HUAWEICLOUD',                       desc: 'env | grep HUAWEICLOUD' },
  { cmd: 'env | grep HWC_',                              desc: 'env | grep HWC_' },
  { cmd: 'env | grep -i hua',                            desc: 'env | grep -i hua (partial match)' },
  { cmd: 'env | grep HCLOUD',                            desc: 'env | grep HCLOUD' },
  { cmd: 'env | grep OS_',                               desc: 'env | grep OS_' },

  // --- echo $VAR 变量引用 ---
  { cmd: 'echo $HUAWEICLOUD_ACCESS_KEY_ID',              desc: 'echo $HUAWEICLOUD_ACCESS_KEY_ID' },
  { cmd: 'echo $HUAWEICLOUD_SECRET_ACCESS_KEY',          desc: 'echo $HUAWEICLOUD_SECRET_ACCESS_KEY' },
  { cmd: 'echo $HWC_ACCESS_KEY_ID',                      desc: 'echo $HWC_ACCESS_KEY_ID' },
  { cmd: 'echo $HW_SECRET_KEY',                          desc: 'echo $HW_SECRET_KEY' },
  { cmd: 'echo $HW_SECURITY_TOKEN',                      desc: 'echo $HW_SECURITY_TOKEN' },
  { cmd: 'echo $OS_ACCESS_KEY_ID',                       desc: 'echo $OS_ACCESS_KEY_ID' },
  { cmd: 'echo ${HUAWEICLOUD_ACCESS_KEY_ID}',            desc: 'echo ${HUAWEICLOUD_ACCESS_KEY_ID} (braced)' },
  { cmd: 'echo ${HW_SECRET_KEY}',                        desc: 'echo ${HW_SECRET_KEY} (braced)' },

  // --- PowerShell env 打印 ---
  { cmd: 'Get-ChildItem Env: | Where-Object { $_.Name -match "HUAWEICLOUD" }', desc: 'PowerShell Get-ChildItem Env: HUAWEICLOUD' },
  { cmd: 'gci Env: | Where-Object { $_.Name -match "HWC_" }',                  desc: 'PowerShell gci Env: HWC_' },
  { cmd: 'dir Env: | findstr HUAWEICLOUD',                                     desc: 'dir Env: findstr HUAWEICLOUD' },

  // --- env 全量打印 (含 HUAWEICLOUD 关键字) ---
  { cmd: 'env | sort | grep -E "HUAWEICLOUD|HWC_|HCLOUD"', desc: 'env sorted grep multiple cloud prefixes' },
  { cmd: 'printenv | grep -E "HUAWEICLOUD|HWC_"',         desc: 'printenv piped grep cloud prefixes' },
];

const results = [];
let passCount = 0;
let failCount = 0;

console.log('='.repeat(80));
console.log('D4-2: 凭证env打印拦截测试 (Credential Env Print Interception)');
console.log('='.repeat(80));
console.log(`测试时间: ${new Date().toISOString()}`);
console.log(`测试函数: classifyTextCommand()`);
console.log(`预期结果: decision=deny, risk=credential`);
console.log('');

for (const tc of testCases) {
  const result = classifyTextCommand(tc.cmd);
  const passed = result.decision === 'deny' && result.risk === 'credential';
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
  testCase: 'D4-2',
  title: '凭证env打印拦截',
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
