// D2-26 凭证备份与恢复（backupGlobalCredentials/restoreGlobalCredentialsBackup）
// 隔离环境：HUAWEICLOUD_HOME 指向临时目录，避免污染真实凭证库。
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tmp = mkdtempSync(join(tmpdir(), 'hdk-d2-26-'));
process.env.HUAWEICLOUD_HOME = tmp;

const { backupGlobalCredentials, restoreGlobalCredentialsBackup, globalCredentialsPath } =
  await import('/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');

const path = globalCredentialsPath();
mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });

const ORIGINAL = { ak: 'FAKE_D2_26_AK', sk: 'FAKE_D2_26_SK', region: 'cn-north-4' };
writeFileSync(path, JSON.stringify(ORIGINAL), { encoding: 'utf8' });

let pass = 0, fail = 0; const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected; ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// ① backup 前凭证存在
check('D2-26', 'backup 前置: 凭证库存在', existsSync(path), true);

// ② backup 生成 .bak 且内容 = 原始（指纹一致）
const bakPath = backupGlobalCredentials();
check('D2-26', 'backupGlobalCredentials 返回 .bak 路径', bakPath === `${path}.bak`, true);
check('D2-26', '.bak 文件已生成', existsSync(`${path}.bak`), true);
const bakContent = JSON.parse(readFileSync(`${path}.bak`, 'utf8'));
const origSig = JSON.stringify(ORIGINAL);
check('D2-26', '.bak 内容指纹 == 原始凭证指纹', JSON.stringify(bakContent) === origSig, true);

// ③ 篡改凭证文件
writeFileSync(path, JSON.stringify({ ak: 'TAMPERED_AK', sk: 'TAMPERED_SK', region: 'cn-north-4' }), 'utf8');
check('D2-26', '篡改后凭证 != 原始', JSON.stringify(JSON.parse(readFileSync(path, 'utf8'))) !== origSig, true);

// ④ restore 恢复为 backup 前内容
const restored = restoreGlobalCredentialsBackup();
check('D2-26', 'restoreGlobalCredentialsBackup 返回 true', restored, true);
const after = JSON.parse(readFileSync(path, 'utf8'));
check('D2-26', '恢复后凭证指纹 == 原始指纹', JSON.stringify(after) === origSig, true);
check('D2-26', '恢复后不再含被篡改值', after.ak === ORIGINAL.ak && after.sk === ORIGINAL.sk, true);

// ⑤ 无 backup 时 restore 返回 false（负向边界）
rmSync(`${path}.bak`, { force: true });
check('D2-26', '无 .bak 时 restore 返回 false', restoreGlobalCredentialsBackup(), false);

// 清理
rmSync(tmp, { recursive: true, force: true });
process.env.HUAWEICLOUD_HOME = '';

console.log('\n=== D2-26 凭证备份与恢复探针结果 ===');
for (const l of lines) console.log(l);
console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);