#!/usr/bin/env node
// D2 认证域 reconcile 契约：R5(命名档)/R7(current档)/fingerprint/authEncrypt跳过(#533)/isManualModified
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const REC = await import(pathToFileURL('C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs').href);
const CRED = await import(pathToFileURL('C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);

let pass = 0, fail = 0;
function check(n, c, d = '') { if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); } else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }
function freshHome() {
  const home = mkdtempSync(join(tmpdir(), 'd2rec-'));
  for (const k of ['HUAWEICLOUD_HOME', 'HCLOUD_CONFIG_PATH']) delete process.env[k];
  process.env.HUAWEICLOUD_HOME = home;
  process.env.HCLOUD_CONFIG_PATH = join(home, 'no-hcloud.json'); // 隔离真实 ~/.hcloud
  return home;
}
function writeHcloud(home, obj, path) {
  const p = path || join(home, '.hcloud', 'config.json');
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(obj));
  process.env.HCLOUD_CONFIG_PATH = p;
  return p;
}

// ===== D2-7 无凭证降级 / scanState 空态 =====
{
  const home = freshHome();
  const res = REC.scanState();
  check('D2-7 scanState 无 KooCLI config 返回 kooCliCurrent=null', res.kooCliCurrent === null && Array.isArray(res.inconsistencies), JSON.stringify(res.kooCliCurrent));
  rmSync(home, { recursive: true, force: true });
}

// ===== fingerprint 契约 =====
{
  check('fingerprint=sha256(ak+sk)[:8]', REC.fingerprint('AK', 'SK').length === 8 && REC.fingerprint('AK', 'SK') === REC.fingerprint('AK', 'SK'));
  check('fingerprint 空输入返空', REC.fingerprint('', '') === '');
}

// ===== R7 current 档跟随（D2-10）=====
{
  const home = freshHome();
  writeHcloud(home, { current: 'deploy', profiles: [{ name: 'default' }, { name: 'deploy' }] });
  const res = REC.readKooCliProfiles();
  check('R7 readKooCliProfiles current=deploy', res.current === 'deploy', res.current);
  check('R7 resolveManagedProfile 返回 deploy', REC.resolveManagedProfile() === 'deploy');
  rmSync(home, { recursive: true, force: true });
}

// ===== R5 命名档隔离（D2-19）=====
{
  const home = freshHome();
  writeHcloud(home, { current: 'deploy', profiles: [{ name: 'default', accessKeyId: 'AKDEFAULT', secretAccessKey: 'SKDEFAULT' }, { name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' }] });
  const res = REC.readKooCliProfiles();
  const cur = res.profiles.find((p) => p.name === 'deploy');
  const def = res.profiles.find((p) => p.name === 'default');
  check('R5 多档解析 2 档', res.profiles.length === 2);
  check('R5 current 档指纹=AKDEPLOY', cur.fingerprint === REC.fingerprint('AKDEPLOY', 'SKDEPLOY'), cur.fingerprint);
  check('R5 命名档隔离(非 current 不减损)', def.fingerprint === REC.fingerprint('AKDEFAULT', 'SKDEFAULT'));
  rmSync(home, { recursive: true, force: true });
}

// ===== authEncrypt 跳过 S2 漂移（#533，D2-19/D2-20 相关）=====
{
  const home = freshHome();
  const p = writeHcloud(home, { current: 'deploy', authEncrypt: 'true', profiles: [{ name: 'deploy', accessKeyId: 'X', secretAccessKey: 'Y' }] });
  const res = REC.readKooCliProfiles();
  check('authEncrypt=true 时 profiles.encrypted=true 且 fingerprint 空', res.authEncrypt === true && res.profiles[0].encrypted === true && res.profiles[0].fingerprint === '', JSON.stringify(res.profiles[0]));
  rmSync(home, { recursive: true, force: true });
}

// ===== D2-18 isManualModified（mtime > .last_sync）=====
{
  const home = freshHome();
  const cfg = writeHcloud(home, { current: 'default', profiles: [{ name: 'default', accessKeyId: 'AK', secretAccessKey: 'SK' }] });
  const lastSync = join(home, '.config', 'huaweicloud', '.last_sync');
  mkdirSync(dirname(lastSync), { recursive: true });
  writeFileSync(lastSync, JSON.stringify({ ts: Date.now() + 86400000 })); // marker 未来
  check('D2-18 mtime<=marker 视为未手动改', REC.isManualModified(cfg) === false);
  writeFileSync(lastSync, JSON.stringify({ ts: 0 })); // marker 过去
  check('D2-18 mtime>marker 视为手动改', REC.isManualModified(cfg) === true);
  rmSync(home, { recursive: true, force: true });
}

console.log(`\n=== D2 reconcile 契约汇总: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);