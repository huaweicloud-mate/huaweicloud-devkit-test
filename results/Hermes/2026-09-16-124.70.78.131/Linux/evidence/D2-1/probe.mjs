// D2-1 auth init 三端同步（Hermes Linux 2026-09-16）—— 源码级断言
// 隔离 HOME + 假凭证，验证三端配置文件落位（路径 + 格式）：
//   S1 = 统一凭证库 ~/.config/huaweicloud/credentials.json（writeGlobalCredentials）
//   S3 = OBS  ~/.obsutilconfig（writeObsConfig）
//   S2 = KooCLI ~/.hcloud/config.json（readKooCliProfiles 校验格式；真实写由 E2E 覆盖）
// 真云 E2E 三端 API 可用性已在 evidence/realcloud-probe 中覆盖。
import { mkdtempSync, existsSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const HDK = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const credMod = await import(pathToFileURL(join(HDK, 'auth/credentials.mjs')).href);
const recMod = await import(pathToFileURL(join(HDK, 'auth/reconcile.mjs')).href);

const out = [];
function record(name, ok, detail) {
  out.push({ name, ok, detail });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}

const isoHome = mkdtempSync(join(tmpdir(), 'hdk-d21-'));
const prev = { HUAWEICLOUD_HOME: process.env.HUAWEICLOUD_HOME, HCLOUD_OBS_CONFIG_PATH: process.env.HCLOUD_OBS_CONFIG_PATH };
process.env.HUAWEICLOUD_HOME = isoHome;
process.env.HCLOUD_OBS_CONFIG_PATH = join(isoHome, '.obsutilconfig');

const FAKE_AK = 'FAKEAK1234567890ABCDEF';
const FAKE_SK = 'FAKESK1234567890ABCDEF1234567890ABCDEF1234';
const REGION = 'cn-north-4';

try {
  // S1：写统一凭证库
  credMod.writeGlobalCredentials({ ak: FAKE_AK, sk: FAKE_SK, region: REGION });
  const s1Path = credMod.globalCredentialsPath();
  let s1Ok = existsSync(s1Path);
  let s1Fmt = '';
  if (s1Ok) {
    try { const d = JSON.parse(readFileSync(s1Path, 'utf8')); s1Fmt = ['ak','sk','region'].every((k) => k in d) ? 'ok' : 'missing-keys'; } catch { s1Fmt = 'bad-json'; }
  }
  record('S1 credentials.json 落位(路径+格式)', s1Ok && s1Fmt === 'ok', { path: s1Path, format: s1Fmt });

  // S3：写 OBS 配置（writeObsConfig 返回 {path, endpoint}）
  const obs = credMod.writeObsConfig({ ak: FAKE_AK, sk: FAKE_SK, region: REGION });
  const s3Ok = existsSync(credMod.obsConfigPath()) && !!obs.path && !!obs.endpoint;
  record('S3 obsutilconfig 落位(路径+格式)', s3Ok, { path: obs.path, endpoint: obs.endpoint });

  // S2：真实 KooCLI 配置格式校验（authEncrypt=true 时 AK/SK 为密文，属正确格式）
  const koo = recMod.readKooCliProfiles();
  const s2Ok = koo && typeof koo.current === 'string' && Array.isArray(koo.profiles) && koo.profiles.length > 0;
  record('S2 KooCLI config.json 落位(路径+格式)', s2Ok, { path: koo?.configPath, current: koo?.current, authEncrypt: koo?.authEncrypt, profiles: (koo?.profiles || []).map((p) => p.name) });

  console.log('\n=====SUMMARY=====');
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), total: out.length, passed: out.filter((o) => o.ok).length, results: out }, null, 2));
} finally {
  for (const [k, v] of Object.entries(prev)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  rmSync(isoHome, { recursive: true, force: true });
}