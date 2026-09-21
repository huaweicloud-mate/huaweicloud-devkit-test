// D2-26 (P1): 凭证备份与恢复（backupGlobalCredentials/restoreGlobalCredentialsBackup）
// 直调 hdk 源码函数，隔离 HOME（HUAWEICLOUD_HOME 指向临时目录，不触碰真实凭证）。
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { backupGlobalCredentials, restoreGlobalCredentialsBackup } =
  await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0,120), expected: String(expected) });
}

const home = mkdtempSync(join(tmpdir(), 'hdk-d226-'));
process.env.HUAWEICLOUD_HOME = home;
const cfgDir = join(home, '.config', 'huaweicloud');
mkdirSync(cfgDir, { recursive: true });
const credPath = join(cfgDir, 'credentials.json');
const ORIGINAL = '{"ak":"AK-ORIGINAL-123456","sk":"SK-ORIGINAL-abcdef","region":"cn-north-4"}';
writeFileSync(credPath, ORIGINAL, 'utf8');

// 1) backup 生成 .bak 且内容一致
const bakPath = backupGlobalCredentials();
const bakOk = bakPath === credPath + '.bak' && existsSync(bakPath) && readFileSync(bakPath, 'utf8') === ORIGINAL;
test('D2-26', 'backup-creates-bak', bakOk, bakPath ? 'bak 存在且内容一致' : 'null', '返回 .bak 路径且内容=原始');

// 2) 篡改凭证文件
const TAMPERED = '{"ak":"AK-TAMPERED-999999","sk":"SK-TAMPERED-zzzz"}';
writeFileSync(credPath, TAMPERED, 'utf8');
const tamperedBefore = readFileSync(credPath, 'utf8');
test('D2-26', 'tamper-effective', tamperedBefore === TAMPERED, '已篡改', '伪造新内容生效');

// 3) restore 恢复为 backup 前内容
const restored = restoreGlobalCredentialsBackup();
const afterRestore = readFileSync(credPath, 'utf8');
test('D2-26', 'restore-recovers', restored === true && afterRestore === ORIGINAL,
     `restore=${restored} content=${afterRestore === ORIGINAL ? '==原始' : afterRestore.slice(0,40)}`, 'restore=true 且内容=原始');

// 清理临时目录（不碰真实凭证）
rmSync(home, { recursive: true, force: true });

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-1.94.218.129/Linux/evidence/D2-26/stdout.log'), output, 'utf8');
console.log(output);