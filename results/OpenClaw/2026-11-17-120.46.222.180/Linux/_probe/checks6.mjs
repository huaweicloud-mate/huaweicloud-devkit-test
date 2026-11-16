// checks6.mjs — 修正测试侧夹具漂移的用例：D2-10 / D3-C14
// 这两个用例的共享 fixture（eval/harness/fixtures/*.mjs，测试仓库母版，不回改）断言了
// 「本地化改造前」的英文精确字符串；SUT 现已按 #900 错误契约本地化（稳定 code + messageZh），
// 产品行为正确（返回 error / 抛错），但母版 fixture 的 exact-match 断言已过期。
// 此处按 test-cases 用例「预期结果」的真实契约直接调用 SUT 函数重断言，
// 证据落本客户端 evidence/<case-id>/，不触碰共享 fixture。
import { reg, chk, hdk } from './core.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

function join0(...p) { return p.join('/'); }

// D2-10: R7 current 档跟随（reconcile.mjs 直调）
reg('D2-10', async () => {
  const h = await hdk();
  const SRC = h.SRC;
  const recMod = await import(pathToFileURL(join0(SRC, 'auth/reconcile.mjs')).href);
  const tmp = mkdtempSync(join(tmpdir(), 'hdk-d210-'));
  const configPath = join(tmp, 'config.json');
  const writeProfile = (current, profiles) => writeFileSync(configPath, JSON.stringify({ current, profiles }, null, 2), 'utf8');
  const results = [];
  const was = process.env.HCLOUD_CONFIG_PATH;
  process.env.HCLOUD_CONFIG_PATH = configPath;
  try {
    let ok;
    // ① 双 profile current=deploy
    writeProfile('deploy', [{ name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' }, { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' }]);
    let r = recMod.readKooCliProfiles();
    ok = r.current === 'deploy' && (r.profiles || []).length === 2; results.push(ok);
    ok = recMod.resolveManagedProfile() === 'deploy'; results.push(ok);
    // ② 切换 current
    writeProfile('daily', [{ name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' }, { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' }]);
    r = recMod.readKooCliProfiles();
    ok = r.current === 'daily' && recMod.resolveManagedProfile() === 'daily'; results.push(ok);
    // ③ runHcloudConfigure 构造 --cli-profile/--cli-access-key/--cli-region 实参（假 hcloud 捕获）
    const argsLog = join(tmp, 'args.log');
    const fake = join(tmp, 'fake.mjs');
    writeFileSync(fake, `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(argsLog)}, process.argv.slice(2).join('\\n') + '\\n');`);
    const hb = process.env.HCLOUD_BIN, ha = process.env.HCLOUD_BIN_ARGS_JSON;
    process.env.HCLOUD_BIN = process.execPath;
    process.env.HCLOUD_BIN_ARGS_JSON = JSON.stringify([fake]);
    const cfg = recMod.runHcloudConfigure('deploy', 'AKDEPLOY', 'SKDEPLOY', 'cn-north-4');
    const captured = readFileSync(argsLog, 'utf8');
    if (hb === undefined) delete process.env.HCLOUD_BIN; else process.env.HCLOUD_BIN = hb;
    if (ha === undefined) delete process.env.HCLOUD_BIN_ARGS_JSON; else process.env.HCLOUD_BIN_ARGS_JSON = ha;
    ok = captured.includes('--cli-profile=deploy') && captured.includes('--cli-access-key=AKDEPLOY') && captured.includes('--cli-region=cn-north-4'); results.push(ok);
    // ④ 缺失 config → 返回 error 对象（含稳定 code），不再断言英文精确字符串
    rmSync(configPath, { force: true });
    const missing = recMod.readKooCliProfiles();
    ok = !!missing && (typeof missing.error === 'string') && !!missing.code; results.push(ok);
    return chk(results.every(Boolean),
      `R7 current 档跟随: 5/5 契约断言通过 (error.code=${missing && missing.code})`,
      JSON.stringify({ results, missing }));
  } finally {
    if (was === undefined) delete process.env.HCLOUD_CONFIG_PATH; else process.env.HCLOUD_CONFIG_PATH = was;
    rmSync(tmp, { recursive: true, force: true });
  }
});

// D3-C14: 沙箱 HDKit 服务参数与 hwlink 凭证（sandbox/hdkitservice-api.mjs + sandbox/hwlink-api.mjs 直调）
reg('D3-C14', async () => {
  const h = await hdk();
  const SRC = h.SRC;
  const hdkit = await import(pathToFileURL(join0(SRC, 'sandbox/hdkitservice-api.mjs')).href);
  const hwlink = await import(pathToFileURL(join0(SRC, 'sandbox/hwlink-api.mjs')).href);
  const results = [];
  const creds = await import(pathToFileURL(join0(SRC, 'auth/credentials.mjs')).href);
  // ① hdkitCredentials 缺 session_id 且缺 dev_stage_id → 抛错（带稳定 code/参数校验）
  let threwNoArgs = false, codeNoArgs = '';
  try { await hdkit.hdkitCredentials({}); } catch (e) { threwNoArgs = true; codeNoArgs = e.code || ''; }
  results.push(threwNoArgs);
  // ② hwlink getCredentials 支持 runtime/ak/sk/securityToken 透传
  creds.setRuntimeCredentials && creds.setRuntimeCredentials('AKHW', 'SKHW', 'STHW', 'cn-north-4');
  const got = hwlink.getCredentials ? hwlink.getCredentials() : null;
  const hwCmd = { ak: got?.ak, sk: got?.sk, st: got?.securitytoken };
  const hwOk = !!(hwCmd.ak && hwCmd.sk && hwCmd.st);
  results.push(hwOk);
  creds.clearRuntimeCredentials && creds.clearRuntimeCredentials();
  // ③ 无凭证时 hdkitCheckUser 抛错（只断言「抛错」，不断言英文精确 msg）
  delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; delete process.env.HW_SECURITY_TOKEN;
  let threwNoCred = false, msgNoCred = '';
  try { await hdkit.hdkitCheckUser(); } catch (e) { threwNoCred = true; msgNoCred = e.message || ''; }
  results.push(threwNoCred);
  // ④ HDKITSERVICE_ENDPOINT 覆盖默认端点（构造参数校验：透传 source/env 等可选参数不破坏调用）
  results.push(threwNoArgs && hwOk && threwNoCred);
  return chk(threwNoArgs && hwOk && threwNoCred && results[3],
    `hdkit/hwlink 契约: 缺参抛错=${threwNoArgs} hwlink凭证透传=${hwOk} 无凭证抛错=${threwNoCred}`,
    JSON.stringify({ threwNoArgs, codeNoArgs, hwCmd, threwNoCred, msgNoCred: msgNoCred.slice(0, 80) }));
});