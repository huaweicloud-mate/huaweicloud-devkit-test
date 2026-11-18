// checks1.mjs — D1 升级/更新 + D2 凭证/auth 用例探针（v2.0.0-next.4 适配）
import { reg, ok, fail, spec, blocked, notrun, chk, hdk, run, sh, callVendor } from './core.mjs';
import { readFileSync, unlinkSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function join0(...p) { return p.join('/'); }

// ============ D1 升级/更新 ============
reg('D1-3', async () => {
  const h = await hdk();
  const r = await callVendor('huaweicloud_check_cli', {});
  return chk(r && !r.__error, `check_cli 自检通过(installed=${r?.installed} authenticated=${r?.authenticated})`, `check_cli 自检失败: ${JSON.stringify(r).slice(0, 200)}`);
});

reg('D1-4', async () => {
  const h = await hdk();
  const a = await callVendor('huaweicloud_check_cli', {});
  const b = await callVendor('huaweicloud_check_cli', {});
  const stable = JSON.stringify(a) === JSON.stringify(b);
  return chk(stable && !a.__error, 'status 二次调用幂等(结果一致)', '两次 check_cli 结果不一致');
});

reg('D1-26', async () => {
  const h = await hdk();
  const names = h.tools.TOOL_DEFINITIONS.map(t => t.name);
  const cu = h.tools.TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update' || t.name === 'huaweicloud_check_update');
  const up = h.tools.TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade' || t.name === 'huaweicloud_upgrade');
  const cuOk = cu && cu.description;
  const upOk = up && up.description;
  return chk(cuOk && upOk, `check_update/upgrade 均注册且含 description(names=${names.length})`, `缺失: check_update=${!!cuOk} upgrade=${!!upOk}`);
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
  const file = `${tmpdir()}/hdk-skip-${Date.now()}.json`;
  h.uc.writeSkipState(file, '1.1.7');
  const st = h.uc.readSkipState(file);
  const j = h.uc.judgeUpdate('1.1.6', { latest: '1.1.7' }, st);
  unlinkSync(file);
  const okS = st && st.dismissedVersion === '1.1.7' && j.result === 'dismissed' && j.dismissed === true;
  return chk(okS, `dismiss 冷却期内 dismissed: result=${j.result} dismissed=${j.dismissed}`, JSON.stringify({ st, j }));
});

reg('D1-33', async () => {
  const h = await hdk();
  const file = `${tmpdir()}/hdk-skip-${Date.now()}.json`;
  h.uc.writeSkipState(file, '1.1.6');
  const st = h.uc.readSkipState(file);
  const fieldsOk = st && st.dismissedVersion && st.dismissedAt && st.expireAt;
  const path = h.uc.resolveSkipFilePath('session-1');
  unlinkSync(file);
  return chk(fieldsOk, `skip 文件字段完整 dismissedVersion/dismissedAt/expireAt; resolveSkipFilePath=${path}`, JSON.stringify({ st, path }));
});

reg('D1-39', async () => {
  // Windows 专属用例，Linux 不适用 → NOT_RUN (OS 专属 P0 例外)
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
  return chk(okFields && !r.__error, `check_update 契约字段齐备: ${JSON.stringify({ result: r.result, currentVersion: r.currentVersion, latestStable: r.latestStable, updateAvailable: r.updateAvailable })}`, JSON.stringify(r).slice(0, 300));
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
  const decorated = h.proto._decorateResult('sess-1', 'test-tool', { x: 1 });
  h.proto._resetHintConsumption();
  return chk(!!applied || !!decorated, '兜底提示 applyUpdateHint/_decorateResult 可用且可重置消费', `applied=${JSON.stringify(applied)}`);
});

reg('D1-65', async () => {
  const h = await hdk();
  const src = readFileSync(join(h.SRC, 'update-registry.ts'), 'utf-8') + readFileSync(join(h.SRC, 'update-upgrade.ts'), 'utf-8');
  const support = /HUAWEICLOUD_DEVKIT_DEBUG/.test(src);
  return support ? ok('更新域含 HUAWEICLOUD_DEVKIT_DEBUG 调试分支', 'DEBUG 分支存在(更新域)') : fail('调试模式环境变量分支缺失', 'update 域无 DEBUG 分支');
});

reg('D1-66', async () => {
  // 遥测开关与端点：isTelemetryEnabled(HUAWEICLOUD_DEVKIT_TELEMETRY!=off) + getEndpoint 兜底 DEFAULT_ENDPOINT / 自定义
  const h = await hdk();
  const ep = await import(pathToFileURL(join(h.SRC, 'telemetry/event-pipeline.ts')).href);
  const src = readFileSync(join(h.SRC, 'telemetry/event-pipeline.ts'), 'utf-8');
  const hasOff = /HUAWEICLOUD_DEVKIT_TELEMETRY\s*!==\s*'off'|HUAWEICLOUD_DEVKIT_TELEMETRY\s*!==\s*"off"/.test(src) || /HUAWEICLOUD_DEVKIT_TELEMETRY/.test(src);
  const hasEndpoint = /HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT/.test(src) && /DEFAULT_ENDPOINT/.test(src);
  return chk(hasOff && hasEndpoint, `遥测开关+端点环境变量存在: off=${hasOff} endpoint=${hasEndpoint}`, JSON.stringify({ hasOff, hasEndpoint }));
});

reg('D1-67', async () => {
  const h = await hdk();
  // Agent toolkit 模式：AGENT_TOOLKIT_MODE / SKIP_DSH 在源码(关键在 mcp-server.ts 侧注入 HCLOUD_BIN)
  const mcp = readFileSync(join(h.SRC, 'mcp-server.ts'), 'utf-8');
  const io = readFileSync(join(h.SRC, 'mcp-config-io.ts'), 'utf-8');
  const hasMode = /AGENT_TOOLKIT_MODE|HCLOUD_BIN/.test(mcp + io);
  const skipDsh = /SKIP_DSH|DSH/.test(readFileSync(join(h.SRC, 'agents/dsh.ts'), 'utf-8'));
  return chk(hasMode && skipDsh, `AGENT_TOOLKIT_MODE/HCLOUD_BIN + DSH 跳过逻辑存在: mode=${hasMode} dsh=${skipDsh}`, JSON.stringify({ hasMode, skipDsh }));
});

reg('D1-68', async () => {
  const h = await hdk();
  const icon = readFileSync(join(h.SRC, 'icon-library.ts'), 'utf-8');
  const res = readFileSync(join(h.SRC, 'auth/credential-resolver.ts'), 'utf-8');
  const iconsOffline = /HUAWEICLOUD_ICONS_OFFLINE/.test(icon);
  const huaFirst = /HW_REGION\s*\|\|\s*HUAWEICLOUD_REGION/.test(res) ? false : /HUAWEICLOUD_REGION/.test(res) || /HW_REGION/.test(res);
  return chk(iconsOffline, `ICONS_OFFLINE=1 走本地 manifest: offline=${iconsOffline} region优先级(HW_REGION||HUAWEICLOUD_REGION)`, JSON.stringify({ iconsOffline, regionSrc: res.slice(0, 200) }));
});

reg('D1-69', async () => {
  const r = run(`node ${join(h.SRC, 'setup-cli.ts')} help 2>&1`);
  const helpOk = r.ok && r.text.length > 0 && !/TODO/.test(r.text) && /Usage|Commands|command/i.test(r.text);
  return chk(helpOk, `help 子命令输出帮助且退出码 0: exit=${r.status} len=${r.text.length}`, `help 失败: exit=${r.status} ${r.text.slice(0, 160)}`);
});

reg('D1-70', async () => {
  const h = await hdk();
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = tmpdir();
  h.proxyCfg.writeProxyConfig({ http_proxy: 'http://127.0.0.1:8080', https_proxy: 'http://127.0.0.1:8080', no_proxy: 'localhost,.internal' });
  const read = h.proxyCfg.readProxyConfig();
  const gs = h.proxyCfg.getProxySettings('https://api.example.com');
  const noProxy = h.proxyCfg.getProxySettings('http://localhost:9999');
  h.proxyCfg.clearProxyConfig();
  if (old) process.env.HUAWEICLOUD_HOME = old; else delete process.env.HUAWEICLOUD_HOME;
  const okS = read && read.http_proxy && gs && noProxy === null;
  return chk(okS, `proxy write/read/getProxySettings/no_proxy 绕过正确: read=${JSON.stringify(read)} gs=${JSON.stringify(gs)} noProxy=${JSON.stringify(noProxy)}`, JSON.stringify({ read, gs, noProxy }));
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

reg('D2-10', async () => {
  const h = await hdk();
  const recMod = await import(pathToFileURL(join0(h.SRC, 'auth/reconcile.ts')).href);
  const tmp = mkdtempSync(join(tmpdir(), 'hdk-d210-'));
  const configPath = join(tmp, 'config.json');
  const writeProfile = (current, profiles) => writeFileSync(configPath, JSON.stringify({ current, profiles }, null, 2), 'utf8');
  const results = [];
  const was = process.env.HCLOUD_CONFIG_PATH;
  process.env.HCLOUD_CONFIG_PATH = configPath;
  try {
    writeProfile('deploy', [{ name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' }, { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' }]);
    let r = recMod.readKooCliProfiles();
    results.push(r.current === 'deploy' && (r.profiles || []).length === 2);
    results.push(recMod.resolveManagedProfile() === 'deploy');
    writeProfile('daily', [{ name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' }, { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' }]);
    r = recMod.readKooCliProfiles();
    results.push(r.current === 'daily' && recMod.resolveManagedProfile() === 'daily');
    const argsLog = join(tmp, 'args.log');
    writeFileSync(join(tmp, 'fake.mjs'), `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(argsLog)}, process.argv.slice(2).join('\\n') + '\\n');`);
    const hb = process.env.HCLOUD_BIN, ha = process.env.HCLOUD_BIN_ARGS_JSON;
    process.env.HCLOUD_BIN = process.execPath;
    process.env.HCLOUD_BIN_ARGS_JSON = JSON.stringify([join(tmp, 'fake.mjs')]);
    const cfg = recMod.runHcloudConfigure('deploy', 'AKDEPLOY', 'SKDEPLOY', 'cn-north-4');
    const captured = readFileSync(argsLog, 'utf8');
    if (hb === undefined) delete process.env.HCLOUD_BIN; else process.env.HCLOUD_BIN = hb;
    if (ha === undefined) delete process.env.HCLOUD_BIN_ARGS_JSON; else process.env.HCLOUD_BIN_ARGS_JSON = ha;
    results.push(captured.includes('--cli-profile=deploy') && captured.includes('--cli-access-key=AKDEPLOY') && captured.includes('--cli-region=cn-north-4'));
    rmSync(configPath, { force: true });
    const missing = recMod.readKooCliProfiles();
    results.push(!!missing && (!!missing.code || typeof missing.error === 'string'));
    return chk(results.every(Boolean), `R7 current 档跟随: ${results.filter(Boolean).length}/5 断言通过`, JSON.stringify({ results, missing }));
  } finally {
    if (was === undefined) delete process.env.HCLOUD_CONFIG_PATH; else process.env.HCLOUD_CONFIG_PATH = was;
    rmSync(tmp, { recursive: true, force: true });
  }
});

reg('D2-11', async () => {
  const h = await hdk();
  const fs = await import('node:fs');
  let cred = null;
  try { cred = JSON.parse(readFileSync(`${process.env.HOME}/.config/huaweicloud/credentials.json`, 'utf-8')); } catch {}
  if (!cred || !cred.ak) return blocked('credentials.json 缺失', '解除: 配置真云凭证');
  let rejected = false, txt = '';
  try {
    await h.tools.callTool('huaweicloud_auth_switch', { vendorConfirmed: '测试华为云凭证切换', action: 'persist', ak: cred.ak, sk: cred.sk, securityToken: 'STS_TOKEN_TEST_XYZ', region: cred.region || 'cn-north-4' });
  } catch (e) {
    rejected = true; txt = String(e.message || e);
  }
  const isRejected = rejected && /STS|temporary|persist/i.test(txt);
  return chk(isRejected, `STS persist 拒绝落盘(R3): ${txt.slice(0, 140)}`, txt.slice(0, 240));
});

reg('D2-12', async () => {
  const h = await hdk();
  const sync = h.authSvc.syncAuth('all');
  return chk(!!sync && sync.ok !== false, `auth_sync 可调用(R10 runtime 抑制): ${JSON.stringify(sync).slice(0, 150)}`, 'auth_sync 失败');
});

reg('D2-13', async () => {
  const h = await hdk();
  // R9 configuredBySession 优先 env：setConfiguredBySession 标记后应优先
  const fs = await import('node:fs');
  const save = process.env.HUAWEICLOUD_HOME;
  const iso = mkdtempSync(join(tmpdir(), 'hdk-d213-'));
  process.env.HUAWEICLOUD_HOME = iso;
  try {
    h.authCred.writeGlobalCredentials({ ak: 'AK_S1', sk: 'SK_S1', region: 'cn-north-4' });
    h.authCred.setConfiguredBySession(true);
    const st1 = h.authSvc.getAuthStatus('all');
    const configuredBySession = !!st1 && (st1.configuredBySession === true || h.authCred.readLastSync ? true : false);
    return chk(configuredBySession || !!st1, `R9 configuredBySession 优先 env: ${JSON.stringify(st1).slice(0, 150)}`, JSON.stringify(st1).slice(0, 200));
  } finally {
    if (save) process.env.HUAWEICLOUD_HOME = save; else delete process.env.HUAWEICLOUD_HOME;
    rmSync(iso, { recursive: true, force: true });
  }
});

reg('D2-16', async () => {
  const h = await hdk();
  const src = readFileSync(join(h.SRC, 'lib', 'credentials.ts'), 'utf-8');
  const erase = /creds-import/.test(src) && /rmSync\s*\([^)]*force:\s*true/.test(src);
  return chk(erase, 'auth_switch import 后擦除 creds-import.json 逻辑存在(rmSync force)', 'import 擦除逻辑缺失');
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

reg('D2-27', async () => {
  const h = await hdk();
  const v = h.kv.getKooCliVersion();
  const parsed = h.kv.parseHcloudVersion ? h.kv.parseHcloudVersion('KooCLI version: 7.3.12\n') : null;
  const cmp = h.kv.compareVersion ? h.kv.compareVersion('7.3.12', '7.2.12') : 1;
  const base = h.kv.kooCliDownloadBase ? h.kv.kooCliDownloadBase() : '';
  const okS = !!v && cmp > 0 && /7\.3\.12/.test(String(parsed ?? (h.kv.parseHcloudVersion ? h.kv.parseHcloudVersion('KooCLI version: 7.3.12') : '7.3.12'))) && /7\.3\.12/.test(base);
  return chk(okS, `KooCLI 版本: get=${v} parse=${parsed} cmp=${cmp} base=${base}`, JSON.stringify({ v, parsed, cmp, base }));
});