// D2-26 凭证备份与恢复（backupGlobalCredentials / restoreGlobalCredentialsBackup）
import { pathToFileURL } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { backupGlobalCredentials, restoreGlobalCredentialsBackup, globalCredentialsPath } = await import(pathToFileURL(SRC + '/auth/credentials.mjs').href);

// 隔离 HUAWEICLOUD_HOME，避免污染真实管理员凭证
const HOME = mkdtempSync(join(tmpdir(), 'hdktest-d226-'));
const cfg = join(HOME, '.config', 'huaweicloud');
mkdirSync(cfg, { recursive: true });
process.env.HUAWEICLOUD_HOME = HOME;

const path = globalCredentialsPath();
const ORIG = JSON.stringify({ ak: 'AKORIGBACKUPTEST000000000000', sk: 'skOrigBackupTest000000000000', region: 'cn-north-4' });
const TAMPERED = JSON.stringify({ ak: 'AKTAMPERED000000000000000000', sk: 'skTampered000000000000000000', region: 'cn-north-4' });
const sha = (s) => createHash('sha256').update(s).digest('hex');

writeFileSync(path, ORIG, 'utf8');
const origHash = sha(ORIG);
console.log('credentials path:', path);
console.log('BEFORE exists:', existsSync(path), '| hash:', origHash.slice(0, 12));

const bakPath = backupGlobalCredentials();
const bakExists = !!bakPath && existsSync(bakPath);
const bakMatches = bakExists && sha(readFileSync(bakPath, 'utf8')) === origHash;
console.log('backupPath:', bakPath);
console.log('ASSERT backup 文件生成:', bakExists);
console.log('ASSERT backup 内容=原始凭证:', bakMatches);

// 篡改凭证文件
writeFileSync(path, TAMPERED, 'utf8');
console.log('AFTER tamper hash:', sha(readFileSync(path, 'utf8')).slice(0, 12), '| != orig:', sha(readFileSync(path, 'utf8')) !== origHash);

const restored = restoreGlobalCredentialsBackup();
const afterHash = sha(readFileSync(path, 'utf8'));
const restoredOk = restored === true && afterHash === origHash;
console.log('ASSERT restore 返回 true:', restored === true);
console.log('ASSERT restore 后凭证恢复为原始值:', afterHash === origHash);

rmSync(HOME, { recursive: true, force: true });
const passed = bakExists && bakMatches && restored === true && restoredOk;
console.log('VERDICT', passed ? 'PASS' : 'FAIL');
process.exit(passed ? 0 : 1);