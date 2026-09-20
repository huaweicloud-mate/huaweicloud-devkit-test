// AI生成
/**
 * D4-1: 凭证文件读取拦截测试
 * 通过源码直调 safety-policy.mjs 的 classifyTextCommand 函数验证拦截行为
 * 预期: 所有凭证文件读取命令被 deny
 */
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const testCases = [
  // --- Linux/Unix 凭证文件读取 ---
  { cmd: 'cat ~/.hcloud/credentials.json',                         desc: 'cat hcloud credentials (Linux)' },
  { cmd: 'cat ~/.hcloud/config.json',                              desc: 'cat hcloud config (Linux)' },
  { cmd: 'cat ~/.huaweicloud/credentials.json',                   desc: 'cat huaweicloud credentials (Linux)' },
  { cmd: 'less ~/.hcloud/credentials.json',                        desc: 'less hcloud credentials' },
  { cmd: 'more ~/.hcloud/credentials.json',                        desc: 'more hcloud credentials' },
  { cmd: 'head ~/.hcloud/credentials.json',                        desc: 'head hcloud credentials' },
  { cmd: 'tail ~/.huaweicloud/config.json',                        desc: 'tail huaweicloud config' },

  // --- Windows 凭证文件读取 ---
  { cmd: 'type %USERPROFILE%\\.hcloud\\credentials.json',          desc: 'type hcloud credentials (Windows)' },
  { cmd: 'type %USERPROFILE%\\.huaweicloud\\credentials.json',     desc: 'type huaweicloud credentials (Windows)' },
  { cmd: 'Get-Content ~/.hcloud/credentials.json',                 desc: 'Get-Content hcloud credentials (PowerShell)' },
  { cmd: 'Get-Content $env:USERPROFILE\\.hcloud\\config.json',     desc: 'Get-Content hcloud config (PowerShell)' },
  { cmd: 'gc ~/.hcloud/credentials.json',                          desc: 'gc alias hcloud credentials' },

  // --- 路径变体 ---
  { cmd: 'cat /home/user/.hcloud/credentials.json',               desc: 'cat absolute path hcloud credentials' },
  { cmd: 'cat /root/.huaweicloud/config.json',                    desc: 'cat absolute path huaweicloud config' },
  { cmd: 'type C:\\Users\\admin\\.hcloud\\credentials.json',       desc: 'type Windows absolute path hcloud' },
  { cmd: 'cat ~/.hcloud/profiles/default.json',                   desc: 'cat hcloud profiles directory' },

  // --- hcloud configure show (凭证检查子命令) ---
  { cmd: 'hcloud configure show',                                 desc: 'hcloud configure show (blocked subcommand)' },
  { cmd: 'hcloud configure list',                                 desc: 'hcloud configure list (blocked subcommand)' },
  { cmd: 'hcloud configure get --ak',                             desc: 'hcloud configure get (blocked subcommand)' },
];

const results = [];
let passCount = 0;
let failCount = 0;

console.log('='.repeat(80));
console.log('D4-1: 凭证文件读取拦截测试 (Credential File Read Interception)');
console.log('='.repeat(80));
console.log(`测试时间: ${new Date().toISOString()}`);
console.log(`测试函数: classifyTextCommand()`);
console.log(`预期结果: decision=deny, risk=credential`);
console.log('');

for (const tc of testCases) {
  const result = classifyTextCommand(tc.cmd);
  const passed = result.decision === 'deny' && (result.risk === 'credential' || result.risk === 'secret');
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

// 输出 JSON 摘要供证据归档
console.log('\n---JSON_SUMMARY---');
console.log(JSON.stringify({
  testCase: 'D4-1',
  title: '凭证文件读取拦截',
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
