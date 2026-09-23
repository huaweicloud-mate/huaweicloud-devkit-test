// D2-26 凭证备份与恢复 探针 (backupGlobalCredentials / restoreGlobalCredentialsBackup)
// 隔离 HUAWEICLOUD_HOME 到临时目录，避免触碰真实 ~/.config/huaweicloud/credentials.json
// 执行: HUAWEICLOUD_HOME=<tmp> node evidence/D2-26/probe.mjs
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = join(process.env.HUAWEICLOUD_HOME || '/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core', 'src');
// credentials.mjs 真实路径固定（源码 import，不受 HUAWEICLOUD_HOME 影响）:
const REAL_SRC = '/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src';
const cred = await import(pathToFileURL(join(REAL_SRC, 'auth', 'credentials.mjs')).href);
const { globalCredentialsPath, backupGlobalCredentials, restoreGlobalCredentialsBackup } = cred;

// 设置隔离 HUAWEICLOUD_HOME (影响 baseHome())
const iso = process.env.HUAWEICLOUD_HOME;
if (!iso) {
  console.error('请先设置 HUAWEICLOUD_HOME 到隔离目录再运行本探针');
  process.exit(2);
}

const gpath = globalCredentialsPath();
const bakPath = gpath + '.bak';
console.log('=== D2-26 凭证备份与恢复 (隔离 HOME) ===');
console.log('隔离 HUAWEICLOUD_HOME =', iso);
console.log('globalCredentialsPath =', gpath);

// 准备 fake 凭证文件 (模拟 auth init 后的原始内容)
import { mkdirSync } from 'node:fs';
mkdirSync(join(iso, '.config', 'huaweicloud'), { recursive: true });
const ORIGINAL = JSON.stringify({ ak: 'ORIG_AK_1234567890', sk: 'ORIG_SK_9876543210', region: 'cn-north-4' });
writeFileSync(gpath, ORIGINAL, { encoding: 'utf8' });

console.log('\n[1] 写入原始凭证:', ORIGINAL);

// ① backupGlobalCredentials
const bak = backupGlobalCredentials();
console.log('[2] backupGlobalCredentials() 返回:', bak);
console.log('    .bak 文件存在?', existsSync(bakPath) ? 'YES' : 'NO');
const bakContent = existsSync(bakPath) ? readFileSync(bakPath, 'utf8') : '';
console.log('    .bak 内容 == 原始?', bakContent === ORIGINAL ? 'YES (含原始凭证指纹)' : 'NO');

// ② 篡改凭证文件
const TAMPERED = JSON.stringify({ ak: 'TAMPERED_AK_0000000000', sk: 'TAMPERED_SK_1111111111', region: 'cn-north-4' });
writeFileSync(gpath, TAMPERED, { encoding: 'utf8' });
console.log('[3] 篡改凭证文件为:', TAMPERED);
console.log('    当前凭证内容 == 原始?', readFileSync(gpath, 'utf8') === ORIGINAL ? 'YES' : 'NO (已篡改)');

// ③ restoreGlobalCredentialsBackup
const restored = restoreGlobalCredentialsBackup();
console.log('[4] restoreGlobalCredentialsBackup() 返回:', restored);
const restoredContent = existsSync(gpath) ? readFileSync(gpath, 'utf8') : '';
console.log('    恢复后凭证 == 原始?', restoredContent === ORIGINAL ? 'YES (恢复成功)' : 'NO (恢复失败)');

// —— 断言 ——
console.log('\n=== D2-26 断言汇总 ===');
const checks = [
  ['备份文件生成', existsSync(bakPath) && bakContent === ORIGINAL],
  ['备份内容含原始凭证', bakContent === ORIGINAL],
  ['恢复函数返回真', restored === true],
  ['恢复后等于原始值', restoredContent === ORIGINAL],
];
let nPass = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (ok) nPass++;
}
console.log(`\n总计 ${checks.length} 条, PASS ${nPass}, FAIL ${checks.length - nPass}`);
console.log('结论:', nPass === checks.length ? 'PASS (备份+恢复闭环完整)' : 'FAIL');

// 清理隔离目录
try { rmSync(iso, { recursive: true, force: true }); console.log('已清理隔离目录:', iso); } catch {}
process.exit(0);