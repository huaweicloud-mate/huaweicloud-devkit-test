/**
 * Hermes 每日测试探针 - D1 CLI 只读命令 (Linux)
 * SUT: huaweicloud-devkit@1.1.4-next.3
 * 覆盖: D1-3(doctor)/D1-4(status) 真机只读命令，可复现。
 * 注: install/uninstall 有副作用，见 install-uninstall-summary.md。
 */
import { execSync } from 'node:child_process';

const CLI = 'huaweicloud-devkit';
for (const cmd of ['version', 'status', 'doctor']) {
  console.log(`\n===== ${CLI} ${cmd} =====`);
  try {
    const out = execSync(`${CLI} ${cmd} 2>&1`, { encoding: 'utf8', timeout: 60000 });
    // 脱敏：仅保留关键行，避免 hcloud 凭证/路径泄露到日志
    const lines = out.split('\n').filter(l => !/accessKeyId|secretAccessKey|token/i.test(l));
    console.log(lines.slice(0, 80).join('\n'));
  } catch (e) {
    console.log('ERR:', e.message);
  }
}