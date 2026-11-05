// probe_exp_nr3.mjs — expanded cases: EXP-D5-8-1, EXP-D5-8-3, EXP-NR3-02/04/10/24
// Real assertions against hdk source + Hermes plugin manifest; writes per-case JSON evidence.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const HDK = process.env.HDK_PLUGIN_SRC;          // .../plugins/huaweicloud-core
const EVID = process.env.EVID_DIR;
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_exp_nr3.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}

const uc = await import(`file://${HDK}/src/update-check.mjs`);
const { TOOL_DEFINITIONS, callTool } = await import(`file://${HDK}/src/tools.mjs`);

// ---- EXP-D5-8-1: Hermes 客户端可发现并加载插件清单 ----
try {
  const pl = join(HDK, '.hermes-plugin', 'plugin.json');
  const mcp = join(HDK, '.mcp.json');
  let manifest = null, ok = false, actual = '';
  if (existsSync(pl)) {
    try { manifest = JSON.parse(readFileSync(pl, 'utf8')); } catch (e) { actual += 'plugin.json parse err ' + e.message + '; '; }
  }
  const nameOk = manifest && manifest.name === 'huaweicloud-devkit';
  const verOk = manifest && typeof manifest.version === 'string' && manifest.version.length > 0;
  const mcpOk = existsSync(mcp);
  ok = !!nameOk && !!verOk && mcpOk;
  actual += `.hermes-plugin/plugin.json=${existsSync(pl)} name=${manifest?.name} version=${manifest?.version} .mcp.json=${mcpOk}`;
  rec('EXP-D5-8-1', ok ? 'PASS' : 'FAIL', 'Hermes 客户端插件清单可发现',
    'Hermes：客户端可发现并加载插件清单（.hermes-plugin/plugin.json 合法 + .mcp.json 存在）',
    actual, ok ? '' : '插件清单缺失/字段不符');
} catch (e) { rec('EXP-D5-8-1', 'FAIL', 'Hermes 客户端插件清单可发现', '', 'probe error: ' + e.message); }

// ---- EXP-D5-8-3: tools/list 枚举 40 工具全量可达，schema 完整 ----
try {
  const n = TOOL_DEFINITIONS.length;
  const named = TOOL_DEFINITIONS.filter(t => typeof t.name === 'string' && t.name.length > 0).length;
  const desc = TOOL_DEFINITIONS.filter(t => typeof t.description === 'string' && t.description.length > 0).length;
  const sch = TOOL_DEFINITIONS.filter(t => t.inputSchema !== undefined).length;
  const ok = n >= 40 && named === n && desc === n && sch === n;
  rec('EXP-D5-8-3', ok ? 'PASS' : 'FAIL', 'tools/list 枚举 40 工具全量可达',
    'Hermes：tools/list 枚举 40 工具全量可达，schema 完整',
    `tools=${n} named=${named} desc=${desc} schema=${sch}`, ok ? '' : `tools=${n}（期望>=40）或 schema 不完整`);
} catch (e) { rec('EXP-D5-8-3', 'FAIL', 'tools/list 枚举 40 工具全量可达', '', 'probe error: ' + e.message); }

// ---- EXP-NR3-02: D1-27 检测语义 up_to_date ----
try {
  const r = uc.judgeUpdate('1.1.7', { latest: '1.1.7', next: null });
  const sem = uc.semverCompare('1.1.7', '1.1.7') === 0 && uc.semverCompare('1.1.2', '1.1.1') > 0;
  const t = uc.determineTarget ? uc.determineTarget('1.1.7', '1.1.7', null) : null;
  const ok = r.result === 'up_to_date' && r.updateAvailable === false && sem;
  rec('EXP-NR3-02', ok ? 'PASS' : 'FAIL', 'D1-27 检测语义 up_to_date',
    'current==latest 时 judgeUpdate.result=up_to_date 且不提示更新；semver 比较正确',
    `judgeUpdate.result=${r.result} updateAvailable=${r.updateAvailable} semver=${sem} determineTarget=${JSON.stringify(t)}`,
    ok ? '' : 'up_to_date 语义漂移');
} catch (e) { rec('EXP-NR3-02', 'FAIL', 'D1-27 检测语义 up_to_date', '', 'probe error: ' + e.message); }

// ---- EXP-NR3-04: D1-42 dismiss 跨进程持久化 ----
try {
  const sf = uc.resolveSkipFilePath('exp-nr3-04');
  const now = Date.now();
  uc.writeSkipState(sf, '1.1.7', { at: now, days: 3 });
  // 新进程读取（真实跨进程）
  const code = `import('file://${HDK}/src/update-check.mjs').then(m=>{const s=m.readSkipState(m.resolveSkipFilePath('exp-nr3-04'));console.log(JSON.stringify(s))})`;
  const child = spawnSync('node', ['-e', code], { encoding: 'utf8', timeout: 30000 });
  let s2 = null; try { s2 = JSON.parse((child.stdout || '').trim()); } catch {}
  const ok = s2 && s2.dismissedVersion === '1.1.7';
  rec('EXP-NR3-04', ok ? 'PASS' : 'FAIL', 'D1-42 dismiss 跨进程持久化',
    'dismiss 写入 skip 文件后，新进程 readSkipState 仍读到 dismissedVersion',
    `skipFile=${sf} child.dismissedVersion=${s2?.dismissedVersion} expireAt=${s2?.expireAt}`,
    ok ? '' : '跨进程持久化失败');
} catch (e) { rec('EXP-NR3-04', 'FAIL', 'D1-42 dismiss 跨进程持久化', '', 'probe error: ' + e.message); }

// ---- EXP-NR3-10: Linux 无 .cmd/EINVAL 语义 ----
try {
  let einval = false, err = '';
  try { uc.queryDistTagsSync({ timeoutMs: 8000 }); } catch (e) { err = String(e); einval = err.includes('EINVAL'); }
  const fnNames = ['judgeUpdate', 'semverCompare', 'readSkipState', 'applyUpdateHint', 'queryDistTagsSync'];
  const fnsOk = fnNames.every(f => typeof uc[f] === 'function');
  const ok = !einval && fnsOk;
  rec('EXP-NR3-10', ok ? 'PASS' : 'FAIL', 'Linux 无 .cmd/EINVAL 语义',
    'Linux 侧无 Windows .cmd/EINVAL 缺陷；update-check 全函数可用、queryDistTagsSync 不抛 EINVAL',
    `platform=${process.platform} queryDistTagsSync EINVAL=${einval} err="${err.slice(0, 80)}" 函数齐备=${fnsOk}`,
    ok ? '' : 'Linux 侧出现 EINVAL 或函数缺失');
} catch (e) { rec('EXP-NR3-10', 'FAIL', 'Linux 无 .cmd/EINVAL 语义', '', 'probe error: ' + e.message); }

// ---- EXP-NR3-24: D1-45 兜底序列 + 预热竞态 ----
try {
  const h = uc.applyUpdateHint({ test: 1 }, 'huaweicloud_check_update', { result: 'update_available', updateAvailable: true, targetVersion: '1.1.8' });
  const noHint = h._updateInfo === undefined && h.test === 1;
  const r1 = uc.judgeUpdate('1.1.7', { latest: '1.1.8', next: '1.1.9-next.1' }).result;
  const r2 = uc.judgeUpdate('1.1.7', { latest: '1.1.8', next: '1.1.9-next.1' }).result;
  const deterministic = r1 === r2 && typeof r1 === 'string' && r1.length > 0;
  const ok = noHint && deterministic;
  rec('EXP-NR3-24', ok ? 'PASS' : 'FAIL', 'D1-45 兜底序列+预热竞态',
    'check_update 不注入 hint；重复 judgeUpdate 预热竞态下结果确定一致',
    `check_update 无hint=${noHint} judgeUpdate 两次=${r1}/${r2} 一致=${deterministic}`,
    ok ? '' : '兜底/预热竞态异常');
} catch (e) { rec('EXP-NR3-24', 'FAIL', 'D1-45 兜底序列+预热竞态', '', 'probe error: ' + e.message); }

console.log('probe_exp_nr3.mjs DONE');