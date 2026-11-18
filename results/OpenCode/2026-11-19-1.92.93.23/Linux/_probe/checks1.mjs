// checks1.mjs — D1 升级/更新 + D2 凭证/auth 用例探针 (v2.0.0-next.4 TS 适配)
import { reg, ok, fail, spec, blocked, notrun, chk, hdk, run, sh } from './core.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const tmp = () => (await import('node:os')).tmpdir();
const rd = (p) => readFileSync(p, 'utf-8');

// ============ D1 升级/更新 ============
reg('D1-3', async () => {
  const h = await hdk();
  const r = await h.tools.callTool('huaweicloud_check_cli', {});
  const skillsRoot = join(h.SRC, '..', 'skills');
  const skills = h.tools.listSkillDirs(skillsRoot);
  const cliOk = r && !r.__error;
  return chk(cliOk, `check_cli 自检通过(skills=${skills.length})`, `check_cli 自检失败: ${JSON.stringify(r).slice(0, 200)}`);
});

reg('D1-4', async () => {
  const h = await hdk();
  const a = await h.tools.callTool('huaweicloud_check_cli', {});
  const b = await h.tools.callTool('huaweicloud_check_cli', {});
  const stable = JSON.stringify(a) === JSON.stringify(b);
  return chk(stable && a && !a.__error, 'status 二次调用幂等(结果一致)', '两次 check_cli 结果不一致');
});

reg('D1-26', async () => {
  const h = await hdk();
  const names = h.tools.TOOL_DEFINITIONS.map(t => t.name);
  const cu = h.tools.TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
  const up = h.tools.TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade');
  const cuOk = cu && cu.description && cu.inputSchema;
  const upOk = up && up.description && up.inputSchema;
  return chk(cuOk && upOk, `check_update/upgrade 均注册且含 description+inputSchema(total=${names.length})`, `缺失或 schema 不完整: check_update=${!!cuOk} upgrade=${!!upOk}`);
});

reg('D1-27', async () => {
  const h = await hdk();
  const r = h.uc.judgeUpdate('1.1.7', { latest: '1.1.7' }, null);
  return chk(r.result === 'up_to_date' && r.updateAvailable === false, JSON.stringify(r), JSON.stringify(r));
});

reg('D1-28', async () => {
  const h = await hdk();
  const r = h.uc.judgeUpdate('1.1.5', { latest: '1.1.7' }, null);
  return chk(r.result === 'update_available' && r.updateAvailable === true && r.targetVersion === '1.1.7', JSON.stringify(r), JSON.stringify(r));
});

reg('D1-30', async () => {
  const h = await hdk();
  const c = h.uc.semverCompare;
  const t1 = c('1.1.2', '1.1.1') > 0;
  const t2 = c('1.1.0', '1.1.0-next.9') > 0;
  const t3 = c('1.1.1', '1.1.1') === 0;
  return chk(t1 && t2 && t3, 'semver 多组比对正确(升>0/正式>预发布/相等=0)', `比对: ${c('1.1.2','1.1.1')},${c('1.1.0','1.1.0-next.9')},${c('1.1.1','1.1.1')}`);
});

reg('D1-31', async () => {
  const h = await hdk();
  const os = await import('node:os'); const fs = await import('node:fs');
  const file = `${os.tmpdir()}/hdk-skip-${Date.now()}.json`;
  h.uc.writeSkipState(file, '1.1.7');
  const st = h.uc.readSkipState(file);
  const j = h.uc.judgeUpdate('1.1.6', { latest: '1.1.7' }, st);
  fs.unlinkSync(file);
  const okS = st && st.dismissedVersion === '1.1.7' && j.result === 'dismissed' && j.dismissed === true;
  return chk(okS, `dismiss 冷却期内 dismissed: result=${j.result}`, JSON.stringify({ st, j }));
});

reg('D1-33', async () => {
  const h = await hdk();
  const os = await import('node:os'); const fs = await import('node:fs');
  const file = `${os.tmpdir()}/hdk-skip-${Date.now()}.json`;
  h.uc.writeSkipState(file, '1.1.6');
  const st = h.uc.readSkipState(file);
  const fieldsOk = st && st.dismissedVersion && st.dismissedAt && st.expireAt;
  const path = h.uc.resolveSkipFilePath('session-1');
  fs.unlinkSync(file);
  return chk(fieldsOk, `skip 文件字段完整; resolveSkipFilePath=${path}`, JSON.stringify({ st, path }));
});

reg('D1-39', async () => {
  return notrun('Windows 专属用例(OS 列标注专属)，本机为 Linux，不适用', 'D1-39 Windows 升级检测链(Linux 侧由展开级 EXP-NR3 代表覆盖)');
});

reg('D1-40', async () => {
  const h = await hdk();
  const target = h.uc.determineTarget('1.1.7', { latest: '1.1.6' });
  const r = h.uc.judgeUpdate('1.1.7', { latest: '1.1.6' }, null);
  const noDowngrade = r.result === 'up_to_date' || r.updateAvailable === false;
  return chk(noDowngrade, `镜像 lag 下不提示倒退: judgeUpdate=${r.result}`, JSON.stringify({ target, r }));
});

reg('D1-41', async () => {
  const h = await hdk();
  const r = await h.tools.callTool('huaweicloud_check_update', {});
  const fields = ['result', 'currentVersion', 'latestStable', 'updateAvailable', 'dismissed'];
  const okFields = fields.every(f => Object.prototype.hasOwnProperty.call(r, f));
  return chk(okFields && r && !r.__error, `check_update 契约字段齐备: ${JSON.stringify({ result: r.result, latestStable: r.latestStable, updateAvailable: r.updateAvailable })}`, JSON.stringify(r).slice(0, 300));
});

reg('D1-42', async () => {
  const h = await hdk();
  const a = await h.tools.callTool('huaweicloud_check_update', {});
  const dismissable = a && a.targetVersion && a.result === 'update_available';
  let dis = null;
  if (dismissable) dis = await h.tools.callTool('huaweicloud_check_update', { dismiss: true, dismissVersion: a.targetVersion });
  const disOk = !dismissable || (dis && dis.dismissed === true);
  return chk(disOk, `dismiss 闭环: first=${a.result} dismissed=${dis && dis.dismissed}`, JSON.stringify({ a: { result: a.result, targetVersion: a.targetVersion }, dis }));
});

reg('D1-45', async () => {
  const h = await hdk();
  const applied = h.uc.applyUpdateHint({ result: 'update_available', targetVersion: '1.1.7' }, 'test-tool', '1.1.7');
  const decorated = h.proto._decorateResult ? h.proto._decorateResult('sess-1', 'test-tool', { x: 1 }) : null;
  if (h.proto._resetHintConsumption) h.proto._resetHintConsumption();
  return chk(!!applied || !!decorated, '兜底提示 applyUpdateHint/_decorateResult 可用', `applied=${JSON.stringify(applied)}`);
});

reg('D1-65', async () => {
  const h = await hdk();
  const src1 = rd(join(h.SRC, 'update-registry.ts'));
  const src2 = rd(join(h.SRC, 'update-upgrade.ts'));
  const support = /HUAWEICLOUD_DEVKIT_DEBUG/.test(src1) || /HUAWEICLOUD_DEVKIT_DEBUG/.test(src2);
  return support ? ok('update-registry/upgrade 含 HUAWEICLOUD_DEVKIT_DEBUG 调试分支') : fail('调试模式环境变量分支缺失', 'update-registry.ts/update-upgrade.ts 无 DEBUG 分支');
});

// D1-66 遥测开关与端点：isTelemetryEnabled 随 env 切换 + 端点 env 被引用
reg('D1-66', async () => {
  const h = await hdk();
  const te = h.telemetry;
  const prev = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  const defOn = te.isTelemetryEnabled ? te.isTelemetryEnabled() : null;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const off = te.isTelemetryEnabled ? te.isTelemetryEnabled() : null;
  if (prev === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = prev;
  const srcOk = /HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT/.test(rd(join(h.SRC, 'telemetry', 'telemetry.ts')));
  const okS = defOn !== false && off === false && srcOk;
  return chk(okS, `遥测开关: 默认=${defOn} off=${off}; endpoint env 存在=${srcOk}`, JSON.stringify({ defOn, off, srcOk }));
});

reg('D1-67', async () => {
  const h = await hdk();
  const src = rd(join(h.SRC, 'setup-cli.ts'));
  const hasAgentTk = /AGENT_TOOLKIT_MODE/.test(src) && /SKIP_DSH/.test(src);
  return chk(hasAgentTk, 'AGENT_TOOLKIT_MODE/SKIP_DSH 均存在(setup-cli.ts)', 'DSH 模式环境变量缺失');
});

// D1-68 图标离线 + 区域 env 优先级：契约期望 HUAWEICLOUD_REGION 优先于 HW_REGION
reg('D1-68', async () => {
  const h = await hdk();
  const cred = rd(join(h.SRC, 'auth', 'credential-resolver.ts'));
  const idxHR = cred.indexOf('HUAWEICLOUD_REGION');
  const idxHW = cred.indexOf('HW_REGION');
  const hwFirst = idxHW >= 0 && (idxHR < 0 || idxHW < idxHR);
  const iconsOffline = /ICONS_OFFLINE/.test(rd(join(h.SRC, 'icon-library.ts')));
  if (hwFirst) {
    return spec('区域 env 优先级契约漂移：实现 HW_REGION 优先于 HUAWEICLOUD_REGION，用例期望 HUAWEICLOUD_REGION 优先(auth/credential-resolver.ts)', `credential-resolver.ts 中 HW_REGION(idx=${idxHW}) 先于 HUAWEICLOUD_REGION(idx=${idxHR})；ICONS_OFFLINE=${iconsOffline}`);
  }
  return chk(iconsOffline, `HUAWEICLOUD_REGION 优先(符合契约) + ICONS_OFFLINE 分支存在=${iconsOffline}`, JSON.stringify({ idxHR, idxHW, iconsOffline }));
});

// D1-69 CLI help 子命令：spawn 已编译 dist/setup-cli.js
reg('D1-69', async () => {
  const cli = join(process.env.HOME, 'nodejs', 'lib', 'node_modules', 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'dist', 'setup-cli.js');
  const r = run(`node "${cli}" --help 2>&1`);
  const okHelp = r.status === 0 && /Usage|Commands/.test(r.text);
  return chk(okHelp, 'CLI --help 子命令可用(exit=0, 含 Usage)', r.text.slice(0, 300));
});

reg('D1-70', async () => {
  const h = await hdk();
  const os = await import('node:os');
  const tmp = os.tmpdir();
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = tmp;
  h.proxyCfg.writeProxyConfig({ http_proxy: 'http://127.0.0.1:8080', https_proxy: 'http://127.0.0.1:8080', no_proxy: 'localhost,.internal' });
  const read = h.proxyCfg.readProxyConfig();
  const gs = h.proxyCfg.getProxySettings('https://api.example.com');
  const noProxy = h.proxyCfg.getProxySettings('http://localhost:9999');
  h.proxyCfg.clearProxyConfig();
  if (old) process.env.HUAWEICLOUD_HOME = old; else delete process.env.HUAWEICLOUD_HOME;
  const okS = read && (read.http_proxy || read.HTTP_PROXY) && gs && noProxy === null;
  return chk(okS, `proxy write/read/getProxySettings/no_proxy 绕过正确: ${JSON.stringify({ read, gs, noProxy })}`, JSON.stringify({ read, gs, noProxy }));
});

// ============ D2 auth ============
reg('D2-1', async () => {
  const h = await hdk();
  const st = h.authSvc.getAuthStatus('all');
  const koo = sh(['VPC', 'ListVpcs', '--cli-region=cn-north-4']);
  const obs = sh(['OBS', 'ls']);
  const obsOk = /Bucket|obs:/.test(obs.text);
  const okS = !!st && koo.ok && obsOk;
  return chk(okS, `auth 三端可用: auth_status=${JSON.stringify(st).slice(0, 100)} KooCLI=${koo.ok} OBS=${obsOk}`, JSON.stringify({ st, koo: koo.ok, obs: obs.text.slice(0, 80) }));
});

reg('D2-2', async () => {
  const h = await hdk();
  const s = h.authSvc.getAuthStatus('all');
  return chk(s && typeof s === 'object', `auth_status 判定可执行: ${JSON.stringify(s).slice(0, 200)}`, 'auth_status 无法调用');
});

reg('D2-4', async () => {
  const h = await hdk();
  const r1 = h.sp.redactSecrets('ak=AK123456 sk=SKsecret');
  const r2 = h.sp.redactSecrets('AK=AK123456 SK=SKsecret');
  const lowerRedacted = !/ak=AK123456|sk=SKsecret/i.test(r1);
  return lowerRedacted ? ok('小写 ak=/sk= 也已脱敏', `r1=${r1}`) : fail('凭证脱敏漏小写 ak=/sk=（明文残留）', `redactSecrets('ak=AK123456 sk=SKsecret')=${r1}; 大写=${r2}`);
});

reg('D2-5', async () => {
  const h = await hdk();
  const s = h.authSvc.getAuthStatus('all');
  const com = h.authSvc.computeOnboarding({ credentials: { configured: false }, reconciled: false });
  return chk(!!s || !!com, '凭证缺失时返回状态+指引结构', JSON.stringify({ s, com }).slice(0, 250));
});

// D2-10 KooCLI 多 profile：readKooCliProfiles/resolveManagedProfile 直调
reg('D2-10', async () => {
  const h = await hdk();
  const os = await import('node:os'); const fs = await import('node:fs'); const path = await import('node:path');
  const tmp2 = path.join(os.tmpdir(), `hdk-d210-${Date.now()}`);
  fs.mkdirSync(tmp2, { recursive: true });
  const configPath = path.join(tmp2, 'config.json');
  const old = process.env.HCLOUD_CONFIG_PATH;
  process.env.HCLOUD_CONFIG_PATH = configPath;
  try {
    const write = (current, profiles) => fs.writeFileSync(configPath, JSON.stringify({ current, profiles }, null, 2), 'utf-8');
    write('deploy', [{ name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' }, { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' }]);
    let res = h.authRec.readKooCliProfiles();
    const parseOk = res && res.current === 'deploy' && res.profiles && res.profiles.length === 2;
    const resolveDeploy = h.authRec.resolveManagedProfile() === 'deploy';
    write('daily', [{ name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' }, { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' }]);
    res = h.authRec.readKooCliProfiles();
    const switchOk = res && res.current === 'daily' && h.authRec.resolveManagedProfile() === 'daily';
    fs.rmSync(configPath, { force: true });
    const missing = h.authRec.readKooCliProfiles();
    const errOk = missing && (missing.code === 'HDKIT_KOOCLI_NOT_READY' || !!missing.error);
    const okS = parseOk && resolveDeploy && switchOk && errOk;
    return chk(okS, `profile 解析/切换/缺失config错误契约: parse=${parseOk} resolve=${resolveDeploy} switch=${switchOk}`, JSON.stringify({ parseOk, resolveDeploy, switchOk, errOk, missing }));
  } catch (e) {
    return fail(`D2-10 直调异常: ${String(e).slice(0, 160)}`);
  } finally {
    if (old === undefined) delete process.env.HCLOUD_CONFIG_PATH; else process.env.HCLOUD_CONFIG_PATH = old;
    fs.rmSync(tmp2, { recursive: true, force: true });
  }
});

reg('D2-11', async () => {
  const h = await hdk();
  const fs = await import('node:fs');
  let cred = null;
  try { cred = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/huaweicloud/credentials.json`, 'utf-8')); } catch {}
  if (!cred || !cred.ak) return blocked('credentials.json 缺失', '解除: 配置真云凭证');
  const r = await h.tools.callTool('huaweicloud_auth_switch', { action: 'persist', ak: cred.ak, sk: cred.sk, securityToken: 'STS_TOKEN_TEST_XYZ', region: cred.region || 'cn-north-4' });
  const txt = JSON.stringify(r);
  const rejected = /rejected|error|Temporary STS|cannot be persisted/i.test(txt);
  return chk(rejected, `STS persist 拒绝落盘(R3): ${txt.slice(0, 140)}`, txt.slice(0, 240));
});

reg('D2-12', async () => {
  const h = await hdk();
  const sync = h.authSvc.syncAuth('all');
  return chk(!!sync, `auth_sync 可调用(R10 runtime 抑制): ${JSON.stringify(sync).slice(0, 150)}`, 'auth_sync 失败');
});

// D2-13 configuredBySession 优先 env (R9)
reg('D2-13', async () => {
  const h = await hdk();
  const os = await import('node:os'); const fs = await import('node:fs'); const path = await import('node:path');
  const iso = path.join(os.tmpdir(), `hdk-d213-${Date.now()}`);
  fs.mkdirSync(iso, { recursive: true });
  const backup = { HOME: process.env.HOME, HUAWEICLOUD_HOME: process.env.HUAWEICLOUD_HOME, HW_ACCESS_KEY: process.env.HW_ACCESS_KEY, HW_SECRET_KEY: process.env.HW_SECRET_KEY };
  process.env.HOME = iso; process.env.HUAWEICLOUD_HOME = iso;
  let s1Wins = false, envFallback = false;
  try {
    h.authCred.writeGlobalCredentials({ ak: 'AK_S1', sk: 'SK_S1', region: 'cn-north-4' });
    h.authCred.setConfiguredBySession(true);
    let r = h.authCred.resolveCredentials({});
    s1Wins = !!(r && r.ak === 'AK_S1');
    h.authCred.setConfiguredBySession(false);
    process.env.HW_ACCESS_KEY = 'AKENV'; process.env.HW_SECRET_KEY = 'SKENV';
    r = h.authCred.resolveCredentials({});
    envFallback = !!(r && r.ak === 'AKENV');
    const okS = s1Wins && envFallback;
    return chk(okS, `configuredBySession 优先 S1(${s1Wins}) + 清除后 env 兜底(${envFallback})`, JSON.stringify({ s1Wins, envFallback, r }));
  } catch (e) {
    return fail(`D2-13 异常: ${String(e).slice(0, 160)}`);
  } finally {
    for (const k of Object.keys(backup)) { if (backup[k] === undefined) delete process.env[k]; else process.env[k] = backup[k]; }
    fs.rmSync(iso, { recursive: true, force: true });
  }
});

reg('D2-16', async () => {
  const h = await hdk();
  const src = rd(join(h.SRC, 'lib', 'credentials.ts'));
  const erase = /creds-import/.test(src) && /rmSync\(path, \{\s*force:\s*true\s*\}\)/.test(src);
  return chk(erase, 'auth import 后擦除 creds-import.json 逻辑存在', 'import 擦除逻辑缺失');
});

reg('D2-26', async () => {
  const h = await hdk();
  const os = await import('node:os'); const fs = await import('node:fs'); const path = await import('node:path');
  const iso = path.join(os.tmpdir(), `hdk-bk-${Date.now()}`);
  fs.mkdirSync(iso, { recursive: true });
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = iso;
  let bk = false, re = false;
  try {
    h.authCred.writeGlobalCredentials({ ak: 'AK_TEST', sk: 'SK_TEST', region: 'cn-north-4' });
    bk = !!h.authCred.backupGlobalCredentials();
    h.authCred.writeGlobalCredentials({ ak: 'AK_BROKEN', sk: 'SK_BROKEN', region: 'cn-north-4' });
    re = !!h.authCred.restoreGlobalCredentialsBackup();
  } finally {
    if (old) process.env.HUAWEICLOUD_HOME = old; else delete process.env.HUAWEICLOUD_HOME;
    fs.rmSync(iso, { recursive: true, force: true });
  }
  return chk(bk && re, `backup/restore 闭环: backup=${bk} restore=${re}`, JSON.stringify({ bk, re }));
});

// D2-27 KooCLI 版本管理
reg('D2-27', async () => {
  const h = await hdk();
  const k = h.kv;
  const baseOk = k.KOO_CLI_BASE === 'https://cn-north-4-hdn-koocli.obs.cn-north-4.myhuaweicloud.com/cli';
  const cmpOk = k.compareVersion && k.compareVersion('1.0.0', '0.9.0') > 0;
  const parseOk = k.parseHcloudVersion && typeof k.parseHcloudVersion('KooCLI version: 7.2.12') === 'string';
  const ver = k.getKooCliVersion ? k.getKooCliVersion() : null;
  return chk(baseOk && cmpOk && parseOk, `KooCLI 版本管理: base=${baseOk} compare=${cmpOk} parse=${parseOk} ver=${ver}`, JSON.stringify({ baseOk, cmpOk, parseOk, ver }));
});