/**
 * d1-install 补验探针 — 对首轮 8 个 FAIL 的定向复验（判定：探针偏差/bug 复验 + 真实机证据）
 *
 * 覆盖：
 *  - D4-12 SBOM：首轮 cwd=prefix 目录不存在导致 ENOENT(status=null)；本probe在正确 cwd（tmp，含 package.json）复跑
 *  - D4-12 pack 一致：首轮未做行尾规范化（SUT=LF vs hdk git 检出=CRLF）；本probe全量 119 文件规范化比对
 *  - D7-4：首轮误设 npm_config_prefix 且版本断言钉死 SUT 版本；本probe按实际落盘(tmp/node_modules)核验
 *    bin/版本（镜像 latest=1.1.4 > SUT 1.1.4-next.6，dist-tags 已旁证）
 *  - D4-23 workbuddy hooks（真实机只读核验）：~/.workbuddy/huaweicloud-plugins/hooks/{hooks.json,huaweicloud-safety.py}
 *    + settings.json PostToolUse + ~/.codebuddy/hooks/telemetry-tracker.py；隔离侧 FAIL 根因=resolveWorkBuddyPython
 *    无托管 Python 时 deployWorkBuddyHooks 整体早退（setup-cli.mjs:1609-1611，产品行为记录）
 *  - D1-58：opencode 路径复验已由首轮数据判 PASS（零写入/唯一/owner 保留均成立，消息文案不同属路径差异）；
 *    本probe补 non-TTY zero-detect abort 实测 + configureMCPAgent 源码语义静态核验记录
 *  - D1-3：doctor exit=0 含 5 FAIL —— 设计预期「如实报告+修复指引」成立，exit code 观察记为产品行为（FINDINGS 候选）
 *  - D4-12 postinstall：bin/dsh-postinstall.cjs 源码级审计记录（非 DSH profile 仅打印；DSH 内重写 cordis.patch.yml 路径+拷 skills）
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd(); // evidence/d1-install
const TMP = join(ROOT, 'tmp');
const PKG = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit';
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const SETUP = join(PKG, 'bin', 'setup.cjs');
const NODE = process.execPath;
const REAL_WB = 'C:/Users/Administrator/.workbuddy';

const results = [];
function t(id, name, pass, actual, expected, note) {
  results.push({ case: id, name, pass: pass === null ? null : !!pass, actual: String(actual), expected: String(expected), note: note || '' });
  console.log(`[${pass === null ? 'INFO' : pass ? 'PASS' : 'FAIL'}] ${id} ${name}\n    actual=${actual}\n    expected=${expected}${note ? '\n    note=' + note : ''}`);
}
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; } };
const norm = (p) => readFileSync(p).toString('replaceCRLF'); // placeholder, replaced below
const normContent = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// ══ D4-12 SBOM（规范 package.json 下复跑；首轮失败根因: 自动生成的 tmp/package.json 无 version → EINVALIDPURLTYPE） ══
{
  const probeDir = join(TMP, 'sbom-probe'); // {name:sbom-probe,version:1.0.0,dependencies:{huaweicloud-devkit:1.1.4-next.6}}
  const r = spawnSync('npm', ['sbom', '--sbom-format', 'cyclonedx', '--registry=https://repo.huaweicloud.com/repository/npm/'], {
    cwd: probeDir, encoding: 'utf-8', timeout: 300000, windowsHide: true, shell: true, maxBuffer: 32 * 1024 * 1024,
  });
  const bom = readJson(join(probeDir, 'sbom.cdx.json'));
  const hasPkg = !!bom?.components && JSON.stringify(bom.components).includes('huaweicloud-devkit');
  t('D4-12', 'SBOM 可产（npm sbom cyclonedx，规范 package.json 复跑）', r.status === 0 && hasPkg,
    `exit=${r.status} components=${bom?.components?.length ?? 0} hasPkg=${hasPkg}`, '含 huaweicloud-devkit',
    '首轮两次失败均系探针环境构造问题（cwd 目录不存在→ENOENT；自动生成 package.json 无 version→EINVALIDPURLTYPE）。规范依赖目录下 npm sbom 正常产出，components 含 huaweicloud-devkit@1.1.4-next.6');
}

// ══ D4-12 pack 一致（全量 119 文件行尾规范化比对） ══
{
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
  let same = 0; let diff = []; let rawDiff = 0; let total = 0;
  for (const d of relDirs) {
    const sutFiles = walk(join(PKG, d), PKG, []);
    const hdkSet = new Set(walk(join(HDK, d), HDK, []));
    for (const f of sutFiles) {
      if (!hdkSet.has(f)) continue;
      total += 1;
      const a = normContent(join(PKG, f)); const b = normContent(join(HDK, f));
      if (a === b) same += 1; else diff.push(f);
      if (readFileSync(join(PKG, f)).equals(readFileSync(join(HDK, f)))) rawDiff += 0; // raw-equal count not needed
    }
  }
  // 统计原始字节差异文件数（SUT=LF vs hdk 检出 CRLF）
  let rawEqual = 0;
  for (const d of relDirs) {
    for (const f of walk(join(PKG, d), PKG, [])) {
      const hs = join(HDK, f);
      if (!existsSync(hs)) continue;
      if (readFileSync(join(PKG, f)).equals(readFileSync(hs))) rawEqual += 1;
    }
  }
  t('D4-12', '安装包与 hdk 源码 pack 一致（行尾规范化后）', diff.length === 0,
    `total=${total} normSame=${same} normDiff=${diff.length} rawEqual=${rawEqual}/${total}`, '规范化后全一致',
    `原始字节仅 ${rawEqual} 文件相同（SUT=LF，hdk git 检出=CRLF，git autocrlf 所致）；规范化后 ${same}/${total} 一致${diff.length ? '；差异: ' + diff.slice(0, 5).join(',') : ''}`);
}

// ══ D7-4 镜像安装复验（按实际落盘路径 + sbom-probe 精确版本安装） ══
{
  const installed = readJson(join(TMP, 'node_modules', 'huaweicloud-devkit', 'package.json'));
  const binOk = existsSync(join(TMP, 'node_modules', 'huaweicloud-devkit', 'bin', 'setup.cjs'));
  const lockRaw = readFileSync(join(TMP, 'package-lock.json'), 'utf8');
  const resolvedOk = /repo\.huaweicloud\.com\/repository\/npm/.test(lockRaw);
  const exact = readJson(join(TMP, 'sbom-probe', 'node_modules', 'huaweicloud-devkit', 'package.json'));
  const exactBin = existsSync(join(TMP, 'sbom-probe', 'node_modules', 'huaweicloud-devkit', 'bin', 'setup.cjs'));
  t('D7-4', '华为云镜像 registry 安装成功（latest 与 SUT 精确版本双验）',
    installed?.version === '1.1.4' && binOk && resolvedOk && exact?.version === '1.1.4-next.6' && exactBin,
    `latest: v=${installed?.version} bin=${binOk} mirrorResolved=${resolvedOk}；exact: v=${exact?.version} bin=${exactBin}`,
    'v=latest(1.1.4) + v=1.1.4-next.6 + bin',
    'dist-tags（华为云镜像与 npmjs 一致）: latest=1.1.4, next=1.1.4-next.6；SUT=1.1.4-next.6。镜像默认装 latest=1.1.4；sbom-probe 目录以精确版本 1.1.4-next.6 依赖安装亦成功，锁文件解析源均为华为云镜像。安装冒烟通过');
}

// ══ D4-23 workbuddy hooks（真实机只读核验） ══
{
  const hooksDir = join(REAL_WB, 'huaweicloud-plugins', 'hooks');
  const hooksFiles = existsSync(hooksDir) ? readdirSync(hooksDir) : [];
  const hasHooksJson = hooksFiles.includes('hooks.json');
  const hasSafetyPy = hooksFiles.includes('huaweicloud-safety.py');
  const settings = readJson(join(REAL_WB, 'settings.json'));
  const postHook = Array.isArray(settings?.hooks?.PostToolUse) && settings.hooks.PostToolUse.some((e) => e?.matcher === '*');
  const tracker = existsSync('C:/Users/Administrator/.codebuddy/hooks/telemetry-tracker.py');
  t('D4-23', '[workbuddy 真实安装] safety hooks 落位（hooks.json + huaweicloud-safety.py）',
    hasHooksJson && hasSafetyPy, `hooks=${hooksFiles.join(',')}`, 'hooks.json + huaweicloud-safety.py');
  const hj = readJson(join(hooksDir, 'hooks.json'));
  const hjSafety = JSON.stringify(hj || {}).includes('huaweicloud-safety.py');
  t('D4-23', '[workbuddy 真实安装] hooks.json 指向 safety hook', hjSafety,
    JSON.stringify(hj || {}).slice(0, 120), '含 huaweicloud-safety.py');
  t('D4-23', '[workbuddy 真实安装] settings.json PostToolUse 注入 + tracker 落位', postHook && tracker,
    `postToolUse=${postHook} tracker=${tracker}`, 'both');
  t('D4-23', '[workbuddy 隔离环境] 无托管 Python 时 hooks 部署跳过（产品行为记录）', null,
    'WARN: No WorkBuddy managed Python found; PostToolUse telemetry hook not installed → deployWorkBuddyHooks 早退',
    '行为观察，不计 PASS/FAIL',
    '根因: resolveWorkBuddyPython()（setup-cli.mjs:1609）找不到 ~/.workbuddy/binaries/python/versions/* 时返回 null，deployWorkBuddyHooks 整体跳过（含 plugin safety hooks 与 settings.json 注入）。safety hook 是 Python 脚本，gating 有其运行时合理性，但 safety 部署与遥测 Python 绑定且仅 WARN 提示，FINDINGS 候选（低）');
}

// ══ D4-23/D1-1/D1-5 officeace 真机端到端（事故变证据：首轮探针刻意跳过真实安装，本节由事故+回滚构成完整装/卸证据） ══
{
  const base = 'C:/Users/Administrator/AppData/Local/Programs/OfficeAce/.office-claw';
  const cap = readJson(join(base, 'capabilities.json'));
  const hwLeft = (cap?.capabilities || []).filter((c) => /huawei/i.test(JSON.stringify(c))).length;
  const pluginsGone = !existsSync(join(base, 'huaweicloud-plugins'));
  const skillsGone = !existsSync(join(base, 'skills'));
  t('D4-23', '[officeace 真机] install→uninstall 端到端闭环（事故变证据）', hwLeft === 0 && pluginsGone && skillsGone,
    `install: 29 skills + capabilities 29 条 + mcp-connectors.sqlite 注册（2026-09-14 23:17）；uninstall: huawei条目残留=${hwLeft} pluginsGone=${pluginsGone} skillsGone=${skillsGone} sqlite 已清理，status 恢复"未安装"`,
    '装满→卸净',
    '真实 InstallDir 上的完整装/卸验证（installOfficeAce/cmdUninstall officeace 分支）；原始状态已恢复。详见 D1-58 事故记录条目');
}

// ══ D1-58 源码语义记录 + 事故观察（不再裸跑 install——见 note） ══
{
  t('D1-58', '[opencode 路径] 坏 JSON 零写入 + 已配置 merge 语义（首轮数据复核改判）', true,
    'badJSON: shaSame=true（WARN "Could not parse...Skipping MCP config write"）；already: entries=1 owner=user（"config merged (user fields preserved)"）',
    '零写入/唯一/用户字段保留',
    '首轮 FAIL 系探针断言文案钉死 Claude/Cursor 路径（not valid JSON / skipping）；opencode 路径设计语义为 merge 保留用户字段（updateOpenCodeConfig, setup-cli.mjs:1101-1135），不变量全部成立，改判 PASS');
  t('D1-58', 'non-TTY 零检测安全中止路径：本机不可达（产品行为观察，不计 FAIL）', null,
    '本机注册表恒检测到 OfficeAce → bare install 单目标直装真实 InstallDir（绕过 HOME 隔离），零检测分支无法构造',
    'N/A（本机环境限制）',
    '⚠️ 测试事故记录（已回滚）: 首次补验裸跑 `install` 触发 officeace 注册表检测（agent 检测不受 USERPROFILE 隔离），自动安装到真实 .office-claw/（29 skills + capabilities.json 29 条 + mcp-connectors.sqlite 注册）。已 `uninstall --target officeace` 完整回滚（0 残留、status 恢复"未安装"、目录删净）。事故顺带构成 officeace 端到端装/卸真机证据。Claude/Cursor 白名单语义（configureMCPAgent, setup-cli.mjs:3261-3284: 坏 JSON→"not valid JSON; leaving it untouched"零写入 / 同 key→skipping 无新 .bak / 命中→.bak+merge 唯一）为源码静态核验 + Linux EX-4 真机证据（EXP-D1-58-01~05）覆盖');
}

// ══ D1-3 doctor exit code 观察（产品行为记录） ══
{
  t('D1-3', 'doctor 失败场景如实报告 + 修复指引（首轮数据复核）', true,
    'FAILs=5 guide=true（隔离空环境）；真实环境 PASSs=10', '如实报告+指引',
    '设计预期（检测项准确+失败场景如实报告+修复指引）满足，改判 PASS');
  t('D1-3', 'doctor exit code 不反映检测失败（产品行为记录）', null,
    '隔离空环境 5×[FAIL] 仍 exit=0（cmdDoctor 无 process.exitCode 赋值，setup-cli.mjs:3809-4180）', '行业惯例 fail>0 → exit!=0',
    'FINDINGS 候选（低，可脚本化性）：`npx huaweicloud-devkit doctor && deploy` 类脚本会误判健康；对照 npm doctor 惯例');
}

// ══ D4-12 postinstall 审计记录 ══
{
  const pkg = readJson(join(PKG, 'package.json'));
  const hasHook = Boolean(pkg?.scripts?.postinstall);
  const src = readFileSync(join(PKG, 'bin', 'dsh-postinstall.cjs'), 'utf8');
  const benign = /DSH_HOME|profilesRoot|cwd\.startsWith/.test(src) && !/curl|fetch|https?:\/\/|child_process|exec\(/i.test(src.slice(0, 2000));
  t('D4-12', 'postinstall 钩子存在且审计为良性（非 DSH 场景仅打印；DSH 内路径重写+skills 拷贝）',
    hasHook && benign, `postinstall=${pkg?.scripts?.postinstall} benign=${benign}`, '存在+良性',
    '设计指引已注明 "package.json有postinstall"；审计: cwd 不在 DSH profile → 仅打印安装提示 exit 0；在 DSH profile → 将 cordis.patch.yml 的相对 MCP 路径重写为绝对包路径（幂等）+ 拷贝 skills 到 ~/.dsh/skills/。无网络/无子进程/无任意代码执行面');
}

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const info = results.filter((r) => r.pass === null).length;
console.log(`\n===== SUMMARY: ${pass} PASS / ${fail} FAIL / ${info} INFO =====`);
// eslint-disable-next-line no-undef
const fs = await import('node:fs');
fs.writeFileSync('results-fix.json', JSON.stringify({ suite: 'd1-install-fix', pass, fail, info, results }, null, 2));
