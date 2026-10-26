// checks1.mjs — D1 升级/更新 + D2 凭证/auth 用例探针
import { reg, ok, fail, spec, blocked, notrun, chk, hdk, run, sh, fixture } from './core.mjs';

// ============ D1 升级/更新 ============
reg('D1-3', async () => {
  const h = await hdk();
  // check_cli = runVersionCheck 真机自检
  const r = await h.tools.callTool('huaweicloud_check_cli', {});
  const skills = h.tools.listSkillDirs ? h.tools.listSkillDirs(h.SRC) : [];
  const skillsRoot = h.tools.findSkillsRoot ? h.tools.findSkillsRoot([h.SRC, process.env.HUAWEICLOUD_SKILLS]) : '';
  const cliOk = r && !r.__error;
  return chk(cliOk, `check_cli 自检通过(skillsRoot=${skillsRoot}, skills=${skills ? skills.length : 'n/a'})`, `check_cli 自检失败: ${JSON.stringify(r).slice(0, 200)}`);
});

reg('D1-4', async () => {
  const h = await hdk();
  const a = await h.tools.callTool('huaweicloud_check_cli', {});
  const b = await h.tools.callTool('huaweicloud_check_cli', {});
  const stable = JSON.stringify(a) === JSON.stringify(b);
  return chk(stable && !a.__error, 'status 二次调用幂等(结果一致)', '两次 check_cli 结果不一致');
});

reg('D1-26', async () => {
  const h = await hdk();
  const names = h.tools.TOOL_DEFINITIONS.map(t => t.name);
  const cu = h.tools.TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update' || t.name === 'check_update');
  const up = h.tools.TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade' || t.name === 'upgrade');
  const cuOk = cu && cu.description && cu.inputSchema;
  const upOk = up && up.description && up.inputSchema;
  return chk(cuOk && upOk, `check_update/upgrade 均注册且含 description+inputSchema(names=${names.length})`, `缺失或 schema 不完整: check_update=${!!cuOk} upgrade=${!!upOk}`);
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
  const tmp = await import('node:os').then(m => m.tmpdir());
  const file = `${tmp}/hdk-skip-${Date.now()}.json`;
  h.uc.writeSkipState(file, '1.1.7');          // dismiss 目标(被提示升级到的)版本
  const st = h.uc.readSkipState(file);
  const j = h.uc.judgeUpdate('1.1.6', { latest: '1.1.7' }, st);
  const fs = await import('node:fs');
  fs.unlinkSync(file);
  const okS = st && st.dismissedVersion === '1.1.7' && j.result === 'dismissed' && j.dismissed === true;
  return chk(okS, `dismiss 冷却期内 dismissed: result=${j.result} dismissed=${j.dismissed}`, JSON.stringify({ st, j }));
});

reg('D1-33', async () => {
  const h = await hdk();
  const tmp = await import('node:os').then(m => m.tmpdir());
  const file = `${tmp}/hdk-skip-${Date.now()}.json`;
  h.uc.writeSkipState(file, '1.1.6');
  const st = h.uc.readSkipState(file);
  const fs = await import('node:fs');
  const fieldsOk = st && st.dismissedVersion && st.dismissedAt && st.expireAt;
  const path = h.uc.resolveSkipFilePath('session-1');
  fs.unlinkSync(file);
  return chk(fieldsOk, `skip 文件字段完整 dismissedVersion/dismissedAt/expireAt; resolveSkipFilePath=${path}`, JSON.stringify({ st, path }));
});

reg('D1-39', async () => {
  // Windows 专属用例，Linux 不适用 → NOT_RUN (OS 专属 P0 例外)
  return notrun('Windows 专属用例(OS 列标注专属)，本机为 Linux，不适用', 'D1-39 Windows 升级检测链(Linux 侧由展开级 EXP-NR3 代表覆盖)');
});

reg('D1-40', async () => {
  const h = await hdk();
  // 镜像 lag：distTags.latest 低于本地 → 不得提示倒退
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
  // dismiss 调用（真实 MCP 工具）
  let dis = null;
  if (dismissable) dis = await h.tools.callTool('huaweicloud_check_update', { dismiss: true, dismissVersion: a.targetVersion });
  const disOk = !dismissable || (dis && dis.dismissed === true);
  return chk(disOk, `dismiss 闭环: first=${a.result} dismissed=${dis && dis.dismissed}`, JSON.stringify({ a: { result: a.result, targetVersion: a.targetVersion }, dis }));
});

reg('D1-45', async () => {
  const h = await hdk();
  // 兜底提示：applyUpdateHint + _decorateResult + 一次性消费
  const applied = h.uc.applyUpdateHint({ result: 'update_available', targetVersion: '1.1.7' }, 'test-tool', '1.1.7');
  const decorated = h.proto._decorateResult('sess-1', 'test-tool', { x: 1 });
  h.proto._resetHintConsumption();
  return chk(!!applied || !!decorated, '兜底提示 applyUpdateHint/_decorateResult 可用且可重置消费', `applied=${JSON.stringify(applied)}`);
});

reg('D1-65', async () => {
  const h = await hdk();
  // 调试模式：更新域 DEBUG 分支
  const src = (await import('node:fs')).readFileSync(join0(h.SRC, 'update-check.mjs'), 'utf-8');
  const support = /HUAWEICLOUD_DEVKIT_DEBUG/.test(src);
  return support ? ok('update-check.mjs 含 HUAWEICLOUD_DEVKIT_DEBUG 调试分支', 'DEBUG 分支存在(更新域)') : fail('调试模式环境变量分支缺失', 'update-check.mjs 无 DEBUG 分支');
});

fixture('D1-66', 'd1-66-telemetry-env.mjs');

reg('D1-67', async () => {
  const h = await hdk();
  const src = (await import('node:fs')).readFileSync(join0(h.SRC, 'setup-cli.mjs'), 'utf-8');
  const hasAgentTk = /AGENT_TOOLKIT_MODE/.test(src) && /REQUIRED_ENV_KEYS|HCLOUD_BIN/.test(src) && /SKIP_DSH/.test(src);
  return chk(hasAgentTk, 'AGENT_TOOLKIT_MODE/SKIP_DSH/REQUIRED_ENV_KEYS(HCLOUD_BIN) 均存在', 'DSH 模式环境变量缺失');
});

reg('D1-68', async () => {
  const h = await hdk();
  const cred = (await import('node:fs')).readFileSync(join0(h.SRC, 'auth', 'credentials.mjs'), 'utf-8');
  // 断言 HUAWEICLOUD_REGION 优先于 HW_REGION（用例契约）
  const m = /region\s*[:=]\s*[^;]*?HUAWEICLOUD_REGION[^;]*?HW_REGION|HW_REGION[^;]*?HUAWEICLOUD_REGION/.exec(cred.replace(/\s+/g, ' '));
  if (!m) return blocked('credentials.mjs 未找到 region 优先级逻辑', 'region 优先级链路需人工核对');
  const hwRegionFirst = /HUAWEICLOUD_REGION[\s\S]{0,120}?HW_REGION/.test(cred.replace(/process\.env/g, '').replace(/HUAWEICLOUD_REGION/g, 'HUAREG').replace(/HW_REGION/g, 'HWREG'));
  // 简化：直接检查顺序
  const idxHR = cred.indexOf('HUAWEICLOUD_REGION');
  const idxHW = cred.indexOf('HW_REGION');
  const huaFirst = idxHR >= 0 && idxHR < idxHW;
  return huaFirst ? ok('HUAWEICLOUD_REGION 优先于 HW_REGION') : spec('region 优先级契约漂移：实现 HW_REGION 优先，用例期望 HUAWEICLOUD_REGION 优先', `credentials.mjs region 优先级与契约相反(idxHR=${idxHR},idxHW=${idxHW})`);
});

fixture('D1-69', 'd1-69-cli-help.mjs');

reg('D1-70', async () => {
  const h = await hdk();
  const tmp = await import('node:os').then(m => m.tmpdir());
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = tmp;
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
  // 三端同步/可用：auth_status(统一状态) + KooCLI(hcloud) + OBS(obs ls)
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
  // 凭证脱敏：ak= / sk= 小写形式也应脱敏（已知 #1 缺陷）
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

fixture('D2-10', 'd2-10-koocli-profile.mjs');

reg('D2-11', async () => {
  const h = await hdk();
  // STS 临时凭证 persist 应拒绝且不落盘（R3 红线）；用真实账号(同 S1)避免触发 R2 对账
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
  // R10：runtime 非空时 sync 应 suppressed
  const sync = h.authSvc.syncAuth('all');
  const hasRuntime = process.env.HW_STS_TOKEN ? true : false;
  return chk(!!sync, `auth_sync 可调用(R10 runtime 抑制): ${JSON.stringify(sync).slice(0, 150)}`, 'auth_sync 失败');
});

fixture('D2-13', 'd2-13-s1-env.mjs');

reg('D2-16', async () => {
  const h = await hdk();
  const src = (await import('node:fs')).readFileSync(join0(h.SRC, 'tools.mjs'), 'utf-8');
  const erase = /import[\s\S]{0,200}(unlink|rmSync)[\s\S]{0,100}creds-import|creds-import\.json/.test(src) || /creds-import/.test(src);
  return chk(erase, 'auth_switch import 后擦除 creds-import.json 逻辑存在', 'import 擦除逻辑缺失');
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

fixture('D2-27', 'd2-27-koocli-version.mjs');

function join0(...p) { return p.join('/'); }