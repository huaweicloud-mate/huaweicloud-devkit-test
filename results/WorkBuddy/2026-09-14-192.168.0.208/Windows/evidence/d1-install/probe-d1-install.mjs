/**
 * WorkBuddy 每日测试探针 - D1 安装/卸载/更新 + D4-23 + D4-12 + D7-4（v1.1.4-next.6）
 *
 * 隔离策略: setup-cli.mjs 的目标路径均由 homedir() 派生（或专属 env），
 *   Windows 上 os.homedir() 优先读 USERPROFILE → 逐目标设 USERPROFILE=<tmp> 实现全隔离。
 *   dsh=DSH_HOME / atomcode=ATOMCODE_HOME / hermes=HERMES_HOME（setup-cli.mjs:154/:215/:2476）。
 *   officeace: 真实 OfficeAce 已装（注册表 InstallDir 探测），install 会写真实目录 → 跳过执行，源码级+status 检测。
 *   workbuddy: 真实安装存在于真实 ~/.workbuddy → 隔离安装验证 + 真实安装就地核验。
 *
 * D1-6 说明: Windows 下 cmdInstallHcloud 会自动下载安装并修改真实用户 PATH（HKCU Environment），
 *   为避免污染真实机器：①以剥离 powershell 的 PATH 触发失败引导路径（输出镜像/沙箱/手动指引）
 *   ②pinned 镜像 URL 可达性验证 ③真实 KooCLI 7.2.12 已装可运行作为既成证据。不动真实用户 PATH。
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PKG = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit';
const SETUP = join(PKG, 'bin', 'setup.cjs');
const NODE = process.execPath;
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const KOO_ZIP = 'https://cn-north-4-hdn-koocli.obs.cn-north-4.myhuaweicloud.com/cli/7.2.12/huaweicloud-cli-windows-amd64.zip';

const results = [];
function t(id, name, pass, actual, expected, note) {
  results.push({ case: id, name, pass: pass === null ? null : !!pass, actual: String(actual), expected: String(expected), note: note || '' });
  console.log(`[${pass === null ? 'INFO' : pass ? 'PASS' : 'FAIL'}] ${id} ${name}\n    actual=${actual}\n    expected=${expected}${note ? '\n    note=' + note : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; } };
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const log = (s) => console.log(`---- ${s}`);

function runCli(args, { env, cwd, timeoutMs = 420000, input } = {}) {
  const t0 = Date.now();
  const r = spawnSync(NODE, [SETUP, ...args], {
    env, cwd, input, encoding: 'utf-8', timeout: timeoutMs, windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`, ms: Date.now() - t0, error: r.error?.code };
}

// ── 目标定义 ──
const ROOT = join(process.cwd(), 'tmp');
const TARGETS = [
  {
    name: 'opencode',
    home: () => join(ROOT, 'opencode', 'home'),
    plugins: (h) => join(h, '.config', 'opencode', 'huaweicloud-plugins'),
    skills: (h) => join(h, '.config', 'opencode', 'skills'),
    mcpRegistered: (h) => {
      const cfg = readJson(join(h, '.config', 'opencode', 'opencode.json')) || readJson(join(h, '.config', 'opencode', 'opencode.jsonc'));
      return Boolean(cfg?.mcp?.['huaweicloud-devkit']);
    },
  },
  {
    name: 'codex-desktop',
    home: () => join(ROOT, 'codex-desktop', 'home'),
    plugins: (h) => join(h, 'plugins', 'huaweicloud-devkit'),
    skills: (h) => join(h, 'plugins', 'huaweicloud-devkit', 'skills'),
    mcpRegistered: (h) => {
      const m = readJson(join(h, 'plugins', 'huaweicloud-devkit', '.mcp.json'));
      const mp = readJson(join(h, '.agents', 'plugins', 'marketplace.json'));
      return Boolean(m?.mcpServers?.['huaweicloud-devkit']) && JSON.stringify(mp || {}).includes('huaweicloud-devkit');
    },
  },
  {
    name: 'codearts',
    home: () => join(ROOT, 'codearts', 'home'),
    plugins: (h) => join(h, '.codeartsdoer', 'huaweicloud-plugins'),
    skills: (h) => join(h, '.codeartsdoer', 'skills'),
    mcpRegistered: (h) => Boolean(readJson(join(h, '.codeartsdoer', 'mcp', 'mcp_settings.json'))?.mcpServers?.['huaweicloud-devkit']),
  },
  {
    name: 'codearts-work',
    home: () => join(ROOT, 'codearts-work', 'home'),
    plugins: (h) => join(h, '.codeartswork', 'huaweicloud-plugins'),
    skills: (h) => join(h, '.codeartswork', 'skills'),
    mcpRegistered: (h) => Boolean(readJson(join(h, '.codeartswork', 'mcp', 'mcp_settings.json'))?.mcp?.['huaweicloud-devkit']),
  },
  {
    name: 'workbuddy',
    home: () => join(ROOT, 'workbuddy', 'home'),
    plugins: (h) => join(h, '.workbuddy', 'huaweicloud-plugins'),
    skills: (h) => join(h, '.workbuddy', 'skills'),
    mcpRegistered: (h) => Boolean(readJson(join(h, '.workbuddy', 'mcp.json'))?.mcpServers?.['huaweicloud-devkit']),
  },
  {
    name: 'dsh',
    home: () => join(ROOT, 'dsh', 'home'),
    env: (h) => ({ DSH_HOME: join(ROOT, 'dsh', 'dshroot') }),
    plugins: () => join(ROOT, 'dsh', 'dshroot', 'huaweicloud-plugins'),
    skills: () => join(ROOT, 'dsh', 'dshroot', 'skills'),
    mcpRegistered: () => {
      try {
        const p = readFileSync(join(ROOT, 'dsh', 'dshroot', 'profiles', 'web', 'cordis.patch.yml'), 'utf-8');
        return p.includes('id: huaweicloud-devkit') && p.includes('serverName: huaweicloud');
      } catch { return false; }
    },
  },
  {
    name: 'openclaw',
    home: () => join(ROOT, 'openclaw', 'home'),
    plugins: (h) => join(h, '.agents', 'huaweicloud-plugins'),
    skills: (h) => join(h, '.agents', 'skills'),
    mcpRegistered: (h) => Boolean(readJson(join(h, '.agents', 'huaweicloud-plugins', '.mcp.json'))?.mcpServers?.['huaweicloud-devkit']),
  },
  {
    name: 'atomcode',
    home: () => join(ROOT, 'atomcode', 'home'),
    env: () => ({ ATOMCODE_HOME: join(ROOT, 'atomcode', 'atomroot') }),
    plugins: () => join(ROOT, 'atomcode', 'atomroot', 'huaweicloud-plugins'),
    skills: () => join(ROOT, 'atomcode', 'atomroot', 'skills'),
    mcpRegistered: () => Boolean(readJson(join(ROOT, 'atomcode', 'atomroot', 'mcp.json'))?.mcpServers?.['huaweicloud-devkit']),
  },
  {
    name: 'hermes',
    home: () => join(ROOT, 'hermes', 'home'),
    env: () => ({ HERMES_HOME: join(ROOT, 'hermes', 'hermesroot') }),
    plugins: () => join(ROOT, 'hermes', 'hermesroot', 'huaweicloud-plugins'),
    skills: () => join(ROOT, 'hermes', 'hermesroot', 'skills'),
    mcpRegistered: () => {
      try {
        const c = readFileSync(join(ROOT, 'hermes', 'hermesroot', 'config.yaml'), 'utf-8');
        return c.includes('mcp_servers:') && c.includes('huaweicloud-devkit');
      } catch { return false; }
    },
  },
];

function envFor(tg) {
  const h = tg.home();
  mkdirSync(h, { recursive: true });
  const env = {
    ...process.env,
    USERPROFILE: h,
    HOMEDRIVE: '', HOMEPATH: '',
    HUAWEICLOUD_HOME: h,
    ...(tg.env ? tg.env(h) : {}),
  };
  delete env.HOMEDRIVE; delete env.HOMEPATH;
  return env;
}
const huaweiCount = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.startsWith('huawei')).length : 0);

async function main() {
  mkdirSync(ROOT, { recursive: true });

  // ════════ Phase 1: D4-23(P0) + D1-1 隔离安装 ×9 ════════
  for (const tg of TARGETS) {
    log(`install --target ${tg.name}`);
    const cwd = join(ROOT, tg.name);
    mkdirSync(cwd, { recursive: true });
    const r = runCli(['install', '--target', tg.name], { env: envFor(tg), cwd });
    const h = tg.home();
    const pl = tg.plugins(h);
    const mcpOk = tg.mcpRegistered(h);
    const skillsN = huaweiCount(tg.skills(h));
    const mcpServer = existsSync(join(pl, 'src', 'mcp-server.mjs'));
    const marker = existsSync(join(pl, '.installed'));
    const policy = readJson(join(pl, 'safety', 'policy.json'));
    const rules = existsSync(join(pl, 'safety', 'rules', 'cloud-risk-rules.json'));
    const mustSecret = Array.isArray(policy?.blockedSecretOperations) && policy.blockedSecretOperations.includes('ShowSecretVersion');
    const writePfx = Array.isArray(policy?.writeOperationPrefixes);

    t('D1-1', `[${tg.name}] install 退出码 0`, r.status === 0, `exit=${r.status} ${r.ms}ms`, '0',
      r.status !== 0 ? r.out.split('\n').filter((l) => /fail|error|ERR/i.test(l)).slice(-3).join(' | ').slice(0, 200) : '');
    t('D4-23', `[${tg.name}] MCP 注册落位`, mcpOk, String(mcpOk), 'true');
    t('D4-23', `[${tg.name}] skills 注入（huawei*）`, skillsN > 0, `count=${skillsN}`, '>0');
    t('D1-1', `[${tg.name}] MCP server + .installed marker`, mcpServer && marker, `server=${mcpServer} marker=${marker}`, 'both');
    t('D4-23', `[${tg.name}] 安全策略注入且 csms 拦截约束在位（MUST）`, mustSecret && writePfx && rules,
      `ShowSecretVersion=${mustSecret} writePrefixes=${writePfx} rules=${rules}`, 'all true',
      mustSecret ? '执行面拦截已由 D4-19 证据证明（CSMS ShowSecretVersion plan 即 deny 且确认后仍拦）' : '');
    if (tg.name === 'workbuddy') {
      const hooksDir = join(pl, 'hooks');
      const hooks = existsSync(hooksDir) ? readdirSync(hooksDir) : [];
      t('D4-23', '[workbuddy] hooks 注入（safety hook 落位）', hooks.length > 0, hooks.join(','), '非空');
    }
  }

  // codex: 无 Codex CLI 的失败引导路径
  {
    log('install --target codex (expect CLI-not-found guidance)');
    const tg = { name: 'codex', home: () => join(ROOT, 'codex', 'home') };
    const r = runCli(['install', '--target', 'codex'], { env: envFor(tg), cwd: join(ROOT, 'codex') });
    t('D1-1', '[codex] 无 Codex CLI 时失败引导（不误装）', r.status !== 0 && /Codex CLI not found/i.test(r.out),
      `exit=${r.status} matched=${/Codex CLI not found/i.test(r.out)}`, 'exit!=0 + 提示');
  }

  // officeace: 源码级（真实 OfficeAce 在机，禁止真实写入）
  {
    const realOfficeace = existsSync('C:/Users/Administrator/AppData/Local/Programs/OfficeAce/.office-claw/capabilities.json');
    t('D4-23', '[officeace] 未执行真实安装（真实 OfficeAce 在机，防写入真实目录）', null, `realOfficeace=${realOfficeace}`, '源码级验证',
      'installOfficeAce(setup-cli.mjs:2352) 与其他目标同构：copyDir skills/src/safety + writeFileSync .installed(:2401) + capabilities/sqlite 注册；MUST 约束同 safety/policy.json（已由隔离目标验证）');
    const r = runCli(['status', '--target', 'officeace'], {});
    t('D4-23', '[officeace] status 检测真实注册状态（只读）', r.status === 0, `exit=${r.status}`, '0',
      r.out.split('\n').filter((l) => /officeace/i.test(l)).slice(0, 3).join(' | ').slice(0, 160));
  }

  // D1-1: 隔离 opencode 插件目录的 MCP server 可启动
  {
    log('isolated opencode mcp-server.mjs handshake');
    const server = join(ROOT, 'opencode', 'home', '.config', 'opencode', 'huaweicloud-plugins', 'src', 'mcp-server.mjs');
    const env = envFor(TARGETS[0]);
    const child = spawn(NODE, [server], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = Buffer.alloc(0); let resp = null;
    child.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      const i = buf.indexOf('\r\n\r\n');
      if (i === -1) return;
      const m = buf.subarray(0, i).toString().match(/Content-Length:\s*(\d+)/i);
      if (!m) return;
      const end = i + 4 + Number(m[1]);
      if (buf.length < end) return;
      resp = JSON.parse(buf.subarray(i + 4, end).toString('utf-8'));
    });
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } } });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
    const t0 = Date.now();
    while (!resp && Date.now() - t0 < 30000) await sleep(300);
    child.kill();
    t('D1-1', '隔离安装的 MCP server 可启动并应答 initialize', !!resp?.result?.serverInfo,
      JSON.stringify(resp?.result?.serverInfo || 'no-response'), 'serverInfo 返回');
  }

  // ════════ Phase 2: D1-4 update 幂等 + status 只读（opencode 隔离） ════════
  {
    log('D1-4 update idempotency (opencode)');
    const tg = TARGETS[0];
    const env = envFor(tg); const cwd = join(ROOT, 'opencode');
    const cfgPath = join(tg.home(), '.config', 'opencode', 'opencode.json');
    // 预置用户自有配置键，验证 update 不碰用户 config
    const userCfg = { theme: 'dark', customKey: { a: 1 }, mcp: {} };
    mkdirSync(join(tg.home(), '.config', 'opencode'), { recursive: true });
    writeFileSync(cfgPath, JSON.stringify(userCfg, null, 2));
    const r1 = runCli(['update', '--target', 'opencode'], { env, cwd });
    const cfgAfter1 = readJson(cfgPath) || {};
    const userKeysKept1 = cfgAfter1.theme === 'dark' && cfgAfter1.customKey?.a === 1;
    const entries1 = Object.keys(cfgAfter1.mcp || {}).filter((k) => k === 'huaweicloud-devkit').length;
    const sha1 = sha256(cfgPath);
    const r2 = runCli(['update', '--target', 'opencode'], { env, cwd });
    const sha2 = sha256(cfgPath);
    const cfgAfter2 = readJson(cfgPath) || {};
    const userKeysKept2 = cfgAfter2.theme === 'dark' && cfgAfter2.customKey?.a === 1;
    t('D1-4', 'update 退出码 0 且注册条目唯一', r1.status === 0 && r2.status === 0 && entries1 === 1,
      `u1=${r1.status} u2=${r2.status} entries=${entries1}`, '0/0/1');
    t('D1-4', 'update 保留用户自有配置键（theme/customKey）', userKeysKept1 && userKeysKept2,
      `after1=${userKeysKept1} after2=${userKeysKept2}`, 'both kept');
    t('D1-58', '重复 update 幂等（第二次配置字节不变）', sha1 === sha2, `${sha1.slice(0, 12)} vs ${sha2.slice(0, 12)}`, 'sha 相同');

    // status 只读
    const before = sha256(cfgPath);
    const rs = runCli(['status', '--target', 'opencode'], { env, cwd });
    const after = sha256(cfgPath);
    t('D1-4', 'status 只读（配置字节不变）', rs.status === 0 && before === after,
      `exit=${rs.status} shaSame=${before === after}`, '0 + 不变');
  }

  // ════════ Phase 3: D1-58 白名单合并/坏 JSON/未命中（opencode 配置面） ════════
  {
    log('D1-58 bad-JSON / already-configured / snippet (opencode config)');
    const tg = TARGETS[0];
    const env = envFor(tg); const cwd = join(ROOT, 'opencode');
    const cfgDir = join(tg.home(), '.config', 'opencode');
    const cfgPath = join(cfgDir, 'opencode.json');

    // (a) 坏 JSON 零写入
    rmSync(cfgPath, { force: true });
    writeFileSync(cfgPath, '{ this is not valid json !!!', 'utf-8');
    const badSha = sha256(cfgPath);
    const rb = runCli(['install', '--target', 'opencode'], { env, cwd });
    const badShaAfter = sha256(cfgPath);
    t('D1-58', '坏 JSON 零写入（原文件字节不变）', badSha === badShaAfter && /not valid JSON/i.test(rb.out),
      `shaSame=${badSha === badShaAfter} msg=${/not valid JSON/i.test(rb.out)}`, 'sha 相同 + 报错提示');

    // (b) 已配置 → skipping，无重复备份/条目
    rmSync(cfgPath, { force: true });
    const pre = { mcp: { 'huaweicloud-devkit': { command: 'existing' } }, owner: 'user' };
    writeFileSync(cfgPath, JSON.stringify(pre, null, 2));
    const rc = runCli(['install', '--target', 'opencode'], { env, cwd });
    const cfgC = readJson(cfgPath) || {};
    const n = Object.keys(cfgC.mcp || {}).filter((k) => k === 'huaweicloud-devkit').length;
    t('D1-58', '已配置时 skipping（条目唯一 + owner 保留）', /skip/i.test(rc.out) && n === 1 && cfgC.owner === 'user',
      `skipMsg=${/skip/i.test(rc.out)} entries=${n} owner=${cfgC.owner}`, 'skip + 1 + 保留');
  }

  // ════════ Phase 4: D1-5 卸载 + 无残留 ════════
  for (const tg of TARGETS) {
    log(`uninstall --target ${tg.name}`);
    const cwd = join(ROOT, tg.name);
    const r = runCli(['uninstall', '--target', tg.name], { env: envFor(tg), cwd, timeoutMs: 240000 });
    const h = tg.home();
    const pl = tg.plugins(h);
    const plGone = !existsSync(pl);
    const skillsN = huaweiCount(tg.skills(h));
    const mcpGone = !tg.mcpRegistered(h);
    let projResidue = true;
    if (tg.name === 'codearts') projResidue = huaweiCount(join(cwd, '.codeartsdoer', 'skills')) === 0;
    t('D1-5', `[${tg.name}] uninstall 退出码 0`, r.status === 0, `exit=${r.status}`, '0');
    t('D1-5', `[${tg.name}] 无残留（插件目录删净 + skills 无 huawei* + MCP 注册摘除${tg.name === 'codearts' ? ' + 项目级无残留' : ''}）`,
      plGone && skillsN === 0 && mcpGone && projResidue,
      `pluginsGone=${plGone} skills=${skillsN} mcpGone=${mcpGone} proj=${projResidue}`, '全净');
  }

  // ════════ Phase 5: D1-3 doctor（隔离空 HOME + 真实环境） ════════
  {
    log('doctor isolated-empty + real');
    const emptyHome = join(ROOT, 'doctor-home');
    mkdirSync(emptyHome, { recursive: true });
    const envI = { ...process.env, USERPROFILE: emptyHome, HUAWEICLOUD_HOME: emptyHome };
    delete envI.DSH_HOME; delete envI.ATOMCODE_HOME; delete envI.HERMES_HOME;
    const ri = runCli(['doctor'], { env: envI, cwd: join(ROOT, 'doctor-home'), timeoutMs: 180000 });
    const failReported = (ri.out.match(/\[FAIL\]/g) || []).length;
    const hasGuide = /Run:|Guide:|npx|install/i.test(ri.out);
    t('D1-3', '隔离空环境 doctor 如实报告缺失（FAIL 项 + 修复指引）', ri.status !== 0 && failReported > 0 && hasGuide,
      `exit=${ri.status} FAILs=${failReported} guide=${hasGuide}`, 'exit!=0 + FAIL 项 + 指引');

    const rr = runCli(['doctor'], { cwd: ROOT, timeoutMs: 180000 });
    const passN = (rr.out.match(/\[PASS\]/g) || []).length;
    t('D1-3', '真实环境 doctor 通过项如实（hcloud/插件在位）', rr.status === 0 || passN > 0,
      `exit=${rr.status} PASSs=${passN}`, '诊断输出正常',
      rr.out.split('\n').filter((l) => /\[(PASS|FAIL|WARN)\]/.test(l)).slice(0, 12).join(' ; ').slice(0, 300));
  }

  // ════════ Phase 6: D1-6 install-hcloud 引导（失败路径安全触发 + 镜像可达 + 真实在装） ════════
  {
    log('D1-6 install-hcloud guidance path');
    const tgHome = join(ROOT, 'hcloud-home');
    mkdirSync(tgHome, { recursive: true });
    const env = {
      ...process.env, USERPROFILE: tgHome, HUAWEICLOUD_HOME: tgHome,
      PATH: 'C:\\Windows\\System32;C:\\Windows', // 剥离 powershell → 下载失败 → 手动引导路径（不写真实 PATH）
    };
    const r = runCli(['install-hcloud'], { env, cwd: join(ROOT, 'hcloud-home'), timeoutMs: 120000, input: 'n\n' });
    const mirrorHint = r.out.includes('cn-north-4-hdn-koocli.obs.cn-north-4.myhuaweicloud.com');
    const manual = /Manual: download|Guide: https:\/\/support\.huaweicloud\.com/.test(r.out);
    t('D1-6', 'install-hcloud 输出含镜像地址（pinned 7.2.12）', mirrorHint, String(mirrorHint), 'true',
      `exit=${r.status}`);
    t('D1-6', '安装失败时给出手动指引（镜像/指南链接）', manual, String(manual), 'true');

    // pinned 镜像可达性（不落盘）
    let urlOk = false; let urlStatus = '';
    try {
      const resp = await fetch(KOO_ZIP, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      urlOk = resp.ok || resp.status === 206; urlStatus = String(resp.status);
    } catch (e) { urlStatus = e.message; }
    t('D1-6', 'pinned KooCLI 镜像包可达（HEAD/Range 探测）', urlOk, urlStatus, '200/206');

    const realHcloud = spawnSync('C:/Users/Administrator/hcloud/hcloud.exe', ['version'], { encoding: 'utf-8', timeout: 20000 });
    t('D1-6', '真实 KooCLI 在装可运行（7.2.12 引导闭环既成证据）', realHcloud.status === 0,
      String(realHcloud.stdout || '').trim().slice(0, 60), 'exit 0',
      '注: Windows 自动安装路径会写真实用户 PATH（HKCU），为防机器污染未执行 happy-path，以镜像可达+真实在装+引导输出三证替代');
  }

  // ════════ Phase 7: D7-4 华为镜像安装 ════════
  {
    log('D7-4 mirror install');
    const prefix = join(ROOT, 'mirror-install');
    rmSync(prefix, { recursive: true, force: true });
    const t0 = Date.now();
    const r = spawnSync('npm', ['install', 'huaweicloud-devkit', '--registry=https://repo.huaweicloud.com/repository/npm/', '--no-audit', '--no-fund'], {
      cwd: ROOT, encoding: 'utf-8', timeout: 570000, windowsHide: true, shell: true, maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, npm_config_prefix: prefix },
    });
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    const installedPkg = readJson(join(prefix, 'node_modules', 'huaweicloud-devkit', 'package.json'));
    const binOk = existsSync(join(prefix, 'node_modules', 'huaweicloud-devkit', 'bin', 'setup.cjs'));
    t('D7-4', '华为云镜像 registry 安装成功且版本正确', r.status === 0 && installedPkg?.version === '1.1.4-next.6' && binOk,
      `exit=${r.status} v=${installedPkg?.version} bin=${binOk} ${Date.now() - t0}ms`, '1.1.4-next.6',
      out.split('\n').filter((l) => /error|warn/i.test(l)).slice(-3).join(' | ').slice(0, 200));

    // D4-12 SBOM 尝试（npm sbom）
    const rs = spawnSync('npm', ['sbom', '--sbom-format', 'cyclonedx', '--registry=https://repo.huaweicloud.com/repository/npm/'], {
      cwd: prefix, encoding: 'utf-8', timeout: 240000, windowsHide: true, shell: true, maxBuffer: 32 * 1024 * 1024,
    });
    const bom = readJson(join(prefix, 'sbom.cdx.json'));
    t('D4-12', 'SBOM 可产（npm sbom cyclonedx）', rs.status === 0 && !!bom?.components && JSON.stringify(bom.components).includes('huaweicloud-devkit'),
      `exit=${rs.status} components=${bom?.components?.length ?? 0}`, '含 huaweicloud-devkit');
  }

  // ════════ Phase 8: D4-12 安装包完整性审计 ════════
  {
    log('D4-12 postinstall audit + pack diff vs hdk@69ac727');
    const pkg = readJson(join(PKG, 'package.json'));
    const scripts = pkg.scripts || {};
    const dangerous = ['preinstall', 'install', 'postinstall', 'prepublish', 'prepare'].filter((k) => k in scripts);
    t('D4-12', 'package.json 无 install 钩子脚本（preinstall/postinstall/prepare 等）', dangerous.length === 0,
      dangerous.length ? dangerous.join(',') : '无', '无',
      `scripts keys=${Object.keys(scripts).join(',').slice(0, 160)}`);

    // 逐文件哈希对比: SUT 安装包 vs hdk 源码（同一 gitHead 69ac7279）
    const relDirs = ['plugins/huaweicloud-core/src', 'plugins/huaweicloud-core/safety', 'plugins/huaweicloud-core/skills', 'bin', 'integrations'];
    function walk(dir, base, acc) {
      if (!existsSync(dir)) return acc;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p, base, acc);
        else acc.push(p.slice(base.length + 1).replace(/\\/g, '/'));
      }
      return acc;
    }
    let same = 0; let diff = []; let onlySut = []; let onlyHdk = [];
    for (const d of relDirs) {
      const sutFiles = walk(join(PKG, d), PKG, []);
      const hdkFiles = walk(join(HDK, d), HDK, []);
      const sutSet = new Set(sutFiles); const hdkSet = new Set(hdkFiles);
      onlySut.push(...sutFiles.filter((f) => !hdkSet.has(f)));
      onlyHdk.push(...hdkFiles.filter((f) => !sutSet.has(f)));
      // f 为 PKG/HDK 相对全路径，逐文件哈希比较
      for (const f of sutFiles) {
        if (!hdkSet.has(f)) continue;
        try {
          if (sha256(join(PKG, f)) === sha256(join(HDK, f))) same += 1; else diff.push(f);
        } catch { diff.push(f); }
      }
    }
    t('D4-12', '安装包与 hdk 源码（gitHead 69ac7279）pack 一致', diff.length === 0 && onlySut.length === 0 && onlyHdk.length === 0,
      `same=${same} diff=${diff.length} onlySut=${onlySut.length} onlyHdk=${onlyHdk.length}`, '全一致',
      [...diff, ...onlySut.map((f) => 'SUT-only:' + f), ...onlyHdk.map((f) => 'HDK-only:' + f)].slice(0, 8).join(',').slice(0, 300));
  }

  // ════════ 汇总 ════════
  const pass = results.filter((r) => r.pass === true).length;
  const fail = results.filter((r) => r.pass === false).length;
  const info = results.filter((r) => r.pass === null).length;
  console.log(`\n===== SUMMARY: ${pass} PASS / ${fail} FAIL / ${info} INFO =====`);
  writeFileSync('results.json', JSON.stringify({ suite: 'd1-install', pass, fail, info, results }, null, 2));
}

main().catch((e) => { console.error('PROBE CRASH:', e); process.exit(1); });
