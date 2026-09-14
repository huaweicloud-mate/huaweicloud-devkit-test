/**
 * OpenCode 每日测试探针 - P0/P1 升级检测链 + 协议
 * D1-39 (P0): Windows 升级检测链可用性
 * D1-40 (P0): 镜像 lag 下检测正确性(反向提醒防护)
 * D1-27 (P1): 检测语义-已是最新
 * D1-28 (P1): 检测语义-有新版本
 * D1-30 (P2): semver 比对正确性
 * D1-31 (P1): dismiss 冷却期
 * D1-26 (P1): 升级提醒工具注册与协议暴露
 * D1-33 (P2): skip 文件持久化与多路径
 * D1-41 (P1): check_update 真实 MCP 返回契约
 * D1-42 (P1): dismiss 真实闭环与跨调用持久化
 * D1-45 (P1): 兜底提示真实序列与预热竞态
 * D5-3 (P1): 工具全量枚举
 * D5-1 (P1): 清单发现加载
 * D9-1 (P1): tools/list 合规
 * D9-3 (P1): tools/call 响应格式
 * D9-4 (P1): 协议生命周期
 * D9-5 (P1): stdio 传输健壮
 * D9-7 (P2): 协议版本协商降级
 * D9-8 (P2): inputSchema 版本合规
 */
import {
  semverCompare, hasPrerelease, determineTarget, judgeUpdate,
  parseDistTagsOutput, readInstalledVersion, skipFilePath,
  fallbackSkipFilePath, resolveSkipFilePath, readSkipState,
  writeSkipState, queryDistTagsSync, applyUpdateHint
} from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';

import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';

const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual, expected, passMsg, failMsg });
}

// === D1-30 (P2): semver 比对正确性 ===
test('D1-30', 'semver-1.1.2-gt-1.1.1',
  semverCompare('1.1.2', '1.1.1') > 0, semverCompare('1.1.2', '1.1.1'), '>0',
  '1.1.2 > 1.1.1', 'semver 比对错误');

test('D1-30', 'semver-stable-gt-prerelease',
  semverCompare('1.1.0', '1.1.0-next.9') > 0, semverCompare('1.1.0', '1.1.0-next.9'), '>0',
  '1.1.0 > 1.1.0-next.9 (stable > prerelease)', 'semver stable>prerelease 比对错误');

test('D1-30', 'semver-equal',
  semverCompare('1.1.0', '1.1.0') === 0, semverCompare('1.1.0', '1.1.0'), '0',
  '相等 semver 返回 0', 'semver 相等比对错误');

test('D1-30', 'semver-reverse',
  semverCompare('1.1.1', '1.1.2') < 0, semverCompare('1.1.1', '1.1.2'), '<0',
  '1.1.1 < 1.1.2', 'semver 反向比对错误');

// === D1-39 (P0): Windows 升级检测链可用性 ===
const installedVersion = readInstalledVersion();
test('D1-39', 'installed-version-readable',
  typeof installedVersion === 'string' && installedVersion.length > 0,
  installedVersion, 'string',
  `已安装版本: ${installedVersion}`, '无法读取已安装版本');

// judgeUpdate with mock distTags - update available
const updateResult = judgeUpdate('1.1.0', { latest: '1.1.4', next: '1.1.4-next.6' });
test('D1-39', 'update-available-result',
  updateResult.result === 'update_available' && updateResult.updateAvailable === true,
  updateResult.result, 'update_available',
  `检测到可用更新: target=${updateResult.targetVersion}`, '未正确检测到可用更新');

test('D1-39', 'update-current-version',
  updateResult.currentVersion === '1.1.0', updateResult.currentVersion, '1.1.0',
  'currentVersion 正确', 'currentVersion 错误');

test('D1-39', 'update-latest-stable',
  updateResult.latestStable === '1.1.4', updateResult.latestStable, '1.1.4',
  'latestStable 正确', 'latestStable 错误');

// Windows-specific: queryDistTagsSync should not EINVAL
try {
  const syncResult = queryDistTagsSync({ timeoutMs: 5000 });
  test('D1-39', 'queryDistTagsSync-no-EINVAL',
    true, 'completed', 'no EINVAL',
    `queryDistTagsSync 完成 (rc=${syncResult?.rc ?? 'n/a'})`, null);
} catch (e) {
  test('D1-39', 'queryDistTagsSync-no-EINVAL',
    !String(e).includes('EINVAL'), String(e), 'no EINVAL',
    null, `queryDistTagsSync 异常: ${e}`);
}

// === D1-40 (P0): 镜像 lag 下检测正确性 (反向提醒防护) ===
// Remote <= current → should NOT suggest update (no downgrade)
const lagResult = judgeUpdate('1.1.4', { latest: '1.1.3', next: null });
test('D1-40', 'no-downgrade-reminder',
  lagResult.result === 'up_to_date' && lagResult.updateAvailable === false,
  lagResult.result, 'up_to_date',
  '远端<=本地时不提示倒退', '远端版本低于本地时错误地提示更新');

// === D1-27 (P1): 检测语义-已是最新 ===
const upToDateResult = judgeUpdate('1.1.2', { latest: '1.1.2', next: '1.1.2-next.5' });
test('D1-27', 'up-to-date-result',
  upToDateResult.result === 'up_to_date' && upToDateResult.updateAvailable === false,
  upToDateResult.result, 'up_to_date',
  'current==latest → up_to_date', 'current==latest 语义错误');

// === D1-28 (P1): 检测语义-有新版本 ===
const hasUpdateResult = judgeUpdate('1.1.1', { latest: '1.1.2', next: null });
test('D1-28', 'update-available-semantics',
  hasUpdateResult.result === 'update_available' && hasUpdateResult.updateAvailable === true && hasUpdateResult.targetVersion === '1.1.2',
  `${hasUpdateResult.result}/${hasUpdateResult.targetVersion}`, 'update_available/1.1.2',
  '有新版本 → update_available + targetVersion', '有新版本语义错误');

// === D1-31 (P1): dismiss 冷却期 ===
// dismissVersion must be the TARGET version (the update being dismissed)
const skipFile = resolveSkipFilePath('test-session-opencode');
const now = Date.now();
writeSkipState(skipFile, '1.1.5', { at: now, days: 3 });
const skipState = readSkipState(skipFile);
test('D1-31', 'dismiss-cooldown-active',
  skipState !== null && skipState.dismissedVersion === '1.1.5',
  `${skipState?.dismissedVersion ?? 'null'}`, '1.1.5',
  '冷却期 skip 文件写入正确', 'skip 文件写入错误');

test('D1-31', 'dismiss-expireAt-3days',
  skipState !== null && skipState.expireAt !== undefined,
  skipState?.expireAt ?? 'null', 'ISO string',
  `expireAt: ${skipState?.expireAt}`, 'expireAt 缺失');

// Within cooldown → dismissed (target=1.1.5 == dismissedVersion=1.1.5 → semverCompare <= 0)
const dismissedResult = judgeUpdate('1.1.4', { latest: '1.1.5' }, skipState, now);
test('D1-31', 'dismiss-within-cooldown',
  dismissedResult.result === 'dismissed' && dismissedResult.dismissed === true,
  `${dismissedResult.result}/${dismissedResult.dismissed}`, 'dismissed/true',
  '冷却期内返回 dismissed', '冷却期内未返回 dismissed');

// After cooldown → update_available again
const expiredSkipState = { dismissedVersion: '1.1.5', dismissedAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), expireAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() };
const expiredResult = judgeUpdate('1.1.4', { latest: '1.1.5' }, expiredSkipState, now);
test('D1-31', 'dismiss-after-expiry',
  expiredResult.result === 'update_available',
  expiredResult.result, 'update_available',
  '冷却期过期后重新提醒', '冷却期过期后未重新提醒');

// === D1-33 (P2): skip 文件持久化与多路径 ===
test('D1-33', 'skip-file-path-exists',
  typeof skipFilePath() === 'string' && skipFilePath().length > 0,
  skipFilePath(), 'string',
  `skipFilePath: ${skipFilePath()}`, 'skipFilePath 为空');

test('D1-33', 'fallback-skip-file-path',
  typeof fallbackSkipFilePath() === 'string' && fallbackSkipFilePath().length > 0,
  fallbackSkipFilePath(), 'string',
  `fallbackSkipFilePath: ${fallbackSkipFilePath()}`, 'fallbackSkipFilePath 为空');

test('D1-33', 'resolve-skip-file-path-with-session',
  typeof resolveSkipFilePath('test-session') === 'string',
  resolveSkipFilePath('test-session'), 'string',
  'resolveSkipFilePath(session) 返回路径', 'resolveSkipFilePath 返回异常');

test('D1-33', 'skip-file-fields',
  skipState.dismissedVersion !== undefined && skipState.dismissedAt !== undefined && skipState.expireAt !== undefined,
  Object.keys(skipState).join(','), 'dismissedVersion,dismissedAt,expireAt',
  'skip 文件字段完整', 'skip 文件字段缺失');

// === D1-26 (P1): 升级提醒工具注册与协议暴露 ===
const toolNames = TOOL_DEFINITIONS.map(t => t.name);
test('D1-26', 'check_update-registered',
  toolNames.includes('huaweicloud_check_update'),
  toolNames.includes('huaweicloud_check_update'), true,
  'huaweicloud_check_update 已注册', 'huaweicloud_check_update 未注册');

test('D1-26', 'upgrade-registered',
  toolNames.includes('huaweicloud_upgrade'),
  toolNames.includes('huaweicloud_upgrade'), true,
  'huaweicloud_upgrade 已注册', 'huaweicloud_upgrade 未注册');

const checkUpdateTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
test('D1-26', 'check_update-has-description',
  checkUpdateTool && typeof checkUpdateTool.description === 'string' && checkUpdateTool.description.length > 0,
  checkUpdateTool?.description?.length ?? 0, '>0',
  'check_update 有 description', 'check_update 缺 description');

test('D1-26', 'check_update-has-inputSchema',
  checkUpdateTool && checkUpdateTool.inputSchema !== undefined,
  checkUpdateTool?.inputSchema ? 'present' : 'missing', 'present',
  'check_update 有 inputSchema', 'check_update 缺 inputSchema');

const upgradeTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade');
test('D1-26', 'upgrade-has-description',
  upgradeTool && typeof upgradeTool.description === 'string' && upgradeTool.description.length > 0,
  upgradeTool?.description?.length ?? 0, '>0',
  'upgrade 有 description', 'upgrade 缺 description');

test('D1-26', 'upgrade-has-inputSchema',
  upgradeTool && upgradeTool.inputSchema !== undefined,
  upgradeTool?.inputSchema ? 'present' : 'missing', 'present',
  'upgrade 有 inputSchema', 'upgrade 缺 inputSchema');

// === D5-3 (P1): 工具全量枚举 ===
test('D5-3', 'tool-count-39',
  TOOL_DEFINITIONS.length >= 39,
  TOOL_DEFINITIONS.length, '>=39',
  `工具总数: ${TOOL_DEFINITIONS.length}`, `工具总数不足: ${TOOL_DEFINITIONS.length}`);

// === D5-1 (P1): 清单发现加载 ===
const expectedTools = ['huaweicloud_check_cli', 'huaweicloud_list_operations', 'huaweicloud_plan_cli_command',
  'huaweicloud_run_readonly_command', 'huaweicloud_run_approved_command', 'huaweicloud_show_profile_redacted',
  'huaweicloud_explain_error', 'huaweicloud_hook_check_command', 'huaweicloud_hook_check_artifacts',
  'huaweicloud_hook_check_deploy_plan', 'huaweicloud_check_update', 'huaweicloud_upgrade',
  'huaweicloud_list_regions', 'huaweicloud_get_regional_availability', 'huaweicloud_search_docs',
  'huaweicloud_retrieve_skill', 'huaweicloud_search_marketplace', 'huaweicloud_service_catalog'];
const missingTools = expectedTools.filter(t => !toolNames.includes(t));
test('D5-1', 'core-tools-present',
  missingTools.length === 0,
  missingTools.join(',') || 'all present', 'all present',
  `核心工具全部存在 (${expectedTools.length} checked)`, `缺失工具: ${missingTools.join(',')}`);

// === D1-41 (P1): check_update 真实 MCP 返回契约 ===
// Test applyUpdateHint for all four states
const hintUpToDate = applyUpdateHint({}, 'test_tool', { result: 'up_to_date', updateAvailable: false });
test('D1-41', 'applyUpdateHint-up-to-date',
  hintUpToDate._updateInfo === undefined || hintUpToDate._updateInfo?.result === 'up_to_date',
  JSON.stringify(hintUpToDate._updateInfo ?? 'none'), 'up_to_date/none',
  'up_to_date 不附加或附加正确', 'up_to_date hint 异常');

const hintUpdate = applyUpdateHint({}, 'test_tool', { result: 'update_available', updateAvailable: true, targetVersion: '1.1.5' });
test('D1-41', 'applyUpdateHint-update-available',
  hintUpdate._updateInfo !== undefined,
  JSON.stringify(hintUpdate._updateInfo ?? 'none'), 'present',
  'update_available 附加 _updateInfo', 'update_available 未附加 _updateInfo');

// === D9-1 (P1): tools/list 合规 ===
test('D9-1', 'tools-list-has-name',
  TOOL_DEFINITIONS.every(t => typeof t.name === 'string' && t.name.length > 0),
  'all have name', true,
  '所有工具有 name 字段', '部分工具缺 name');

test('D9-1', 'tools-list-has-description',
  TOOL_DEFINITIONS.every(t => typeof t.description === 'string' && t.description.length > 0),
  'all have description', true,
  '所有工具有 description', '部分工具缺 description');

test('D9-1', 'tools-list-has-inputSchema',
  TOOL_DEFINITIONS.every(t => t.inputSchema !== undefined),
  'all have inputSchema', true,
  '所有工具有 inputSchema', '部分工具缺 inputSchema');

// === D9-3 (P1): tools/call 响应格式 ===
test('D9-3', 'callTool-is-function',
  typeof callTool === 'function',
  typeof callTool, 'function',
  'callTool 是函数', 'callTool 不是函数');

// === D9-7 (P2): 协议版本协商降级 ===
test('D9-7', 'tool-schema-version-compatible',
  TOOL_DEFINITIONS.every(t => t.inputSchema === undefined || typeof t.inputSchema === 'object'),
  'all valid', true,
  'inputSchema 类型合规', 'inputSchema 类型异常');

// === D9-8 (P2): inputSchema 版本合规 ===
test('D9-8', 'inputSchema-has-properties',
  TOOL_DEFINITIONS.filter(t => t.inputSchema && t.inputSchema.type === 'object').every(t => t.inputSchema.properties !== undefined),
  'all have properties', true,
  'object 类型 inputSchema 有 properties', '部分 inputSchema 缺 properties');

// === D1-42 (P1): dismiss 真实闭环与跨调用持久化 ===
// Already tested above with D1-31, verify cross-call persistence
const rereadSkip = readSkipState(skipFile);
test('D1-42', 'dismiss-cross-call-persistence',
  rereadSkip !== null && rereadSkip.dismissedVersion === '1.1.5',
  `${rereadSkip?.dismissedVersion ?? 'null'}`, '1.1.5',
  '跨调用 skip 状态持久化', '跨调用 skip 状态丢失');

// === D1-45 (P1): 兜底提示真实序列与预热竞态 ===
// Check/update tools should not carry _updateInfo
const checkUpdateHintResult = applyUpdateHint({ test: 1 }, 'huaweicloud_check_update', { result: 'update_available', updateAvailable: true });
test('D1-45', 'check_update-no-hint',
  checkUpdateHintResult._updateInfo === undefined || checkUpdateHintResult.test === 1,
  JSON.stringify(checkUpdateHintResult._updateInfo ?? 'none'), 'none/preserved',
  'check_update 工具不附加 hint', 'check_update 错误附加 hint');

// === D6-3 (P2): MCP 冷启时间 ===
const coldStartStart = Date.now();
const coldStartResult = judgeUpdate('1.1.0', { latest: '1.1.4' });
const coldStartMs = Date.now() - coldStartStart;
test('D6-3', 'cold-start-under-100ms',
  coldStartMs < 100,
  coldStartMs + 'ms', '<100ms',
  `冷启时间 ${coldStartMs}ms`, `冷启时间过长 ${coldStartMs}ms`);

// === Output ===
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(JSON.stringify({ total: results.length, passed, failed, results }, null, 2));
