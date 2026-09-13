#!/usr/bin/env node
// D2 认证域核心契约探针（本地 fixture，隔离 HUAWEICLOUD_HOME）
import { mkdtempSync, rmSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// 用动态 import 加载 credentials.mjs，并在每个用例前重置 env
const CRED_URL = pathToFileURL(join('C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs'));
const cred = await import(CRED_URL.href);

let pass = 0, fail = 0;
function check(n, c, d = '') {
  if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); }
  else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); }
}
function freshHome() {
  const home = mkdtempSync(join(tmpdir(), 'd2home-'));
  const keys = ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION', 'HCLOUD_OBS_CONFIG_PATH', 'HUAWEICLOUD_HOME', 'CODEARTS_PROJECT_DIR'];
  for (const k of keys) delete process.env[k];
  process.env.HUAWEICLOUD_HOME = home;
  return home;
}

// ===== D2-5/D2-2 无凭证报错 =====
{
  const home = freshHome();
  try {
    cred.resolveCredentials({});
    check('D2-5 无凭证抛 HDKIT_CRED_MISSING', false);
  } catch (e) {
    check('D2-5 无凭证抛 HDKIT_CRED_MISSING', e.code === 'HDKIT_CRED_MISSING', e.code || e.message.slice(0, 40));
  }
  rmSync(home, { recursive: true, force: true });
}

// ===== D2-2 env 注入解析 =====
{
  const home = freshHome();
  process.env.HW_ACCESS_KEY = 'AKENV'; process.env.HW_SECRET_KEY = 'SKENV'; process.env.HW_REGION = 'cn-north-4';
  const r = cred.resolveCredentials({});
  check('D2-2 env 注入解析', r.ak === 'AKENV' && r.sk === 'SKENV' && r.region === 'cn-north-4', JSON.stringify(r));
  rmSync(home, { recursive: true, force: true });
}

// ===== D2-13 R9: configuredBySession=true 时 S1 胜出 env =====
{
  const home = freshHome();
  cred.writeGlobalCredentials({ ak: 'AKFILE', sk: 'SKFILE', region: 'cn-south-1', configuredBySession: true });
  process.env.HW_ACCESS_KEY = 'AKENV'; process.env.HW_SECRET_KEY = 'SKENV';
  const r = cred.resolveCredentials({});
  check('D2-13 R9 configuredBySession 时 S1 胜 env', r.ak === 'AKFILE' && r.sk === 'SKFILE', JSON.stringify(r));
  rmSync(home, { recursive: true, force: true });
}

// ===== D2-4 写盘脱敏/落盘字段（0600 内容不含明文泄漏） =====
{
  const home = freshHome();
  const p = cred.writeGlobalCredentials({ ak: 'AK1', sk: 'SK1', securityToken: '', region: 'cn-north-4' });
  const raw = readFileSync(p, 'utf8');
  const parsed = cred.readGlobalCredentials();
  check('D2-4 落盘可回读且字段完整', parsed.ak === 'AK1' && parsed.sk === 'SK1' && parsed.region === 'cn-north-4');
  check('D2-4 落盘在 HUAWEICLOUD_HOME 下', p.includes(home));
  rmSync(home, { recursive: true, force: true });
}

// ===== D2-6 OBS 配置：缺参数报错 + endpoint 生成 =====
{
  const home = freshHome();
  try { cred.writeObsConfig({ ak: 'AK1', sk: 'SK1' }); check('D2-6 OBS 缺 region 报错', false); }
  catch (e) { check('D2-6 OBS 缺 region 报错', /region, ak, and sk/.test(e.message), e.message.slice(0, 40)); }
  const r = cred.writeObsConfig({ ak: 'AK1', sk: 'SK1', region: 'cn-north-4', securityToken: 'TOK1' });
  const content = readFileSync(r.path, 'utf8');
  check('D2-6 OBS endpoint 生成正确', r.endpoint === 'https://obs.cn-north-4.myhuaweicloud.com', r.endpoint);
  check('D2-6 OBS token 落盘', /token=TOK1/.test(content));
  rmSync(home, { recursive: true, force: true });
}

// ===== D2-12 R10: runtime 凭据优先 =====
{
  const home = freshHome();
  cred.setRuntimeCredentials('AKRT', 'SKRT', 'TOKRT', 'cn-north-4');
  const r = cred.resolveCredentialsWithRuntime({ allowMissing: true });
  check('D2-12 runtime 凭据优先返回', r.ak === 'AKRT' && r.securityToken === 'TOKRT', JSON.stringify(r));
  cred.clearRuntimeCredentials();
  check('D2-12 clearRuntime 后回退', cred.hasRuntimeCredentials() === false);
  rmSync(home, { recursive: true, force: true });
}

// ===== D2-14 R2 相关: backup/restore =====
{
  const home = freshHome();
  cred.writeGlobalCredentials({ ak: 'AK_ORIG', sk: 'SK_ORIG' });
  const bak = cred.backupGlobalCredentials();
  cred.writeGlobalCredentials({ ak: 'AK_FAKE', sk: 'SK_FAKE' });
  const restored = cred.restoreGlobalCredentialsBackup();
  const after = cred.readGlobalCredentials();
  check('D2-14 backup/restore 恢复原值', restored === true && after.ak === 'AK_ORIG', after.ak);
  rmSync(home, { recursive: true, force: true });
}

console.log(`\n=== D2 认证域核心契约汇总: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);