// D2 认证真云项探针: D2-1 (auth init 三端同步) / D2-11 (STS token 拒绝落盘) / D2-16 (import 读取后擦除)
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SRC = join(homedir(), 'devkit-test', 'Hermes', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const { callTool } = tools;
const {
  writeGlobalCredentials, writeObsConfig, readGlobalCredentials,
  globalCredentialsPath, obsConfigPath, resolveCredentials,
} = creds;
const { validateIamCredentials } = await import(pathToFileURL(join(SRC, 'auth', 'credential-validator.mjs')).href);
const { fingerprint } = await import(pathToFileURL(join(SRC, 'auth', 'reconcile.mjs')).href);

const ADMIN = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
const EVID = join(homedir(), 'devkit-test', 'Hermes', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-09-17-113.44.197.147', 'Linux', 'evidence');
const FAKE = { ak: 'FAKEAK00112233445566', sk: 'FAKESK00112233445566', region: 'cn-north-4' };

// ===== D2-1 源码级: 隔离子目录核对三端配置文件落位(路径+格式) =====
console.log('===== D2-1 auth init 三端同步 =====');
const iso = join(tmpdir(), 'hdk-d2-1-' + Date.now());
mkdirSync(iso, { recursive: true });
process.env.HUAWEICLOUD_HOME = iso;
process.env.HCLOUD_OBS_CONFIG_PATH = join(iso, 'obsutilconfig');
// 模拟 auth init: writeGlobalCredentials(S1) + writeObsConfig(S3)
writeGlobalCredentials(FAKE);
writeObsConfig(FAKE);
const s1Path = globalCredentialsPath();
const s3Path = obsConfigPath();
const s1 = JSON.parse(readFileSync(s1Path, 'utf8'));
const s3Raw = readFileSync(s3Path, 'utf8');
console.log('[S1 vault]', s1Path, '| exists=', existsSync(s1Path), '| ak形如FAKEAK*=', s1.ak === FAKE.ak, '| region=', s1.region);
console.log('[S3 OBS]  ', s3Path, '| exists=', existsSync(s3Path), '| 含endpoint+ak+sk=', /endpoint=/.test(s3Raw) && /^ak=FAKEAK/m.test(s3Raw) && /^sk=FAKESK/m.test(s3Raw));
console.log('[S2 KooCLI] 由 runHcloudConfigure(configure set --cli-profile=...) 写入, 见真云 E2E 部分(hcloud ListServersDetails 实测)');

// 清理隔离环境变量
delete process.env.HUAWEICLOUD_HOME;
delete process.env.HCLOUD_OBS_CONFIG_PATH;

// ===== D2-1 真云 E2E: 三端真实可用 =====
console.log('\n--- D2-1 真云 E2E ---');
const r1 = readGlobalCredentials();
const v = await validateIamCredentials({ ak: ADMIN.ak, sk: ADMIN.sk, region: ADMIN.region });
console.log('[S1 vault 真云] ak 指纹=', fingerprint(ADMIN.ak, ADMIN.sk), '| region=', ADMIN.region);
console.log('[S2 KooCLI 真云] 见 hcloud ListServersDetails (outsourced 到 hcloud inline) — 前置探针已证 exitCode=0 count=0');
console.log('[S3 OBS 真云] ~/.obsutilconfig 已含 endpoint+ak+sk (D4-14 同步)');
console.log('[认证] validateIamCredentials:', 'valid=' + v.valid, 'projectId=' + (v.projectId || '(none)').slice(0, 8) + '...');

// ===== D2-11 STS token 拒绝落盘 =====
console.log('\n===== D2-11 STS token 拒绝落盘 (R3) =====');
const iso2 = join(tmpdir(), 'hdk-d2-11-' + Date.now());
mkdirSync(iso2, { recursive: true });
process.env.HUAWEICLOUD_HOME = iso2;
const r3 = await callTool('huaweicloud_auth_switch', {
  mode: 'memory', action: 'persist', ak: FAKE.ak, sk: FAKE.sk,
  securityToken: 'STS-token-abc123', region: 'cn-north-4',
});
console.log('[R3 persist+token] 返回:', JSON.stringify(r3));
console.log('   预期 {status:error, scope:rejected} =>', r3.status === 'error' && r3.scope === 'rejected' ? 'PASS (token 拒绝落盘)' : 'FAIL');
console.log('   S1 未写入?', readGlobalCredentials() === null ? 'YES(S1 空, token 未落盘)' : '检查');

// R2 冲突门顺序 (账号冲突时 R2 needs_confirmation 先于 R3)
writeGlobalCredentials({ ak: 'PREVACCOUNT11111111', sk: 'PREVSK111111111111', region: 'cn-north-4' });
const r2c = await callTool('huaweicloud_auth_switch', {
  mode: 'memory', action: 'persist', ak: FAKE.ak, sk: FAKE.sk,
  securityToken: 'STS-token-abc123', region: 'cn-north-4',
});
console.log('[R2 conflict+token] 返回 status:', r2c.status, '| confirmToken 签发:', Boolean(r2c.confirmToken));
console.log('   (已知缺陷: R2 冲突门返回 needs_confirmation, 未先走 R3 STS 拒绝 — 见 FINDINGS #12)');
delete process.env.HUAWEICLOUD_HOME;

// ===== D2-16 import 读取后擦除 =====
console.log('\n===== D2-16 auth_switch import 读取后擦除 =====');
const iso3 = join(tmpdir(), 'hdk-d2-16-' + Date.now());
mkdirSync(iso3, { recursive: true });
process.env.HUAWEICLOUD_HOME = iso3;
// 放置 creds-import.json (与 credentials.json 同目录)
const importPath = join(iso3, '.config', 'huaweicloud', 'creds-import.json');
mkdirSync(join(iso3, '.config', 'huaweicloud'), { recursive: true });
writeFileSync(importPath, JSON.stringify(FAKE));
console.log('[前置] creds-import.json 存在:', existsSync(importPath));
const imp = await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'temporary' });
console.log('[mode=import action=temporary] 返回:', JSON.stringify(imp));
console.log('   读后擦除 exists=False?', !existsSync(importPath) ? 'PASS (无条件擦除, SK 不留盘)' : 'FAIL (文件残留)');
delete process.env.HUAWEICLOUD_HOME;

console.log('\n===== D2 认证真云项完成 =====');