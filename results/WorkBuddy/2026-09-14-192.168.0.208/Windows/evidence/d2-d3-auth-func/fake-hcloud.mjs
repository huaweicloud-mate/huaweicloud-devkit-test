// 假 hcloud：记录调用参数到 FAKE_HCLOUD_LOG，模拟 KooCLI 7.2.12 行为（离线）。
// 用法: HCLOUD_BIN=node.exe HCLOUD_BIN_ARGS_JSON=["<本文件>"] hcloud <args...>
import { appendFileSync } from 'node:fs';

const args = process.argv.slice(2);
try {
  appendFileSync(process.env.FAKE_HCLOUD_LOG, JSON.stringify({ args }) + String.fromCharCode(10), 'utf8');
} catch {}

if (args.length === 0 || args.includes('--version')) {
  console.log('KooCLI Version 7.2.12 Copyright(C) 2020-2026 www.huaweicloud.com');
  process.exit(0);
}
if (args[0] === 'configure' && args[1] === 'show') {
  // 输出含明文凭证的 profile JSON —— 供 D2-4 验证脱敏管道
  console.log(
    JSON.stringify({
      currentCredential: {
        accessKeyId: 'AKIDFAKEPROBE1234567890',
        secretAccessKey: 'FAKESKPROBEsecret987654321xyz',
        securityToken: '',
      },
      currentRegion: 'cn-north-4',
    }),
  );
  process.exit(0);
}
if (args[0] === 'configure' && args[1] === 'set') {
  console.log('Succeed to set profile.');
  process.exit(0);
}
console.log('OK');
process.exit(0);
