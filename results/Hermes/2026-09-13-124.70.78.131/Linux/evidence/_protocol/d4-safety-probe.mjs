// D4 安全策略源码探针：直接 import 安装包 safety-policy.mjs 的导出函数，核对 D4-1/D4-2/D4-3 拦截语义
// 用法: node d4-safety-probe.mjs <safety-policy.mjs 绝对路径>
import { pathToFileURL } from 'node:url';

const modPath = process.argv[2];
const { classifyTextCommand, redactSecrets, loadPolicy } = await import(pathToFileURL(modPath).href);

const policy = loadPolicy();
console.log('policy version:', policy.version);
console.log('credentialFilePatterns:', JSON.stringify(policy.credentialFilePatterns));

const cases = [
  // D4-1 凭证文件读取拦截（.hcloud / .huaweicloud 路径）
  ['D4-1', 'cat ~/.config/huaweicloud/credentials.json'],
  ['D4-1', 'cat ~/.hcloud/config.json'],
  // D4-2 凭证 env 打印拦截：HW_ 前缀（真实凭证环境变量名）
  ['D4-2', 'env | grep HW_ACCESS_KEY'],
  ['D4-2', 'printenv HW_SECRET_KEY'],
  ['D4-2', 'env | grep -i access_key'],
  // D4-2 正对照：HUAWEICLOUD 前缀（应被拦）
  ['D4-2-ctrl', 'env | grep HUAWEICLOUD'],
  // D4-3 明文 secret API 拦截
  ['D4-3', 'hcloud csms ShowSecretVersion --secret-name x'],
  ['D4-3', 'GetSecretValue --secret-id 123'],
];

for (const [cid, cmd] of cases) {
  const r = classifyTextCommand(cmd);
  console.log(`\n[${cid}] $ ${cmd}`);
  console.log(`   decision=${r.decision} risk=${r.risk}`);
  console.log(`   reason=${r.reason}`);
}

// 脱敏冒烟：ak/sk 值应被 redact
const leakTest = redactSecrets('AK=AKID1234567890ABCDEF SK=mysecretvalue123456 token=abc');
console.log('\n=== redactSecrets smoke ===');
console.log(leakTest);

console.log('\n=== DONE ===');