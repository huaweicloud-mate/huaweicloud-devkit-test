// AI生成
// D1-40 Probe: 镜像 lag 下检测正确性 (反向提醒防护)
// 测试: 当 registry=镜像且滞后时，queryDistTags/judgeUpdate 不得提示版本倒退
// 关联: #518/#566

import { spawnSync } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';

const EVIDENCE_DIR = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-09-20-188.239.14.150\\Windows\\evidence\\D1-40';
const LOG_PATH = `${EVIDENCE_DIR}\\stdout.log`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

writeFileSync(LOG_PATH, `D1-40 Probe Log - 镜像 lag 下检测正确性\nOS: ${process.platform} / Node: ${process.version}\n${'='.repeat(70)}\n`, 'utf8');

const RESULTS = {};

// 动态 import 被测模块
const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');
const { judgeUpdate, semverCompare, determineTarget, parseDistTagsOutput } = mod;

const CURRENT_VERSION = '1.1.5'; // 被测包本地版本

// ─── 1. 官方源 queryDistTagsFetch (基线) ───
log('--- Test 1: 官方源 queryDistTagsFetch (基线) ---');
try {
  const officialResult = await mod.queryDistTagsFetch({ timeoutMs: 20000 });
  log(`  官方源 dist-tags: ${JSON.stringify(officialResult)}`);
  RESULTS.officialFetch = officialResult;

  const officialJudge = judgeUpdate(CURRENT_VERSION, officialResult, null);
  log(`  judgeUpdate(官方源): ${JSON.stringify(officialJudge)}`);
  RESULTS.officialJudge = officialJudge;
} catch (e) {
  log(`  THROWN: ${e.message}`);
  RESULTS.officialFetch = { error: e.message };
}

// ─── 2. 镜像源 queryDistTagsFetch (npmmirror.com - 可能有 lag) ───
log('\n--- Test 2: 镜像源 queryDistTagsFetch (registry.npmmirror.com) ---');
try {
  // 临时设置镜像 registry
  const originalRegistry = process.env.HUAWEICLOUD_NPM_REGISTRY;
  process.env.HUAWEICLOUD_NPM_REGISTRY = 'https://registry.npmmirror.com';
  
  const mirrorResult = await mod.queryDistTagsFetch({ timeoutMs: 20000 });
  log(`  镜像源 dist-tags: ${JSON.stringify(mirrorResult)}`);
  RESULTS.mirrorFetch = mirrorResult;

  const mirrorJudge = judgeUpdate(CURRENT_VERSION, mirrorResult, null);
  log(`  judgeUpdate(镜像源): ${JSON.stringify(mirrorJudge)}`);
  RESULTS.mirrorJudge = mirrorJudge;

  // 恢复
  if (originalRegistry) process.env.HUAWEICLOUD_NPM_REGISTRY = originalRegistry;
  else delete process.env.HUAWEICLOUD_NPM_REGISTRY;
} catch (e) {
  log(`  THROWN: ${e.message}`);
  RESULTS.mirrorFetch = { error: e.message };
}

// ─── 3. 模拟镜像 lag 场景: 镜像返回旧版本 ───
log('\n--- Test 3: 模拟镜像 lag (镜像 latest=1.1.4 < 本地 1.1.5) ---');
const lagDistTags = { latest: '1.1.4', next: null };
const lagJudge = judgeUpdate(CURRENT_VERSION, lagDistTags, null);
log(`  模拟 lag dist-tags: ${JSON.stringify(lagDistTags)}`);
log(`  judgeUpdate(lag): ${JSON.stringify(lagJudge)}`);
log(`  result: ${lagJudge.result} (预期: up_to_date, 不得提示倒退)`);
log(`  updateAvailable: ${lagJudge.updateAvailable} (预期: false)`);
RESULTS.simulatedLag = { distTags: lagDistTags, judge: lagJudge };

// ─── 4. 模拟镜像 lag + 本地是 next 版本 ───
log('\n--- Test 4: 模拟镜像 lag + 本地 next 版本 (本地=1.1.6-next.0, 镜像 latest=1.1.5) ---');
const lagNextDistTags = { latest: '1.1.5', next: null }; // 镜像没有 next tag
const lagNextJudge = judgeUpdate('1.1.6-next.0', lagNextDistTags, null);
log(`  judgeUpdate(lag+next): ${JSON.stringify(lagNextJudge)}`);
log(`  result: ${lagNextJudge.result} (预期: up_to_date, 远端<=本地不提示)`);
RESULTS.simulatedLagNext = { distTags: lagNextDistTags, judge: lagNextJudge };

// ─── 5. 模拟镜像完全滞后: 镜像返回更旧的版本 ───
log('\n--- Test 5: 模拟镜像严重 lag (镜像 latest=1.1.2 < 本地 1.1.5) ---');
const severeLagDistTags = { latest: '1.1.2', next: null };
const severeLagJudge = judgeUpdate(CURRENT_VERSION, severeLagDistTags, null);
log(`  judgeUpdate(severeLag): ${JSON.stringify(severeLagJudge)}`);
log(`  result: ${severeLagJudge.result} (预期: up_to_date)`);
log(`  updateAvailable: ${severeLagJudge.updateAvailable} (预期: false)`);
RESULTS.simulatedSevereLag = { distTags: severeLagDistTags, judge: severeLagJudge };

// ─── 6. 对照: 官方源有新版本 (latest=1.1.6 > 本地 1.1.5) ───
log('\n--- Test 6: 对照 官方源新版本 (latest=1.1.6 > 本地 1.1.5) ---');
const newVersionDistTags = { latest: '1.1.6', next: null };
const newVersionJudge = judgeUpdate(CURRENT_VERSION, newVersionDistTags, null);
log(`  judgeUpdate(newVersion): ${JSON.stringify(newVersionJudge)}`);
log(`  result: ${newVersionJudge.result} (预期: update_available)`);
log(`  updateAvailable: ${newVersionJudge.updateAvailable} (预期: true)`);
RESULTS.simulatedNewVersion = { distTags: newVersionDistTags, judge: newVersionJudge };

// ─── 7. npm_config_registry 影响 queryDistTagsSync (shell:true 绕过 EINVAL) ───
log('\n--- Test 7: npm_config_registry=镜像 → npm view (shell:true 绕过 EINVAL) ---');
try {
  const result = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true,
    shell: true,
    env: { ...process.env, npm_config_registry: 'https://registry.npmmirror.com' },
  });
  log(`  status: ${result.status}`);
  log(`  stdout: ${String(result.stdout || '').slice(0, 300)}`);
  const parsed = parseDistTagsOutput(result.stdout);
  log(`  parsed: ${JSON.stringify(parsed)}`);
  
  if (parsed) {
    const mirrorNpmJudge = judgeUpdate(CURRENT_VERSION, parsed, null);
    log(`  judgeUpdate(镜像 npm): ${JSON.stringify(mirrorNpmJudge)}`);
    RESULTS.mirrorNpm = { distTags: parsed, judge: mirrorNpmJudge };
  } else {
    RESULTS.mirrorNpm = { distTags: null, parseFailed: true };
  }
} catch (e) {
  log(`  THROWN: ${e.message}`);
  RESULTS.mirrorNpm = { error: e.message };
}

// ─── 8. 官方源 npm view (shell:true) 对照 ───
log('\n--- Test 8: 官方源 npm view (shell:true) 对照 ---');
try {
  const result = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true,
    shell: true,
    env: { ...process.env, npm_config_registry: 'https://registry.npmjs.org' },
  });
  log(`  status: ${result.status}`);
  log(`  stdout: ${String(result.stdout || '').slice(0, 300)}`);
  const parsed = parseDistTagsOutput(result.stdout);
  log(`  parsed: ${JSON.stringify(parsed)}`);
  
  if (parsed) {
    const officialNpmJudge = judgeUpdate(CURRENT_VERSION, parsed, null);
    log(`  judgeUpdate(官方 npm): ${JSON.stringify(officialNpmJudge)}`);
    RESULTS.officialNpm = { distTags: parsed, judge: officialNpmJudge };
  } else {
    RESULTS.officialNpm = { distTags: null, parseFailed: true };
  }
} catch (e) {
  log(`  THROWN: ${e.message}`);
  RESULTS.officialNpm = { error: e.message };
}

// ─── 9. queryDistTagsFetch 默认 registry 分析 ───
log('\n--- Test 9: queryDistTagsFetch 默认 registry 分析 ---');
log(`  HUAWEICLOUD_NPM_REGISTRY env: ${process.env.HUAWEICLOUD_NPM_REGISTRY || '(未设置, 默认 https://registry.npmjs.org)'}`);
log(`  npm_config_registry env: ${process.env.npm_config_registry || '(未设置)'}`);
log(`  → queryDistTagsFetch 使用 HUAWEICLOUD_NPM_REGISTRY 或默认官方源, 不受 npm_config_registry 影响`);
log(`  → queryDistTagsSync/queryDistTags 使用 npm view, 受 npm_config_registry 影响`);
RESULTS.registryAnalysis = {
  huaweiRegistry: process.env.HUAWEICLOUD_NPM_REGISTRY || null,
  npmRegistry: process.env.npm_config_registry || null,
  fetchUsesOfficial: !process.env.HUAWEICLOUD_NPM_REGISTRY,
};

// ─── 判定 ───
log('\n' + '='.repeat(70));
log('--- D1-40 判定 ---');

// 核心判定: 镜像 lag 时不得提示版本倒退
const lagNoFalsePrompt = RESULTS.simulatedLag?.judge?.result === 'up_to_date' &&
                         RESULTS.simulatedLag?.judge?.updateAvailable === false;
const severeLagNoFalsePrompt = RESULTS.simulatedSevereLag?.judge?.result === 'up_to_date' &&
                               RESULTS.simulatedSevereLag?.judge?.updateAvailable === false;
const lagNextNoFalsePrompt = RESULTS.simulatedLagNext?.judge?.result === 'up_to_date';

// 对照: 官方源有新版本时应正确提示
const newVersionCorrectPrompt = RESULTS.simulatedNewVersion?.judge?.result === 'update_available' &&
                                RESULTS.simulatedNewVersion?.judge?.updateAvailable === true;

// 实际镜像源测试
let mirrorNoFalsePrompt = true;
if (RESULTS.mirrorFetch && RESULTS.mirrorJudge) {
  const mirrorLatest = RESULTS.mirrorFetch?.latest;
  const cmp = semverCompare(mirrorLatest, CURRENT_VERSION);
  log(`  镜像 latest=${mirrorLatest} vs 本地=${CURRENT_VERSION}, compare=${cmp}`);
  if (cmp <= 0) {
    // 镜像滞后或相等，不应提示更新
    mirrorNoFalsePrompt = RESULTS.mirrorJudge?.updateAvailable === false;
    log(`  镜像滞后, updateAvailable=${RESULTS.mirrorJudge?.updateAvailable} (预期 false)`);
  } else {
    // 镜像有新版本，应提示更新
    mirrorNoFalsePrompt = RESULTS.mirrorJudge?.updateAvailable === true;
    log(`  镜像有新版本, updateAvailable=${RESULTS.mirrorJudge?.updateAvailable} (预期 true)`);
  }
}

log(`模拟 lag 不误报: ${lagNoFalsePrompt}`);
log(`模拟严重 lag 不误报: ${severeLagNoFalsePrompt}`);
log(`模拟 lag+next 不误报: ${lagNextNoFalsePrompt}`);
log(`对照 新版本正确提示: ${newVersionCorrectPrompt}`);
log(`实际镜像源不误报: ${mirrorNoFalsePrompt}`);

let verdict;
const allPass = lagNoFalsePrompt && severeLagNoFalsePrompt && lagNextNoFalsePrompt &&
                newVersionCorrectPrompt && mirrorNoFalsePrompt;

if (allPass) {
  verdict = 'PASS';
  log(`判定: PASS - 镜像 lag 下检测正确，不提示版本倒退`);
} else {
  verdict = 'FAIL';
  log(`判定: FAIL - 存在误报或漏报`);
  if (!lagNoFalsePrompt) log(`  ✗ 模拟 lag 误报更新`);
  if (!severeLagNoFalsePrompt) log(`  ✗ 模拟严重 lag 误报更新`);
  if (!lagNextNoFalsePrompt) log(`  ✗ 模拟 lag+next 误报更新`);
  if (!newVersionCorrectPrompt) log(`  ✗ 对照: 新版本未正确提示`);
  if (!mirrorNoFalsePrompt) log(`  ✗ 实际镜像源误报`);
}

// 保存结果 JSON
writeFileSync(`${EVIDENCE_DIR}\\result.json`, JSON.stringify({
  testCase: 'D1-40',
  title: '镜像 lag 下检测正确性 (反向提醒防护)',
  verdict,
  currentVersion: CURRENT_VERSION,
  results: RESULTS,
  checks: {
    lagNoFalsePrompt,
    severeLagNoFalsePrompt,
    lagNextNoFalsePrompt,
    newVersionCorrectPrompt,
    mirrorNoFalsePrompt,
  },
  issue: '#518/#566',
  timestamp: new Date().toISOString(),
}, null, 2), 'utf8');

log(`\n最终判定: ${verdict}`);
log(`证据已保存到 ${EVIDENCE_DIR}`);
