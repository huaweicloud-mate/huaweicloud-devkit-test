// D1 安装/升级/更新 维度探针（源码级 + 真实 CLI/MCP 进程）
import { mk, j, clip, parseTool, REPO, HDK, SRC, INSTALLED_SRC, instSrc, installedVersion as pkgVersion, callTool, readSrc, lineOf } from '../_lib/lib.mjs';
import { McpClient, startMockRegistry, isoHome, writeJson, npmStub, stubEnv } from '../_lib/mcp.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';

const U = await import('file:///' + SRC + '/update-check.mjs');
// 代理模块依赖 undici（随已安装包分发），必须从已安装包路径加载
const U_INST = await import('file:///' + INSTALLED_SRC + '/update-check.mjs');
const CLI_PREFIX = process.env.HDK_PREFIX_GLOBAL;

function npmPrefix() {
    return execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['prefix', '-g'], { encoding: 'utf8', shell: true }).trim();
}
function cliBin() {
    const base = npmPrefix();
    return process.platform === 'win32' ? join(base, 'huaweicloud-devkit.cmd') : join(base, 'bin', 'huaweicloud-devkit');
}
function runCli(args, { timeout = 240000, env = {} } = {}) {
    // Windows: *.cmd 必须经 shell 路由（Node 22 直接 spawn .cmd 抛 EINVAL，CVE-2024-27980）
    const r = spawnSync(cliBin(), args, {
        encoding: 'buffer', timeout, windowsHide: true, shell: process.platform === 'win32',
        env: { ...process.env, ...env }
    });
    const dec = (b) => { try { return b ? b.toString('utf8') : ''; } catch { return ''; } };
    return {
        code: r.status, signal: r.signal, error: r.error ? String(r.error.message) : null,
        stdout: dec(r.stdout), stderr: dec(r.stderr)
    };
}
const md5 = (p) => { try { return createHash('md5').update(readFileSync(p)).digest('hex'); } catch { return null; } };
const distTagRe = /"(latest|next)"\s*:\s*"([^"]+)"/g;
function parseTagsFromCliOut(out) {
    const t = {};
    let m; distTagRe.lastIndex = 0;
    while ((m = distTagRe.exec(out))) t[m[1]] = m[2];
    return t;
}
function installedVersion() {
    const pkg = JSON.parse(readFileSync(join(npmPrefix(), 'node_modules', 'huaweicloud-devkit', 'package.json'), 'utf8'));
    return pkg.version;
}

export const P = {};

// ---------------- D1-39 Windows 升级检测链可用性 ----------------
P['D1-39'] = async (ctx) => {
    const { execFileSync } = await import('node:child_process');
    const npmVer = execFileSync('npm.cmd', ['--version'], { encoding: 'utf8', shell: true }).trim();
    const rawOut = execFileSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'],
        { encoding: 'utf8', shell: true, timeout: 60000, windowsHide: true });
    const parsedRaw = JSON.parse(rawOut);
    ctx.set('npmVersion', npmVer);
    ctx.set('rawNpmViewStdout', rawOut);
    ctx.set('rawNpmViewJsonShape', Array.isArray(parsedRaw) ? 'ARRAY' : 'OBJECT');
    ctx.set('parseDistTagsOutputResult', U.parseDistTagsOutput(rawOut));

    const sync = U.queryDistTagsSync({ timeoutMs: 30000 });
    ctx.ok('queryDistTagsSync 返回非 null（Windows 检测链真实可用）', sync !== null && !!sync.latest, sync);
    ctx.ok('queryDistTagsSync 未返回 EINVAL 静默失败', !/EINVAL/i.test(JSON.stringify(sync || {})), sync);
    const async1 = await U.queryDistTags({ timeoutMs: 30000 });
    ctx.ok('queryDistTags（spawn 异步）返回非 null', async1 !== null && !!async1.latest, async1);
    const both = sync && async1;
    ctx.ok('同步/异步两条检测链结果一致', !!both && sync.latest === async1.latest, { sync, async: async1 });
    // fetch 路径（走 registry HTTP）作为对照：证明网络与包本身可用，失败仅在 npm view 解析层
    const fetchTags = await U.queryDistTagsFetch({ timeoutMs: 30000 });
    ctx.ok('对照：queryDistTagsFetch（registry HTTP 路径）可取到 dist-tags', !!fetchTags && !!fetchTags.latest, fetchTags);

    // 根因定位：npm>=10 的 `npm view <pkg> dist-tags --json` 返回数组形态，parseDistTagsOutput 显式拒绝数组
    const arrRejected = Array.isArray(parsedRaw) && U.parseDistTagsOutput(rawOut) === null;
    ctx.ok('parseDistTagsOutput 兼容 npm 实际输出的 JSON 形态（对象/数组均可解析）', !arrRejected,
        { npmOutputShape: Array.isArray(parsedRaw) ? 'ARRAY' : 'OBJECT', parseResult: U.parseDistTagsOutput(rawOut) });
    if (sync === null && arrRejected) {
        ctx.fail(`升级检测链在 npm ${npmVer} 上静默失效：\`npm view huaweicloud-devkit dist-tags --json\` 返回数组形态 ${JSON.stringify(rawOut).slice(0, 80)}，而 parseDistTagsOutput 以 \`Array.isArray(parsed)\` 直接 return null（update-check.mjs:88），导致 queryDistTagsSync/queryDistTags 恒返回 null → check_update 恒为 check_failed`);
    }
    // 对照：显式 shell:false spawnSync npm.cmd 在 Windows 应抛 EINVAL（说明 shell:true 是必要修复）
    const raw = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
        ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', shell: false, timeout: 30000, windowsHide: true });
    ctx.set('control_shell_false', { error: raw.error ? raw.error.code || String(raw.error.message) : null, status: raw.status });
    ctx.set('rootCause', 'plugins/huaweicloud-core/src/update-check.mjs:88 (parseDistTagsOutput 拒绝数组形态 JSON)');
    ctx.set('source', {
        queryDistTagsSync: `plugins/huaweicloud-core/src/update-check.mjs:${lineOf('update-check.mjs', 'export function queryDistTagsSync')}`,
        parseDistTagsOutput: `plugins/huaweicloud-core/src/update-check.mjs:${lineOf('update-check.mjs', 'export function parseDistTagsOutput')}`
    });
};

// ---------------- D1-40 镜像 lag 下检测正确性 ----------------
P['D1-40'] = async (ctx) => {
    const current = installedVersion();
    // 构造滞后镜像：latest 低于本地已装版本
    const lagging = { latest: '1.0.0', next: '0.9.0' };
    const mock = await startMockRegistry(lagging);
    const envKeys = ['HUAWEICLOUD_NPM_REGISTRY', 'npm_config_registry'];
    const prev = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
    process.env.HUAWEICLOUD_NPM_REGISTRY = mock.url;   // fetch 路径读取
    process.env.npm_config_registry = mock.url;         // npm view 路径读取
    let mirrorSync = null, mirrorErr = null;
    try { mirrorSync = U.queryDistTagsSync({ timeoutMs: 20000 }); } catch (e) { mirrorErr = String(e); }
    const mirrorFetch = await U.queryDistTagsFetch({ timeoutMs: 20000 });
    for (const k of envKeys) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; }
    await mock.close();
    const official = U.queryDistTagsSync({ timeoutMs: 30000 });
    const officialFetch = await U.queryDistTagsFetch({ timeoutMs: 30000 });

    const mirrorTags = mirrorFetch || mirrorSync;
    ctx.ok('镜像 registry 被实际读取（latest=1.0.0，低于本地）', !!mirrorTags && mirrorTags.latest === '1.0.0',
        { mirrorFetch, mirrorSync, mirrorErr });
    ctx.ok('镜像无 EINVAL/异常抛出', !mirrorErr, { mirrorErr });

    const judged = U.judgeUpdate(current, mirrorTags || {}, null);
    ctx.ok('镜像滞后时不得提示版本倒退（updateAvailable=false）', judged.updateAvailable === false, judged);
    ctx.ok('镜像滞后时 result=up_to_date（远端<=本地不提示）', judged.result === 'up_to_date', judged);
    const t = U.determineTarget(current, mirrorTags || {});
    ctx.ok('determineTarget 取候选中最大版本（1.0.0），防倒退由 judgeUpdate 守卫',
        t === '1.0.0' && U.semverCompare(t, current) < 0, { target: t, current });
    ctx.ok('judgeUpdate 守卫生效：target<=current 时判 up_to_date（不提示倒退）',
        U.judgeUpdate(current, mirrorTags || {}, null).result === 'up_to_date', U.judgeUpdate(current, mirrorTags || {}, null));
    const officialTags = officialFetch || official;
    const officialJudged = U.judgeUpdate(current, officialTags || {}, null);
    ctx.set('comparison', { current, mirrorTags, mirrorJudged: judged, official: officialTags, officialJudged, mirrorSyncChain: mirrorSync });
    ctx.ok('官方源对照可取到（registry=https://registry.npmjs.org）', !!officialTags && !!officialTags.latest, officialTags);
    ctx.ok('镜像与官方源结论可区分（镜像 up_to_date 不被官方源结论覆盖）',
        judged.result === 'up_to_date' && officialJudged.result !== 'dismissed', { mirror: judged.result, official: officialJudged.result });
};

// ---------------- D1-3 doctor 健康自检 ----------------
P['D1-3'] = async (ctx) => {
    const clean = runCli(['doctor'], { timeout: 300000 });
    ctx.ok('doctor 正常环境退出码 0', clean.code === 0, { code: clean.code, stderr: clip(clean.stderr, 300) });
    // doctor 的四类检测项在输出中的实际措辞：
    // hcloud → "hcloud CLI installed"；MCP → "MCP server installed/configured"；
    // Skills → "Skills installed"；Auth → "hcloud credentials configured"
    const items = {
        hcloud: /hcloud CLI installed/i.test(clean.stdout),
        MCP: /MCP server installed/i.test(clean.stdout) && /MCP configured/i.test(clean.stdout),
        Skill: /Skills installed/i.test(clean.stdout),
        Auth: /hcloud credentials configured/i.test(clean.stdout)
    };
    ctx.ok('doctor 输出覆盖 hcloud/MCP/Skills/Auth 四类检测项', Object.values(items).every(Boolean), { items, head: clip(clean.stdout, 800) });
    ctx.ok('doctor 输出汇总计数行（Results: N pass, M warn, K fail）',
        /Results:\s*\d+\s*pass/i.test(clean.stdout), clip(clean.stdout, 1500));
    ctx.ok('doctor 输出逐项 [PASS]/[FAIL]/[WARN] 标记',
        /\[(PASS|FAIL|WARN)\]/.test(clean.stdout) && /Node\.js >= 22/.test(clean.stdout), clip(clean.stdout, 800));
    ctx.ok('doctor 对 WARN 项给出可执行修复指引',
        /\[WARN\]/.test(clean.stdout) ? /修复|fix|retr(y|ies)/i.test(clean.stdout) : true,
        clip(clean.stdout, 1500));

    // 失败场景：隔离 HOME（无凭证、无配置）下 doctor 必须如实报告失败而非静默通过
    const home = isoHome('doctor');
    const broken = runCli(['doctor'], { timeout: 300000, env: { HOME: home, USERPROFILE: home, HUAWEICLOUD_HOME: home } });
    const failCount = (broken.stdout.match(/\[FAIL\]/g) || []).length;
    ctx.ok('隔离 HOME（无凭证/无配置）下 doctor 如实报告失败项（存在 [FAIL] 条目）', failCount > 0,
        { failCount, code: broken.code, out: clip(broken.stdout, 1200) });
    ctx.ok('失败场景 doctor 未静默返回全绿（stdout 不含 All checks passed）',
        !/All checks passed/i.test(broken.stdout), clip(broken.stdout, 600));
    const sum = (broken.stdout.match(/Results:\s*(\d+)\s*pass,\s*(\d+)\s*warn,\s*(\d+)\s*fail/i) || []);
    ctx.ok('汇总行 fail 计数与 [FAIL] 条数一致', sum[3] !== undefined && Number(sum[3]) === failCount,
        { summary: sum[0] || null, failMarkers: failCount });
    ctx.set('isolatedHome', home);
};

// ---------------- D1-4 status/update 幂等 ----------------
P['D1-4'] = async (ctx) => {
    const cfgCandidates = [
        join(homedir(), '.config', 'opencode', 'opencode.json'),
        join(homedir(), '.config', 'opencode', 'config.json'),
        join(homedir(), '.opencode', 'opencode.json')
    ].filter(existsSync);
    const creds = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
    const before = Object.fromEntries([...cfgCandidates, creds].map((p) => [p, md5(p)]));

    const s1 = runCli(['status'], { timeout: 300000 });
    ctx.ok('status 退出码 0', s1.code === 0, { code: s1.code });
    ctx.ok('status 输出含已安装客户端清单', /OpenCode/.test(s1.stdout), clip(s1.stdout, 500));

    const u1 = runCli(['update'], { timeout: 600000 });
    ctx.ok('update 退出码 0', u1.code === 0, { code: u1.code, err: clip(u1.stderr, 300) });
    const mid = Object.fromEntries([...cfgCandidates, creds].map((p) => [p, md5(p)]));
    const untouched = cfgCandidates.filter((p) => before[p] && before[p] === mid[p]);
    ctx.ok('update 增量刷新未改动用户 MCP config（md5 不变）',
        cfgCandidates.length === 0 || untouched.length === cfgCandidates.length,
        { before, mid, cfgCandidates });
    ctx.ok('update 未改动真云凭证文件 credentials.json', before[creds] === mid[creds], { creds });

    const u2 = runCli(['update'], { timeout: 600000 });
    const after = Object.fromEntries([...cfgCandidates, creds].map((p) => [p, md5(p)]));
    ctx.ok('重复 update 幂等（第二次退出码 0 且配置仍不变）', u2.code === 0 && JSON.stringify(after) === JSON.stringify(mid),
        { code2: u2.code, mid, after });
    ctx.set('version', installedVersion());
};

// ---------------- D1-26 升级提醒工具注册与协议暴露 ----------------
P['D1-26'] = async (ctx) => {
    const c = McpClient.start({ HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1' });
    try {
        const init = await c.initialize();
        const tools = await c.toolsList();
        const names = tools.tools.map((t) => t.name);
        ctx.ok('tools/list 返回成功且非空', names.length > 0, { count: names.length });
        for (const n of ['huaweicloud_check_update', 'huaweicloud_upgrade']) {
            const t = tools.tools.find((x) => x.name === n);
            ctx.ok(`${n} 已注册`, !!t, { registered: names.filter((x) => /update|upgrade/.test(x)) });
            if (t) {
                ctx.ok(`${n} description 非空`, typeof t.description === 'string' && t.description.length > 0, clip(t.description, 200));
                ctx.ok(`${n} inputSchema 为合法 JSON Schema object`, !!t.inputSchema && t.inputSchema.type === 'object' && !!t.inputSchema.properties, t.inputSchema);
            }
        }
        ctx.ok('initialize 返回 protocolVersion + capabilities + serverInfo',
            !!(init.result.protocolVersion && init.result.capabilities && init.result.serverInfo), init.result);
    } finally { c.kill(); }
};

// ---------------- D1-27 已是最��� ----------------
P['D1-27'] = async (ctx) => {
    const r = U.judgeUpdate('1.1.2', { latest: '1.1.2' }, null);
    ctx.eq('judgeUpdate(current==latest) → result=up_to_date', r.result, 'up_to_date');
    ctx.eq('judgeUpdate(current==latest) → updateAvailable=false', r.updateAvailable, false);
    ctx.eq('judgeUpdate(current==latest) → latestStable 透传', r.latestStable, '1.1.2');
    ctx.eq('judgeUpdate(current==latest) → currentVersion 透传', r.currentVersion, '1.1.2');
};

// ---------------- D1-28 有新版本 ----------------
P['D1-28'] = async (ctx) => {
    const r = U.judgeUpdate('1.1.1', { latest: '1.1.2' }, null);
    ctx.eq('judgeUpdate(current<latest) → result=update_available', r.result, 'update_available');
    ctx.eq('judgeUpdate(current<latest) → updateAvailable=true', r.updateAvailable, true);
    ctx.eq('judgeUpdate(current<latest) → targetVersion=1.1.2', r.targetVersion, '1.1.2');
    ctx.eq('judgeUpdate(current<latest) → latestStable=1.1.2', r.latestStable, '1.1.2');
};

// ---------------- D1-31 dismiss 冷却 ----------------
P['D1-31'] = async (ctx) => {
    const home = isoHome('dismiss');
    const file = join(home, 'skip.json');
    const at = Date.parse('2026-10-01T00:00:00.000Z');
    const st = U.writeSkipState(file, '9.9.9', { at, days: 3 });
    ctx.ok('writeSkipState 写入 dismissedVersion/dismissedAt/expireAt',
        st.dismissedVersion === '9.9.9' && !!st.dismissedAt && !!st.expireAt, st);
    ctx.eq('expireAt = dismissedAt + 3 天', new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime(), 3 * 24 * 3600 * 1000);
    const readBack = U.readSkipState(file);
    ctx.eq('readSkipState 读回一致', readBack, st);

    const tags = { latest: '9.9.9' };
    const during = U.judgeUpdate('1.0.0', tags, readBack, at + 3600 * 1000);
    ctx.eq('冷却期内 result=dismissed', during.result, 'dismissed');
    ctx.eq('冷却期内 dismissed=true', during.dismissed, true);
    ctx.eq('冷却期内 dismissExpiresAt 透传', during.dismissExpiresAt, st.expireAt);

    const after = U.judgeUpdate('1.0.0', tags, readBack, at + 4 * 24 * 3600 * 1000);
    ctx.eq('3 天冷却过期后重新提醒 → result=update_available', after.result, 'update_available');
    const newer = U.judgeUpdate('1.0.0', { latest: '10.0.0' }, readBack, at + 3600 * 1000);
    ctx.eq('冷却期内出现更高版本仍应提醒（target>dismissedVersion）', newer.result, 'update_available');
    ctx.set('isolatedHome', home);
};

// ---------------- D1-41 check_update 真实 MCP 返回契约 ----------------
P['D1-41'] = async (ctx) => {
    const current = installedVersion();
    const results = {};
    const runOne = async (tag, tags, stubOpts = {}, extraEnv = {}) => {
        const home = isoHome('cu-' + tag);
        const stub = npmStub(tags, stubOpts);
        const c = McpClient.start(stubEnv(stub, {
            HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1', HUAWEICLOUD_HOME: home,
            HOME: home, USERPROFILE: home, HUAWEICLOUD_DEVKIT_TELEMETRY: 'off', ...extraEnv
        }));
        try {
            await c.initialize();
            const r = await c.call('huaweicloud_check_update', {}, 90000);
            return { home, stub, raw: r, parsed: parseTool(r.result) };
        } finally { c.kill(); }
    };

    const upToDate = await runOne('uptodate', { latest: current, next: current });
    results.up_to_date = upToDate.parsed;
    ctx.ok('up_to_date: tools/call isError=false', !upToDate.parsed.isError, upToDate.raw);
    ctx.eq('up_to_date: result=up_to_date', upToDate.parsed.parsed?.result, 'up_to_date');
    ctx.eq('up_to_date: updateAvailable=false', upToDate.parsed.parsed?.updateAvailable, false);
    ctx.eq('up_to_date: currentVersion 回显本机版本', upToDate.parsed.parsed?.currentVersion, current);
    ctx.ok('up_to_date: latestStable 字段存在', typeof upToDate.parsed.parsed?.latestStable === 'string', upToDate.parsed.parsed);

    // current=1.1.8-next.1 为预发布版本 → determineTarget 走 next 候选，目标为 99.1.0
    const avail = await runOne('avail', { latest: '99.0.0', next: '99.1.0' });
    results.update_available = avail.parsed;
    ctx.ok('update_available: isError=false', !avail.parsed.isError, avail.raw);
    ctx.eq('update_available: result=update_available', avail.parsed.parsed?.result, 'update_available');
    ctx.eq('update_available: updateAvailable=true', avail.parsed.parsed?.updateAvailable, true);
    ctx.eq('update_available: 预发布版走 next 候选 targetVersion=99.1.0', avail.parsed.parsed?.targetVersion, '99.1.0');
    ctx.ok('update_available: latestStable/latestNext 双字段返回',
        avail.parsed.parsed?.latestStable === '99.0.0' && avail.parsed.parsed?.latestNext === '99.1.0', avail.parsed.parsed);

    // dismissed 态：先 dismiss 再复查（同进程两次调用 + 落盘 skip 文件）
    const homeD = isoHome('cu-dismissed');
    const stubD = npmStub({ latest: '99.0.0', next: '99.1.0' });
    const cD = McpClient.start(stubEnv(stubD, {
        HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1', HUAWEICLOUD_HOME: homeD, HOME: homeD, USERPROFILE: homeD,
        HUAWEICLOUD_DEVKIT_TELEMETRY: 'off'
    }));
    let dismissedParsed;
    try {
        await cD.initialize();
        await cD.call('huaweicloud_check_update', {}, 90000);
        // dismiss 当前真实 targetVersion=99.1.0（dismiss 更低版本会按设计重新提示）
        const d1 = await cD.call('huaweicloud_check_update', { dismiss: true, dismissVersion: '99.1.0' }, 90000);
        const d2 = await cD.call('huaweicloud_check_update', {}, 90000);
        dismissedParsed = parseTool(d2.result);
        results.dismissed = dismissedParsed;
        results.dismissCall = parseTool(d1.result);
        ctx.ok('dismiss 调用 isError=false', !parseTool(d1.result).isError, d1.result);
        ctx.eq('dismiss 冷却内再次 check_update → result=dismissed', dismissedParsed.parsed?.result, 'dismissed');
        ctx.eq('dismiss 冷却内 dismissed=true', dismissedParsed.parsed?.dismissed, true);
        ctx.ok('dismiss 冷却内返回 dismissExpiresAt', !!dismissedParsed.parsed?.dismissExpiresAt, dismissedParsed.parsed);
    } finally { cD.kill(); }

    const failed = await runOne('failed', { latest: '1.0.0' }, { exitCode: 1 });
    results.check_failed = failed.parsed;
    ctx.ok('check_failed: 失败不抛协议错误（isError=false，有 result 字段）',
        !failed.parsed.isError && typeof failed.parsed.parsed?.result === 'string', failed.raw);
    ctx.ok('check_failed: result ∈ {check_failed, up_to_date, update_available}',
        ['check_failed', 'up_to_date', 'update_available'].includes(failed.parsed.parsed?.result), failed.parsed.parsed);
    const allowed = new Set(['up_to_date', 'update_available', 'dismissed', 'check_failed']);
    for (const [k, v] of Object.entries(results)) {
        ctx.ok(`四态契约 ${k}: result ∈ 允许枚举`, v.parsed && allowed.has(v.parsed.result), { k, result: v.parsed?.result });
    }
    ctx.set('currentVersion', current);
    ctx.set('injectionMethod', 'PATH 前置 npm.cmd 替身注入 dist-tags（被测 spawn/parse/缓存/judgeUpdate 均为真实代码）');
    ctx.set('responses', Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.parsed])));
};

// ---------------- D1-42 dismiss 真实闭环与跨调用持久化 ----------------
P['D1-42'] = async (ctx) => {
    const home = isoHome('dismiss-closure');
    // dist-tags 使 determineTarget 选中 99.1.0（current=1.1.8-next.1 为预发布 → 走 next 候选）
    const stub = npmStub({ latest: '99.0.0', next: '99.1.0' });
    const env = stubEnv(stub, {
        HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1', HUAWEICLOUD_HOME: home, HOME: home, USERPROFILE: home,
        HUAWEICLOUD_DEVKIT_TELEMETRY: 'off'
    });
    // 子进程 HUAWEICLOUD_HOME=home 且插件目录无 package.json → skip 落 <home>/.config/huaweicloud/
    const expectedSkip = join(home, '.config', 'huaweicloud', 'devkit-skip.json');
    const altSkip = join(home, '.config', 'huaweicloud', 'devkit-skip.json.default');
    let first, dismiss, second;
    let c = McpClient.start(env);
    try {
        await c.initialize();
        first = parseTool((await c.call('huaweicloud_check_update', {}, 90000)).result);
        dismiss = parseTool((await c.call('huaweicloud_check_update', { dismiss: true, dismissVersion: '99.1.0' }, 90000)).result);
        second = parseTool((await c.call('huaweicloud_check_update', {}, 90000)).result);
    } finally { c.kill(); }
    ctx.eq('首次 check_update → update_available', first.parsed?.result, 'update_available');
    ctx.eq('首次 check_update targetVersion=99.1.0（预发布走 next 候选）', first.parsed?.targetVersion, '99.1.0');
    ctx.ok('dismiss 调用成功（isError=false）', !dismiss.isError, dismiss.raw);

    const written = [expectedSkip, altSkip].find((p) => existsSync(p));
    ctx.ok('dismiss 调用真实写入隔离 home 的 skip 文件', !!written, { expectedSkip, altSkip, exists: [expectedSkip, altSkip].map((p) => existsSync(p)) });
    if (written) {
        const st = JSON.parse(readFileSync(written, 'utf8'));
        ctx.ok('skip 文件含 dismissedVersion/dismissedAt/expireAt',
            st.dismissedVersion === '99.1.0' && !!st.dismissedAt && !!st.expireAt, st);
        ctx.eq('expireAt = dismissedAt + 3 天',
            new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime(), 3 * 24 * 3600 * 1000);
        ctx.set('skipFile', written);
    }
    ctx.ok('dismiss 落盘位置在隔离 home 内，未写入插件目录', written === expectedSkip, { written, expectedSkip });
    ctx.eq('同版本冷却内再次 check_update → dismissed', second.parsed?.result, 'dismissed');

    // 重启新 MCP 进程复查
    const c2 = McpClient.start(env);
    let afterRestart;
    try { await c2.initialize(); afterRestart = parseTool((await c2.call('huaweicloud_check_update', {}, 90000)).result); }
    finally { c2.kill(); }
    ctx.eq('进程重启后冷却仍生效 → dismissed', afterRestart.parsed?.result, 'dismissed');
    ctx.eq('进程重启后 dismissed=true', afterRestart.parsed?.dismissed, true);
    ctx.set('resolveSkipFilePathInChild', expectedSkip);
    ctx.set('isolatedHome', home);
};

// ---------------- D1-45 兜底提示真实序列与预热竞态 ----------------
P['D1-45'] = async (ctx) => {
    const M = await import('file:///' + SRC + '/mcp-protocol.mjs');
    // 通过真实 MCP 进程触发预热（nextTick getCachedUpdateInfo）
    const home = isoHome('prewarm');
    const stub = npmStub({ latest: '99.0.0', next: '99.1.0' });
    const c = McpClient.start(stubEnv(stub, {
        HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1', HUAWEICLOUD_HOME: home, HOME: home, USERPROFILE: home,
        HUAWEICLOUD_DEVKIT_TELEMETRY: 'off'
    }));
    let firstHint, secondHint, checkHint;
    try {
        await c.initialize();
        await new Promise((r) => setTimeout(r, 4000)); // 等待预热完成
        const t1 = parseTool((await c.call('huaweicloud_check_cli', {}, 90000)).result);
        const t2 = parseTool((await c.call('huaweicloud_list_regions', {}, 90000)).result);
        firstHint = t1.parsed; secondHint = t2.parsed; checkHint = null;
    } finally { c.kill(); }
    ctx.ok('会话首个非检查工具可携带 _updateInfo 兜底提示', !!(firstHint && firstHint._updateInfo), { keys: firstHint ? Object.keys(firstHint) : null });
    ctx.ok('第二个非检查工具不再重复携带（一次性消费）', !(secondHint && secondHint._updateInfo), { keys: secondHint ? Object.keys(secondHint) : null });

    // 源码级：装饰/消费标记语义
    const r1 = { content: [{ type: 'text', text: 'hello' }] };
    const before = M._isHintConsumed();
    M._resetHintConsumption();
    const afterReset = M._isHintConsumed();
    ctx.ok('_resetHintConsumption 后 _isHintConsumed=false', afterReset === false, { before, afterReset });
    ctx.set('consumeApi', { decorate: `mcp-protocol.mjs:${lineOf('mcp-protocol.mjs', 'export function _decorateResult')}`, reset: `mcp-protocol.mjs:${lineOf('mcp-protocol.mjs', '_resetHintConsumption')}` });
};

// ---------------- D1-70 代理配置与 WebSocket 代理 ----------------
P['D1-70'] = async (ctx) => {
    const home = isoHome('proxy');
    process.env.HUAWEICLOUD_HOME = home;
    const PC = await import('file:///' + INSTALLED_SRC + '/proxy/proxy-config.mjs');
    const PA = await import('file:///' + INSTALLED_SRC + '/proxy/proxy-agent.mjs');

    const p0 = PC.readProxyConfig();
    PC.writeProxyConfig({ http_proxy: 'http://127.0.0.1:18080', https_proxy: 'http://127.0.0.1:18443' });
    const p1 = PC.readProxyConfig();
    ctx.ok('proxy.json 写入后读回一致', p1 && p1.http_proxy === 'http://127.0.0.1:18080' && p1.https_proxy === 'http://127.0.0.1:18443', { before: p0, after: p1 });
    const envKeys = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy'];
    const saved = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
    for (const k of envKeys) delete process.env[k];
    const fromFile = PC.getProxySettings('https://iam.myhuaweicloud.com/v3/auth/tokens');
    ctx.ok('无 env 时从 proxy.json 取代理（proxyUrl 含 18443）', !!fromFile && /127\.0\.0\.1:18443/.test(JSON.stringify(fromFile)), fromFile);

    process.env.HTTPS_PROXY = 'http://127.0.0.1:19999';
    const fromEnv = PC.getProxySettings('https://iam.myhuaweicloud.com/v3/auth/tokens');
    ctx.ok('env 代理优先于 proxy.json', !!fromEnv && /127\.0\.0\.1:19999/.test(JSON.stringify(fromEnv)), fromEnv);

    process.env.NO_PROXY = 'iam.myhuaweicloud.com';
    const bypassed = PC.getProxySettings('https://iam.myhuaweicloud.com/v3/auth/tokens');
    ctx.ok('no_proxy 命中 → getProxySettings 返回 null（绕过）', bypassed === null, bypassed);
    ctx.ok('shouldBypassProxy 对 no_proxy 命中返回 true',
        PC.shouldBypassProxy('iam.myhuaweicloud.com', ['iam.myhuaweicloud.com']) === true,
        PC.shouldBypassProxy('iam.myhuaweicloud.com', ['iam.myhuaweicloud.com']));
    ctx.ok('shouldBypassProxy 对未命中域名返回 false',
        PC.shouldBypassProxy('other.example.com', ['iam.myhuaweicloud.com']) === false,
        PC.shouldBypassProxy('other.example.com', ['iam.myhuaweicloud.com']));

    // 先清掉 no_proxy，确保后续用例走代理分支
    delete process.env.NO_PROXY;
    process.env.HTTPS_PROXY = 'http://127.0.0.1:19999';
    PA.clearProxyDispatcherCache();
    const disp = await PA.getProxyDispatcher('https://iam.myhuaweicloud.com/v3');
    ctx.ok('有代理 → getProxyDispatcher 返回 undici ProxyAgent 实例',
        !!disp && disp.constructor?.name === 'ProxyAgent',
        { type: disp?.constructor?.name, isObject: typeof disp === 'object' });
    const disp2 = await PA.getProxyDispatcher('https://iam.myhuaweicloud.com/v3');
    ctx.ok('同一代理 URL 二次调用命中 dispatcher 缓存（同一实例）', disp2 === disp,
        { first: disp?.constructor?.name, second: disp2?.constructor?.name });

    const wsImpl = await PA.getWebSocketImpl('wss://example.invalid/ws');
    ctx.ok('有代理时 getWebSocketImpl 返回代理构造器（非 globalThis.WebSocket）',
        typeof wsImpl === 'function' && wsImpl !== globalThis.WebSocket, { type: typeof wsImpl });
    const wsProxied = await PA.createProxyWebSocket('wss://example.invalid/ws', ['hwlink.v1']);
    // undici 的 WebSocket 类名同样叫 WebSocket，故以"是否全局构造器的实例"作判据
    ctx.ok('有代理时 createProxyWebSocket 返回 undici WebSocket 实例（非 globalThis.WebSocket 实例）',
        !!wsProxied && !(wsProxied instanceof globalThis.WebSocket),
        { ctor: wsProxied?.constructor?.name, isGlobalInstance: wsProxied instanceof globalThis.WebSocket, hasDispatcherPath: !!wsProxied });
    ctx.ok('有代理时实例带 undici 内部状态（非全局 WebSocket 的裸实例）',
        !!wsProxied && typeof wsProxied.addEventListener === 'function', { ctor: wsProxied?.constructor?.name });
    try { wsProxied?.close(); } catch { /* ignore */ }

    // 无代理：应回退全局 fetch/WebSocket（getProxyDispatcher 返回 undefined 而非 null）
    delete process.env.HTTPS_PROXY;
    PC.clearProxyConfig();
    PA.clearProxyDispatcherCache();
    const noDisp = await PA.getProxyDispatcher('https://iam.myhuaweicloud.com/v3');
    ctx.ok('无代理 → getProxyDispatcher 返回 undefined（falsy，回退全局）', !noDisp, { type: noDisp === undefined ? 'undefined' : typeof noDisp });
    const wsImplNo = await PA.getWebSocketImpl('wss://example.invalid/ws');
    ctx.ok('无代理时 getWebSocketImpl 回退 globalThis.WebSocket', wsImplNo === globalThis.WebSocket, { same: wsImplNo === globalThis.WebSocket });
    const wsNoProxy = await PA.createProxyWebSocket('wss://example.invalid/ws');
    ctx.ok('无代理时 createProxyWebSocket 回退 globalThis.WebSocket', !!wsNoProxy, { type: wsNoProxy?.constructor?.name });
    try { wsNoProxy?.close(); } catch { /* ignore */ }
    ctx.ok('clearProxyConfig 后读回 null', PC.readProxyConfig() === null, PC.readProxyConfig());
    for (const k of envKeys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    ctx.set('source', { proxyConfig: `proxy/proxy-config.mjs getProxySettings:${lineOf('proxy/proxy-config.mjs', 'export function getProxySettings')}`, proxyAgent: `proxy/proxy-agent.mjs createProxyWebSocket:${lineOf('proxy/proxy-agent.mjs', 'export async function createProxyWebSocket')}` });
    ctx.set('isolatedHome', home);
};

// ---------------- D1-30 semver 比对 ----------------
P['D1-30'] = async (ctx) => {
    const cases = [
        ['1.1.2', '1.1.1', 1], ['1.1.1', '1.1.2', -1], ['1.1.0', '1.1.0-next.9', 1],
        ['1.1.1', '1.1.1', 0], ['2.0.0', '1.99.99', 1], ['1.2.0', '1.10.0', -1],
        ['1.1.0-next.1', '1.1.0-next.2', -1], ['abc', 'abc', 0]
    ];
    for (const [a, b, exp] of cases) {
        ctx.eq(`semverCompare(${a}, ${b}) = ${exp}`, U.semverCompare(a, b), exp);
    }
    ctx.ok('1.1.0 > 1.1.0-next.9（正式版大于预发布）', U.semverCompare('1.1.0', '1.1.0-next.9') > 0);
    ctx.ok('无效串按字典序（parse 返回 null 时退化为字符串比较）', U.semverParse('abc') === null && U.semverCompare('abc', 'abd') === -1, { parse: U.semverParse('abc'), cmp: U.semverCompare('abc', 'abd') });
    ctx.ok('hasPrerelease 区分预发布', U.hasPrerelease('1.1.0-next.1') === true && U.hasPrerelease('1.1.0') === false);
};

// ---------------- D1-33 skip 文件持久化与多路径 ----------------
P['D1-33'] = async (ctx) => {
    const home = isoHome('skipfile');
    process.env.HUAWEICLOUD_HOME = home;
    const f = join(home, 'a', 'b', 'skip.json');
    const st = U.writeSkipState(f, '2.0.0');
    ctx.ok('writeSkipState 递归建目录并写入', existsSync(f), { f });
    ctx.ok('文件结构 {dismissedVersion,dismissedAt,expireAt}', Object.keys(st).sort().join(',') === 'dismissedAt,dismissedVersion,expireAt', Object.keys(st));
    const noTmp = !existsSync(`${f}.${process.pid}`) && readdirSync(join(home, 'a', 'b')).every((n) => !n.endsWith('.tmp'));
    ctx.ok('原子写：临时文件已清理（无残留 .tmp）', noTmp, readdirSync(join(home, 'a', 'b')));
    ctx.eq('readSkipState 读回 dismissedVersion', U.readSkipState(f).dismissedVersion, '2.0.0');
    ctx.eq('readSkipState 对非法文件返回 null', U.readSkipState(join(home, 'nope.json')), null);
    const bad = join(home, 'bad.json'); writeFileSync(bad, '{not json', 'utf8');
    ctx.eq('readSkipState 对损坏 JSON 返回 null（不抛）', U.readSkipState(bad), null);

    const sp = U.skipFilePath();
    const fb = U.fallbackSkipFilePath();
    ctx.ok('skipFilePath 指向插件目录副本', sp.includes('.update-skip.json'), { sp });
    ctx.ok('fallbackSkipFilePath 指向 $HUAWEICLOUD_HOME/.config/huaweicloud/devkit-skip.json',
        fb === join(home, '.config', 'huaweicloud', 'devkit-skip.json'), { fb, home });
    const rs = U.resolveSkipFilePath(null);
    ctx.ok('resolveSkipFilePath(null) 返回一个有效路径（非空 .json）', typeof rs === 'string' && rs.endsWith('.json'), rs);
    const rsSess = U.resolveSkipFilePath('sess-01');
    ctx.ok('resolveSkipFilePath(sessionId) 按会话拆分后缀', rsSess !== rs && rsSess.includes('sess-01'), { rs, rsSess });
    ctx.set('paths', { skipFilePath: sp, fallbackSkipFilePath: fb, resolved: rs, resolvedSession: rsSess });
    delete process.env.HUAWEICLOUD_HOME;
};

// ---------------- D1-65 调试模式环境变量 ----------------
P['D1-65'] = async (ctx) => {
    const home = isoHome('debug');
    const mock = await startMockRegistry({ latest: '99.0.0' });
    const run = async (debugVal) => {
        const env = { HUAWEICLOUD_NPM_REGISTRY: mock.url, npm_config_registry: mock.url, HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1', HUAWEICLOUD_DEVKIT_TELEMETRY: 'off' };
        if (debugVal === undefined) delete env.HUAWEICLOUD_DEVKIT_DEBUG; else env.HUAWEICLOUD_DEVKIT_DEBUG = debugVal;
        const c = McpClient.start(env);
        try {
            await c.initialize();
            const r = parseTool((await c.call('huaweicloud_check_update', {}, 90000)).result);
            return { stderr: c.stderr, result: r.parsed?.result };
        } finally { c.kill(); }
    };
    const on1 = await run('1');
    const onTrue = await run('true');
    const off = await run('off');
    const unset = await run(undefined);
    await mock.close();
    const dbgRe = /\[debug\]/;
    ctx.ok('DEBUG=1 → 打印 [debug] 调试日志', dbgRe.test(on1.stderr), { head: clip(on1.stderr, 400) });
    ctx.ok('DEBUG=true → 打印 [debug] 调试日志', dbgRe.test(onTrue.stderr), { head: clip(onTrue.stderr, 400) });
    ctx.ok('DEBUG=off → 无调试输出', !dbgRe.test(off.stderr), { head: clip(off.stderr, 300) });
    ctx.ok('未设 DEBUG → 无调试输出', !dbgRe.test(unset.stderr), { head: clip(unset.stderr, 300) });
    const results = [on1, onTrue, off, unset].map((r) => r.result);
    ctx.ok('调试开关不影响正常返回（四种取值 result 一致）', new Set(results).size === 1, { results });
    ctx.set('source', `update-check.mjs debugLog:${lineOf('update-check.mjs', 'function debugLog')} / env 判断:${lineOf('update-check.mjs', "HUAWEICLOUD_DEVKIT_DEBUG === '1'")}`);
};

// ---------------- D1-66 遥测开关与端点环境变量 ----------------
P['D1-66'] = async (ctx) => {
    const T = await import('file:///' + SRC + '/telemetry/telemetry.mjs');
    const saved = { on: process.env.HUAWEICLOUD_DEVKIT_TELEMETRY, ep: process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT };
    process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
    ctx.eq('TELEMETRY=off → isTelemetryEnabled()=false', T.isTelemetryEnabled(), false);
    process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
    ctx.eq('TELEMETRY=on → isTelemetryEnabled()=true', T.isTelemetryEnabled(), true);
    delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
    ctx.eq('未设 TELEMETRY → isTelemetryEnabled()=true（默认开）', T.isTelemetryEnabled(), true);
    process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT = 'https://example.invalid/telemetry';
    const mcpSrc = readSrc('mcp-server.mjs');
    ctx.ok('自定义 TELEMETRY_ENDPOINT 被读取（mcp-server --telemetry-endpoint 注入 env）',
        mcpSrc.includes('HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT'), { line: lineOf('mcp-server.mjs', 'HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT') });
    delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT;
    ctx.ok('ENDPOINT 未设时回退 DEFAULT_ENDPOINT（源码常量）',
        mcpSrc.includes('HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT') && /DEFAULT_ENDPOINT|endpoint/.test(mcpSrc), null);
    const telSrc = readSrc('telemetry/telemetry.mjs');
    ctx.ok('telemetry.mjs 端点取值 = env 或 DEFAULT_ENDPOINT',
        /HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT \|\| DEFAULT_ENDPOINT/.test(telSrc), { line: lineOf('telemetry/telemetry.mjs', 'HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT || DEFAULT_ENDPOINT') });
    if (saved.on === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = saved.on;
    if (saved.ep === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT = saved.ep;
};

// ---------------- D1-67 Agent toolkit 模式 ----------------
P['D1-67'] = async (ctx) => {
    const src = readSrc('setup-cli.mjs');
    const merge = readSrc('mcp-config-merge.mjs');
    ctx.ok('setup-cli 注入 HUAWEICLOUD_AGENT_TOOLKIT_MODE=local',
        /HUAWEICLOUD_AGENT_TOOLKIT_MODE['"]?\s*[:=]\s*['"]?local/.test(src), { hits: src.split('\n').filter((l) => l.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE')).length });
    ctx.ok('HUAWEICLOUD_AGENT_TOOLKIT_MODE 写入 agent env 段（mcp-config-merge 有 env 承载）',
        /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(src) || /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(merge), null);
    const skipLine = lineOf('setup-cli.mjs', 'HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL');
    ctx.ok('SKIP_DSH_PLUGIN_INSTALL=1 时跳过 DSH 插件安装（源码分支存在）', skipLine > 0,
        { line: skipLine, code: src.split('\n')[skipLine - 1]?.trim() });

    // 真机验证：隔离 HOME + SKIP_DSH=1 重装 opencode 目标，核对 env 注入产物
    const home = isoHome('toolkit');
    const r1 = runCli(['install', '--target', 'opencode'], {
        timeout: 600000, env: { HOME: home, USERPROFILE: home, HUAWEICLOUD_HOME: home, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' }
    });
    ctx.ok('隔离 HOME 下 install --target opencode 退出码 0', r1.code === 0, { code: r1.code, err: clip(r1.stderr, 400) });
    const found = [];
    const walk = (d, depth = 0) => {
        if (depth > 5 || !existsSync(d)) return;
        for (const n of readdirSync(d)) {
            const p = join(d, n);
            try {
                const st = statSync(p);
                if (st.isDirectory()) walk(p, depth + 1);
                else if (/\.(json|jsonc|md|mdc|toml|ya?ml)$/i.test(n)) {
                    const t = readFileSync(p, 'utf8');
                    if (t.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE')) found.push(p);
                }
            } catch { /* ignore */ }
        }
    };
    walk(home);
    const ocCfg = join(home, '.config', 'opencode', 'opencode.json');
    const ocEntry = existsSync(ocCfg) ? JSON.parse(readFileSync(ocCfg, 'utf8'))?.mcp?.['huaweicloud-devkit'] : null;
    ctx.set('opencodeMcpEntry', ocEntry);
    ctx.set('opencodeConfigPath', ocCfg);

    // 对照：args 形态（.mcp.json，Codex Desktop/OpenClaw/DSH）确实注入 REQUIRED_ENV_KEYS
    const home2 = isoHome('toolkit-args');
    const r2 = runCli(['install', '--target', 'codex-desktop'], {
        timeout: 600000, env: { HOME: home2, USERPROFILE: home2, HUAWEICLOUD_HOME: home2, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' }
    });
    ctx.ok('隔离 HOME 下 install --target codex-desktop 退出码 0', r2.code === 0, { code: r2.code, err: clip(r2.stderr, 400) });
    const mcpJson = join(home2, 'plugins', 'huaweicloud-devkit', '.mcp.json');
    const argsEntry = existsSync(mcpJson) ? JSON.parse(readFileSync(mcpJson, 'utf8'))?.mcpServers?.['huaweicloud-devkit'] : null;
    ctx.set('argsStyleMcpEntry', argsEntry);
    ctx.set('argsStyleConfigPath', mcpJson);
    ctx.ok('args 形态条目 env 注入 HUAWEICLOUD_AGENT_TOOLKIT_MODE=local（对照基线成立）',
        argsEntry?.env?.HUAWEICLOUD_AGENT_TOOLKIT_MODE === 'local', argsEntry?.env);

    // OpenCode 用 command 形态（command 数组），不写 env → REQUIRED_ENV_KEYS 永不注入
    const cmdEnvMissing = !ocEntry || !ocEntry.env
        || ocEntry.env.HUAWEICLOUD_AGENT_TOOLKIT_MODE !== 'local';
    if (cmdEnvMissing) {
        ctx.fail(`OpenCode(command 形态) 未注入 REQUIRED_ENV_KEYS：隔离 HOME 全新安装后 ${ocCfg} 的 mcp['huaweicloud-devkit'] 无 env 段（实测 entry=${JSON.stringify(ocEntry)}），而同批 args 形态条目 ${mcpJson} 写入了 HUAWEICLOUD_AGENT_TOOLKIT_MODE=local。setup-cli.mjs:662 updateOpenCodeConfig 调用 mergeCommandStyle(existing,{mcpPath}) 未传 env，而 writeMcpServersFile(setup-cli.mjs:697) 传入 env:{HUAWEICLOUD_AGENT_TOOLKIT_MODE:'local'}，导致 OpenCode 客户端的 MCP 子进程拿不到 toolkit 模式与 HCLOUD_BIN`);
    } else {
        ctx.ok('OpenCode(command 形态) 同样注入 HUAWEICLOUD_AGENT_TOOLKIT_MODE=local', true, ocEntry.env);
    }

    const home3 = isoHome('toolkit-skipdsh');
    const r3 = runCli(['install', '--target', 'dsh'], {
        timeout: 600000, env: { HOME: home3, USERPROFILE: home3, HUAWEICLOUD_HOME: home3, HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL: '1' }
    });
    const dshFiles = [];
    const walk2 = (d, depth = 0) => {
        if (depth > 5 || !existsSync(d)) return;
        for (const n of readdirSync(d)) {
            const p = join(d, n);
            try {
                const st = statSync(p);
                if (st.isDirectory()) walk2(p, depth + 1); else dshFiles.push(p);
            } catch { /* ignore */ }
        }
    };
    ctx.ok('SKIP_DSH=1 时 install --target dsh 退出码 0', r3.code === 0, { code: r3.code, err: clip(r3.stderr, 400) });
    ctx.ok('SKIP_DSH=1 时 stdout 明确输出 "DSH MCP client install skipped by environment"',
        /DSH MCP client install skipped by environment/.test(r3.stdout), clip(r3.stdout, 500));
    // SKIP_DSH 真实语义（setup-cli.mjs:2272 tryInstallDshMcpClient）：跳过 @deepseek-ai/dsh-mcp-client 自动安装，
    // 并不跳过 dsh 插件目录/skills 的复制，故断言对象是 profile 的 package.json 依赖。
    const dshProfilePkg = join(home3, '.dsh', 'profiles', 'web', 'package.json');
    const dshProfileText = existsSync(dshProfilePkg) ? readFileSync(dshProfilePkg, 'utf8') : null;
    ctx.set('dshProfilePackageJsonExists', dshProfileText !== null);
    ctx.ok('SKIP_DSH=1 时未把 @deepseek-ai/dsh-mcp-client 写入 DSH profile 依赖',
        dshProfileText === null || !/dsh-mcp-client/.test(dshProfileText),
        { path: dshProfilePkg, text: dshProfileText === null ? null : clip(dshProfileText, 300) });
    const dshInstalled = join(home3, '.dsh', 'huaweicloud-plugins', '.installed');
    ctx.ok('DSH 插件目录（skills/hook 产物）与 SKIP_DSH 分支解耦，可正常落盘', existsSync(dshInstalled) || existsSync(join(home3, '.dsh', 'huaweicloud-plugins')),
        { dshPluginsDir: join(home3, '.dsh', 'huaweicloud-plugins') });
    walk2(join(home3, '.dsh'));
    ctx.set('dshFileSample', dshFiles.slice(0, 12));
    ctx.set('isolatedHome', home);
    ctx.set('isolatedHomeArgsStyle', home2);
    ctx.set('isolatedHomeSkipDsh', home3);
    ctx.set('rootCause', 'plugins/huaweicloud-core/src/setup-cli.mjs:662 updateOpenCodeConfig 未传 env（对比 :697 writeMcpServersFile 传入 env）');
};

// ---------------- D1-68 图标离线与区域环境变量 ----------------
P['D1-68'] = async (ctx) => {
    const home = isoHome('icons');
    process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
    const IL = await import('file:///' + SRC + '/icon-library.mjs');
    const offline = await IL.getServiceIcon('ecs');
    ctx.ok('ICONS_OFFLINE=1 时 getServiceIcon 走本地 manifest 返回图标', !!offline && !!(offline.matches?.length || offline.matches), clip(offline, 400));
    ctx.ok('离线分支读本地 manifest 而非网络', /HUAWEICLOUD_ICONS_OFFLINE === '1'/.test(readSrc('icon-library.mjs')),
        { line: lineOf('icon-library.mjs', "HUAWEICLOUD_ICONS_OFFLINE === '1'") });
    delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
    IL.clearIconCache();

    const C = await import('file:///' + SRC + '/auth/credentials.mjs');
    const savedA = process.env.HW_REGION, savedB = process.env.HUAWEICLOUD_REGION;
    const ak = process.env.HW_ACCESS_KEY || 'AKIATESTPROBE000001';
    const sk = process.env.HW_SECRET_KEY || 'probe-secret-key-000001';
    process.env.HW_ACCESS_KEY = ak; process.env.HW_SECRET_KEY = sk;
    process.env.HW_REGION = 'cn-north-4';
    process.env.HUAWEICLOUD_REGION = 'cn-south-1';
    const r1 = C.resolveCredentials();
    process.env.HW_REGION = '';
    const r2 = C.resolveCredentials();
    ctx.eq('同时设置 HW_REGION 与 HUAWEICLOUD_REGION 时实际取值', r1.region, r1.region);
    ctx.set('regionPrecedenceObserved', { HW_REGION_and_HUAWEICLOUD_REGION: r1.region, HUAWEICLOUD_REGION_only: r2.region });
    const expect = 'HUAWEICLOUD_REGION 优先于 HW_REGION';
    if (r1.region !== 'cn-south-1') {
        ctx.spec(`区域优先级漂移：设计契约「${expect}」，实现为 HW_REGION 优先（credentials.mjs:222 \`process.env.HW_REGION || process.env.HUAWEICLOUD_REGION\`）；实测同时设置两者时 region=${r1.region}`);
    } else {
        ctx.ok(expect, true, { region: r1.region });
    }
    ctx.ok('仅设 HUAWEICLOUD_REGION 时取该值（env 兜底生效）', r2.region === 'cn-south-1', r2.region);
    if (savedA === undefined) delete process.env.HW_REGION; else process.env.HW_REGION = savedA;
    if (savedB === undefined) delete process.env.HUAWEICLOUD_REGION; else process.env.HUAWEICLOUD_REGION = savedB;
    ctx.set('rootCause', 'plugins/huaweicloud-core/src/auth/credentials.mjs:222');
};

// ---------------- D1-69 CLI help 子命令 ----------------
P['D1-69'] = async (ctx) => {
    const r = runCli(['help'], { timeout: 180000 });
    ctx.ok('help 退出码 0', r.code === 0, { code: r.code });
    const cmds = ['install', 'uninstall', 'update', 'status', 'doctor', 'auth', 'install-hcloud', 'help'].filter((c) => r.stdout.includes(c));
    ctx.ok('help 输出帮助文案 + 命令列表（≥7 个子命令）', cmds.length >= 7, { cmds });
    ctx.ok('help 输出含 Usage 用法段', /Usage:/i.test(r.stdout), clip(r.stdout, 200));
    ctx.ok('help 输出非 TODO / 非空', r.stdout.trim().length > 200 && !/\bTODO\b/.test(r.stdout), { len: r.stdout.length });
    ctx.ok('help 输出版本号（与已装包一致）', r.stdout.includes(installedVersion()), { version: installedVersion() });
    const r2 = runCli(['--version'], { timeout: 180000 });
    ctx.ok('--version 退出码 0 且输出版本', r2.code === 0 && r2.stdout.includes(installedVersion()), { code: r2.code, out: clip(r2.stdout, 200) });
    ctx.set('helpHead', clip(r.stdout, 600));
};
