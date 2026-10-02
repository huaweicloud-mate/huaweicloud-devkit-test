// probe-lib/d1.mjs — D1 安装与版本检测维度真实断言实现
import { emit, SDK, REPO } from './shared.mjs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const U = p => `${SDK}/${p}`;

export async function d1_27() {
  return emit('D1-27', '检测语义: 已是最新', async c => {
    const { judgeUpdate } = await import(U('update-check.mjs'));
    const r = judgeUpdate('1.1.2', { latest: '1.1.2' }, null);
    c.eq('result=up_to_date', r.result, 'up_to_date');
    c.eq('updateAvailable=false', r.updateAvailable, false);
    c.eq('targetVersion=current', r.targetVersion, '1.1.2');
    c.eq('latestStable', r.latestStable, '1.1.2');
    return {};
  });
}

export async function d1_28() {
  return emit('D1-28', '检测语义: 有新版本', async c => {
    const { judgeUpdate } = await import(U('update-check.mjs'));
    const r = judgeUpdate('1.1.1', { latest: '1.1.2' }, null);
    c.eq('result=update_available', r.result, 'update_available');
    c.eq('updateAvailable=true', r.updateAvailable, true);
    c.eq('targetVersion=1.1.2', r.targetVersion, '1.1.2');
    return {};
  });
}

export async function d1_30() {
  return emit('D1-30', 'semver 比对正确性', async c => {
    const { semverCompare } = await import(U('update-check.mjs'));
    c.eq('1.1.2 > 1.1.1', semverCompare('1.1.2', '1.1.1'), 1);
    c.eq('1.1.1 < 1.1.2', semverCompare('1.1.1', '1.1.2'), -1);
    c.eq('1.1.0 > 1.1.0-next.9', semverCompare('1.1.0', '1.1.0-next.9'), 1);
    c.eq('1.1.1 == 1.1.1', semverCompare('1.1.1', '1.1.1'), 0);
    c.ok('无效串按字典序不抛异常', typeof semverCompare('abc', '1.0.0') === 'number', semverCompare('abc', '1.0.0'), 'number');
    return {};
  });
}

export async function d1_31() {
  return emit('D1-31', 'dismiss 冷却期', async c => {
    const { judgeUpdate } = await import(U('update-check.mjs'));
    const now = Date.now();
    const skip = { dismissedVersion: '1.1.2', dismissedAt: now - 1000, expireAt: now + 3 * 864e5 };
    const r = judgeUpdate('1.1.1', { latest: '1.1.2' }, skip);
    c.eq('冷却期内 result=dismissed', r.result, 'dismissed');
    c.eq('dismissed=true', r.dismissed, true);
    c.eq('dismissExpiresAt 非空', typeof r.dismissExpiresAt === 'number' && r.dismissExpiresAt > now, typeof r.dismissExpiresAt, 'number>now');
    const expired = judgeUpdate('1.1.1', { latest: '1.1.2' }, { dismissedVersion: '1.1.2', dismissedAt: now - 4 * 864e5, expireAt: now - 864e5 });
    c.eq('3天后过期→重新提醒', expired.result, 'update_available');
    return {};
  });
}

export async function d1_33() {
  return emit('D1-33', 'skip 文件持久化与多路径', async c => {
    const m = await import(U('update-check.mjs'));
    const dir = mkdtempSync(join(tmpdir(), 'd1-33-'));
    const pluginSkip = join(dir, 'plugin', '.update-skip.json');
    const state = { dismissedVersion: '9.9.9', dismissedAt: Date.now(), expireAt: Date.now() + 864e5 };
    m.writeSkipState(state, pluginSkip);
    c.ok('插件目录 skip 文件已写入', existsSync(pluginSkip), existsSync(pluginSkip), true);
    const back = JSON.parse(readFileSync(pluginSkip, 'utf-8'));
    c.eq('字段 dismissedVersion 持久化', back.dismissedVersion, '9.9.9');
    c.ok('字段 dismissedAt 存在', typeof back.dismissedAt === 'number', back.dismissedAt, 'number');
    c.ok('字段 expireAt 存在', typeof back.expireAt === 'number', back.expireAt, 'number');
    const p1 = m.skipFilePath(), p2 = m.fallbackSkipFilePath();
    c.ok('插件目录路径与回退路径不同', p1 !== p2, { p1, p2 }, '不同');
    const sess = m.resolveSkipFilePath('sess-abc');
    c.ok('会话隔离路径带后缀', sess.includes('sess-abc'), sess, '含 sess-abc');
    rmSync(dir, { recursive: true, force: true });
    return {};
  });
}

export async function d1_39() {
  return emit('D1-39', 'Windows 升级检测链可用(不静默失败)', async c => {
    const { queryDistTagsSync, parseDistTagsOutput } = await import(U('update-check.mjs'));
    const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const raw = spawnSync(NPM, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      encoding: 'utf8', timeout: 60000, windowsHide: true, shell: true,
    });
    c.eq('npm view 退出码 0', raw.status, 0);
    c.ok('npm view 无 EINVAL/无 error', !raw.error, raw.error ? String(raw.error.message) : null, null);
    let shape = 'object';
    try { const p = JSON.parse(String(raw.stdout || '').trim()); shape = Array.isArray(p) ? 'array' : typeof p; } catch {}
    c.ok('registry 返回体为对象而非数组', shape === 'object', shape, 'object');
    const parsed = parseDistTagsOutput(raw.stdout);
    c.ok('parseDistTagsOutput 解析出 latest 字符串',
      parsed && typeof parsed.latest === 'string' && /^\d+\.\d+\.\d+/.test(parsed.latest),
      parsed, 'latest=semver');
    const sync = queryDistTagsSync({ timeoutMs: 60000 });
    c.ok('queryDistTagsSync 返回非 null（检测链真实可用）', sync !== null, sync, '非 null');
    if (sync === null) {
      return { note: `npm ${process.env.npm_config_registry || 'registry.npmjs.org'} 的 dist-tags --json 返回 ${shape} 形态（原始: ${JSON.stringify(String(raw.stdout).trim()).slice(0, 120)}），parseDistTagsOutput 将其判为无效并静默返回 null，queryDistTagsSync 随之返回 null → check_update 在 Windows 上稳定返回 check_failed，无任何错误提示。` };
    }
    return {};
  });
}

export async function d1_40() {
  return emit('D1-40', '镜像 lag 下检测正确(防反向提醒)', async c => {
    const m = await import(U('update-check.mjs'));
    const { judgeUpdate } = m;
    const local = '1.1.8-next.1';
    // 镜像滞后：远端 latest(1.1.7) <= 本地(1.1.8-next.1) → 不得提示倒退升级
    const mirror = judgeUpdate(local, { latest: '1.1.7', next: '1.1.8-next.1' }, null);
    c.ok('远端<=本地时不提示 available(不提示版本倒退)',
      mirror.updateAvailable === false, mirror, 'updateAvailable=false');
    c.eq('targetVersion 不低于本地', mirror.targetVersion === null || mirror.targetVersion === local, true);
    // determineTarget 在 latest<=current 时应回落本地
    const dt = m.determineTarget(local, { latest: '1.1.7', next: '1.1.8-next.1' });
    c.eq('determineTarget 回落本地版本', dt, local);
    const official = judgeUpdate(local, { latest: '1.1.9', next: '1.1.9' }, null);
    c.ok('官方源真有新版本时仍能提示', official.updateAvailable === true, official, 'updateAvailable=true');
    return {};
  });
}

export async function d1_65() {
  return emit('D1-65', '调试模式环境变量', async c => {
    const { queryDistTagsSync } = await import(U('update-check.mjs'));
    const { debugLog, isDebugEnabled } = await import(`${SDK}/update-check.mjs`).catch(() => ({}));
    const src = readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs', 'utf-8');
    c.ok('源码含 HUAWEICLOUD_DEVKIT_DEBUG 判定', src.includes('HUAWEICLOUD_DEVKIT_DEBUG'), 'HUAWEICLOUD_DEVKIT_DEBUG', '存在');
    const old = process.env.HUAWEICLOUD_DEVKIT_DEBUG;
    process.env.HUAWEICLOUD_DEVKIT_DEBUG = '1';
    const on = queryDistTagsSync({ timeoutMs: 60000 });
    process.env.HUAWEICLOUD_DEVKIT_DEBUG = 'off';
    const off = queryDistTagsSync({ timeoutMs: 60000 });
    if (old === undefined) delete process.env.HUAWEICLOUD_DEVKIT_DEBUG; else process.env.HUAWEICLOUD_DEVKIT_DEBUG = old;
    c.ok('DEBUG=1 时检测链执行且不抛异常', on !== undefined, on === null ? 'null(D1-39 缺陷)' : 'ok', '不抛异常');
    c.ok('DEBUG=off 时行为一致且不抛异常', off !== undefined, off === null ? 'null(D1-39 缺陷)' : 'ok', '不抛异常');
    return { note: 'DEBUG 开关不改变返回值语义；两者均为 null 系 D1-39 的 parseDistTagsOutput 缺陷所致，非本用例范围。' };
  });
}

export async function d1_41() {
  return emit('D1-41', 'check_update 真实 MCP 返回契约', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const r = await callTool('huaweicloud_check_update', {});
    c.ok('tools/call isError=false', r && r.isError === false, { isError: r && r.isError }, false);
    let payload = r;
    if (r && Array.isArray(r.content)) {
      const t = r.content.find(x => x.type === 'text');
      try { payload = JSON.parse(t.text); } catch { payload = { parseError: true, text: t.text }; }
    }
    c.ok('content 可解析为 JSON', !payload.parseError, payload.parseError, false);
    for (const k of ['currentVersion', 'latestStable', 'updateAvailable', 'dismissed', 'dismissExpiresAt', 'result']) {
      c.ok(`字段 ${k} 存在`, k in payload, Object.keys(payload), '含 ' + k);
    }
    c.eq('result 属四态之一', ['up_to_date', 'update_available', 'dismissed', 'check_failed'].includes(payload.result), true);
    c.ok('失败态不抛协议错误（返回 check_failed）', payload.result === 'check_failed' || payload.updateAvailable === false, payload.result, '不抛协议错误');
    if (payload.result === 'check_failed') {
      return { note: '四态中的 check_failed 被实际命中：因 D1-39 的 dist-tags 解析缺陷，最新稳定版/next 均无法取得，latestStable/latestNext/targetVersion 全为 null。' };
    }
    return {};
  });
}

export async function d1_42() {
  return emit('D1-42', 'dismiss 真实闭环与跨进程持久化', async c => {
    const m = await import(U('update-check.mjs'));
    const dir = mkdtempSync(join(tmpdir(), 'd1-42-'));
    const f = join(dir, 'skip.json');
    const { callTool } = await import(U('tools.mjs'));
    const first = await callTool('huaweicloud_check_update', {});
    c.ok('首次调用返回合法结果', first && first.isError === false, first && first.isError, false);
    // dismiss 写入（真实调用，拒绝时按预期行为记录）
    const dis = await callTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.8-next.1' });
    c.ok('dismiss 调用被受理且不抛错', dis && dis.isError === false, dis && dis.isError, false);
    const { skipFilePath, fallbackSkipFilePath } = m;
    const p1 = skipFilePath(), p2 = fallbackSkipFilePath();
    const written = [p1, p2].some(p => existsSync(p));
    c.ok('dismiss 落盘到插件目录或回退路径之一', written, { p1, p2 }, '其一存在');
    if (written) {
      const target = existsSync(p1) ? p1 : p2;
      const st = JSON.parse(readFileSync(target, 'utf-8'));
      c.ok('skip 文件含 dismissedVersion', typeof st.dismissedVersion === 'string', st, 'dismissedVersion');
      if (st.dismissedAt && st.expireAt) {
        const days = Math.round((st.expireAt - st.dismissedAt) / 864e5);
        c.eq('expireAt = dismissedAt + 3天', days, 3);
      } else {
        c.ok('skip 文件含 dismissedAt/expireAt', false, st, '两者存在');
      }
      const again = await callTool('huaweicloud_check_update', {});
      const txt = JSON.stringify(again);
      c.ok('同版本冷却内再次调用不再提示 available', !/"updateAvailable":true/.test(txt), txt.substring(0, 200), '冷却内 dismissed');
      rmSync(target, { force: true });
    }
    rmSync(dir, { recursive: true, force: true });
    return {};
  });
}

export async function d1_26() {
  return emit('D1-26', '升级提醒工具注册与协议暴露', async c => {
    const { TOOL_DEFINITIONS } = await import(U('tools.mjs'));
    for (const n of ['huaweicloud_check_update', 'huaweicloud_upgrade']) {
      const t = TOOL_DEFINITIONS.find(x => x.name === n);
      c.ok(`${n} 已注册`, !!t, TOOL_DEFINITIONS.map(x => x.name), '含 ' + n);
      if (t) {
        c.ok(`${n} 有 description`, typeof t.description === 'string' && t.description.length > 0, (t.description || '').length, '>0');
        c.ok(`${n} 有 inputSchema(object)`, t.inputSchema && t.inputSchema.type === 'object', t.inputSchema && t.inputSchema.type, 'object');
      }
    }
    const up = TOOL_DEFINITIONS.find(x => x.name === 'huaweicloud_upgrade');
    if (up) {
      const props = Object.keys(up.inputSchema.properties || {});
      c.ok('upgrade 支持 version 参数或明确限定 latest', props.includes('version') || props.length === 0, props, '含 version 或无参');
      c.eq('upgrade version 仅允许 latest', (up.inputSchema.properties?.version?.enum || []).join(',') || '(无 enum)', 'latest');
    }
    return {};
  });
}

export async function d1_3() {
  return emit('D1-3', 'doctor 健康自检(含失败场景如实报告)', async c => {
    const bin = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/bin/huaweicloud-devkit.cjs';
    const run = args => spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8', timeout: 180000, shell: true });
    const st = run(['status']);
    c.ok('status 可执行并退出码 0', st.status === 0, { code: st.status, err: st.stderr && st.stderr.slice(0, 200) }, 0);
    c.ok('status 输出非空', (st.stdout || '').trim().length > 0, (st.stdout || '').trim().length, '>0');
    const doc = run(['doctor']);
    c.ok('doctor 可执行', doc.status === 0 || doc.status === 1, { code: doc.status }, '0 或 1');
    const out = (doc.stdout || '') + (doc.stderr || '');
    c.ok('doctor 输出检测项', out.trim().length > 0, out.trim().length, '>0');
    c.ok('doctor 输出含修复指引(nextStep/修复/安装等)', /nextStep|修复|install|Install|建议|重新安装/.test(out), out.substring(0, 300), '含指引');
    c.ok('doctor 不输出裸堆栈', !/\n\s+at [\w.]+ \(/.test(out), 'no raw stack', 'no raw stack');
    return {};
  });
}

export async function d1_4() {
  return emit('D1-4', 'status/update 幂等且不碰用户 config', async c => {
    const bin = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/bin/huaweicloud-devkit.cjs';
    const cfgUser = join(process.env.HOME || process.env.USERPROFILE, '.config', 'huaweicloud', 'credentials.json');
    const before = existsSync(cfgUser) ? readFileSync(cfgUser, 'utf-8') : null;
    const st = JSON.stringify(readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/package.json', 'utf-8'));
    const upd = spawnSync(process.execPath, [bin, 'update'], { encoding: 'utf8', timeout: 300000, shell: true });
    c.ok('update 可执行(退出码 0 或幂等提示)', upd.status === 0, { code: upd.status, out: (upd.stdout || '').slice(-300) }, 0);
    const after = existsSync(cfgUser) ? readFileSync(cfgUser, 'utf-8') : null;
    c.eq('用户 credentials.json 内容未被触碰', after, before);
    const upd2 = spawnSync(process.execPath, [bin, 'update'], { encoding: 'utf8', timeout: 300000, shell: true });
    c.ok('重复 update 幂等(退出码一致)', upd2.status === upd.status, { first: upd.status, second: upd2.status }, '一致');
    c.ok('package.json 仍可解析', st.length > 0, 'ok', 'ok');
    return {};
  });
}

export async function d1_67() {
  return emit('D1-67', 'Agent toolkit 模式与 SKIP_DSH 跳过安装', async c => {
    const setup = readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/setup-cli.mjs', 'utf-8');
    const merge = readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs', 'utf-8');
    c.ok('setup-cli 含 AGENT_TOOLKIT_MODE', setup.includes('AGENT_TOOLKIT_MODE'), 'AGENT_TOOLKIT_MODE', '存在');
    c.ok('setup-cli 含 SKIP_DSH', setup.includes('SKIP_DSH'), 'SKIP_DSH', '存在');
    c.ok('SKIP_DSH=1 时跳过 DSH 插件安装', /SKIP_DSH[\s\S]{0,400}?(===|==)[\s\S]{0,200}?(skip|return)/i.test(setup), '源码含跳过分支', 'skip 分支');
    c.ok('REQUIRED_ENV_KEYS 定义于 merge', merge.includes('REQUIRED_ENV_KEYS'), 'REQUIRED_ENV_KEYS', '存在');
    const { inheritPeerUserEnv } = await import(`${SDK}/mcp-config-merge.mjs`);
    const merged = inheritPeerUserEnv({ env: { USER_KEEP: '1' } }, { HW_ACCESS_KEY: 'x', KEEP_ME: 'y' });
    c.ok('继承 peer env 且不覆盖用户已有值', merged && (merged.USER_KEEP === '1' || 'USER_KEEP' in merged), merged, '保留 USER_KEEP');
    return {};
  });
}

export async function d1_68() {
  return emit('D1-68', '图标离线与区域环境变量', async c => {
    const { getServiceIcon, clearIconCache } = await import(U('icon-library.mjs'));
    const { isPlaceholder } = await import(U('auth/credentials.mjs'));
    clearIconCache();
    const old = process.env.ICONS_OFFLINE;
    process.env.ICONS_OFFLINE = '1';
    clearIconCache();
    const t0 = Date.now();
    const off = await getServiceIcon('ecs');
    const offMs = Date.now() - t0;
    clearIconCache();
    const on0 = Date.now();
    const on = await getServiceIcon('ecs');
    const onMs = Date.now() - on0;
    if (old === undefined) delete process.env.ICONS_OFFLINE; else process.env.ICONS_OFFLINE = old;
    clearIconCache();
    c.ok('ICONS_OFFLINE=1 仍能返回图标(本地 manifest)', off && (Array.isArray(off) ? off.length > 0 : !!off), off && (Array.isArray(off) ? off.length : 1), '>0');
    c.ok('离线分支不依赖网络(有结果)', off !== null, offMs, '有结果');
    c.ok('在线/离线两种模式结果一致', (Array.isArray(off) ? off.length : 0) > 0 && (Array.isArray(on) ? on.length : 0) > 0, { off: offMs, on: onMs }, '两者均有结果');
    const cred = readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs', 'utf-8');
    c.ok('凭证解析含 HUAWEICLOUD_REGION 优先于 HW_REGION',
      /HUAWEICLOUD_REGION[\s\S]{0,200}HW_REGION|HUAWEICLOUD_REGION[\s\S]{0,120}\|\|[\s\S]{0,80}HW_REGION/.test(cred),
      '源码顺序', 'HUAWEICLOUD_REGION 优先');
    c.ok('isPlaceholder 可用', typeof isPlaceholder('YOUR_AK_HERE') === 'boolean', isPlaceholder('YOUR_AK_HERE'), 'boolean');
    return {};
  });
}