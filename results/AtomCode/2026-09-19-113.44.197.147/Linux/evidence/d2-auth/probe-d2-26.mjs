// D2-26 凭证备份与恢复：backupGlobalCredentials / restoreGlobalCredentialsBackup
// hermetic：用 HUAWEICLOUD_HOME 临时目录隔离，不触碰真实凭证。
import {
  backupGlobalCredentials,
  restoreGlobalCredentialsBackup,
  globalCredentialsPath,
} from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tmp = join(tmpdir(), 'hdk-d2-26-' + Date.now());
process.env.HUAWEICLOUD_HOME = tmp;

const original = JSON.stringify({ ak: 'AKIA_ORIGINAL_AK_1234567890', sk: 'SK_ORIGINAL_SECRET_abcdefghijkl' });
const hash = (s) => createHash('sha256').update(s).digest('hex');

let pass = 0, fail = 0;
function chk(id, desc, ok, detail) {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${ok}${detail ? ' | ' + detail : ''}`);
}

const credPath = globalCredentialsPath();
mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });
writeFileSync(credPath, original);
const originalHash = hash(readFileSync(credPath, 'utf8'));

const bak = backupGlobalCredentials();
chk('D2-26', 'backup 返回 .bak 路径且文件已生成', !!bak && existsSync(credPath + '.bak'), 'bak=' + bak);
chk('D2-26', 'backup 内容指纹 == 原始凭证', existsSync(credPath + '.bak') && hash(readFileSync(credPath + '.bak', 'utf8')) === originalHash, '');

// 篡改凭证文件
writeFileSync(credPath, JSON.stringify({ ak: 'TAMPERED_AK', sk: 'TAMPERED_SK' }));
chk('D2-26', '篡改后凭证指纹 != 原始', hash(readFileSync(credPath, 'utf8')) !== originalHash, '');

const restored = restoreGlobalCredentialsBackup();
chk('D2-26', 'restore 返回 true', restored === true, 'restored=' + restored);
chk('D2-26', 'restore 后凭证指纹 == 原始（恢复为 backup 前内容）', hash(readFileSync(credPath, 'utf8')) === originalHash, '');

rmSync(tmp, { recursive: true, force: true });
console.log(`TOTAL pass=${pass} fail=${fail}`);