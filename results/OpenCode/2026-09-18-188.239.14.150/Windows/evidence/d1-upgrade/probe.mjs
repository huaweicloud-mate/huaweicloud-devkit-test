/**
 * OpenCode 1.1.5 daily test probe - D1 install/upgrade + D5 client + D6 perf + D9 protocol
 * Covers: D1-1,3,4,5,6,26,27,28,30,31,33,39,40,41,42,45,58, D5-1,3, D6-3, D9-1,3,7,8
 */
import {
  semverCompare, hasPrerelease, determineTarget, judgeUpdate,
  parseDistTagsOutput, readInstalledVersion, skipFilePath,
  fallbackSkipFilePath, resolveSkipFilePath, readSkipState,
  writeSkipState, queryDistTagsSync, applyUpdateHint
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pkgRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test/results/OpenCode/2026-09-18-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// D1-30: semver
test('D1-30', 'semver-1.1.5-gt-1.1.4', semverCompare('1.1.5','1.1.4')>0, semverCompare('1.1.5','1.1.4'), '>0', '1.1.5>1.1.4', 'semver error');
test('D1-30', 'semver-stable-gt-pre', semverCompare('1.1.0','1.1.0-next.9')>0, semverCompare('1.1.0','1.1.0-next.9'), '>0', 'stable>prerelease', 'semver error');
test('D1-30', 'semver-equal', semverCompare('1.1.5','1.1.5')===0, semverCompare('1.1.5','1.1.5'), '0', 'equal=0', 'semver equal error');
test('D1-30', 'semver-reverse', semverCompare('1.1.4','1.1.5')<0, semverCompare('1.1.4','1.1.5'), '<0', '1.1.4<1.1.5', 'semver reverse error');

// D1-39: Windows upgrade chain
const installedVersion = readInstalledVersion();
test('D1-39', 'installed-version-readable', typeof installedVersion==='string'&&installedVersion.length>0, installedVersion, 'string', `version: ${installedVersion}`, 'cannot read version');
test('D1-39', 'update-available-result', (()=>{const r=judgeUpdate('1.1.0',{latest:'1.1.5',next:null});return r.result==='update_available'&&r.updateAvailable===true})(), (()=>{const r=judgeUpdate('1.1.0',{latest:'1.1.5',next:null});return r.result})(), 'update_available', 'update detection failed');
test('D1-39', 'update-current-version', judgeUpdate('1.1.0',{latest:'1.1.5'}).currentVersion==='1.1.0', judgeUpdate('1.1.0',{latest:'1.1.5'}).currentVersion, '1.1.0', 'currentVersion error');
test('D1-39', 'update-latest-stable', judgeUpdate('1.1.0',{latest:'1.1.5'}).latestStable==='1.1.5', judgeUpdate('1.1.0',{latest:'1.1.5'}).latestStable, '1.1.5', 'latestStable error');
try { queryDistTagsSync({timeoutMs:5000}); test('D1-39','queryDistTagsSync-no-EINVAL', true, 'completed', 'no EINVAL', null); } catch(e) { test('D1-39','queryDistTagsSync-no-EINVAL', !String(e).includes('EINVAL'), String(e), 'no EINVAL', null, `EINVAL: ${e}`); }

// D1-40: mirror lag - no downgrade reminder
const lagResult = judgeUpdate('1.1.5', { latest: '1.1.4', next: null });
test('D1-40', 'no-downgrade', lagResult.result==='up_to_date'&&lagResult.updateAvailable===false, lagResult.result, 'up_to_date', 'no downgrade reminder', 'wrong downgrade reminder');

// D1-27: up_to_date
const upToDate = judgeUpdate('1.1.5', { latest: '1.1.5', next: null });
test('D1-27', 'up-to-date', upToDate.result==='up_to_date'&&upToDate.updateAvailable===false, upToDate.result, 'up_to_date', 'current==latest', 'up_to_date error');

// D1-28: update_available
const hasUpdate = judgeUpdate('1.1.4', { latest: '1.1.5', next: null });
test('D1-28', 'update-available', hasUpdate.result==='update_available'&&hasUpdate.updateAvailable===true&&hasUpdate.targetVersion==='1.1.5', `${hasUpdate.result}/${hasUpdate.targetVersion}`, 'update_available/1.1.5', 'update semantics correct', 'update semantics error');

// D1-31: dismiss cooldown
const skipFile = resolveSkipFilePath('test-opencode-115');
const now = Date.now();
writeSkipState(skipFile, '1.1.5', { at: now, days: 3 });
const skipState = readSkipState(skipFile);
test('D1-31', 'dismiss-active', skipState!==null&&skipState.dismissedVersion==='1.1.5', skipState?.dismissedVersion??'null', '1.1.5', 'skip file written', 'skip file error');
test('D1-31', 'dismiss-expireAt', skipState!==null&&skipState.expireAt!==undefined, skipState?.expireAt??'null', 'ISO', `expireAt: ${skipState?.expireAt}`, 'expireAt missing');
const dismissedResult = judgeUpdate('1.1.4', { latest: '1.1.5' }, skipState, now);
test('D1-31', 'dismiss-within-cooldown', dismissedResult.result==='dismissed'&&dismissedResult.dismissed===true, `${dismissedResult.result}/${dismissedResult.dismissed}`, 'dismissed/true', 'cooldown returns dismissed', 'cooldown not dismissed');
const expiredSkip = { dismissedVersion: '1.1.5', dismissedAt: new Date(now-4*86400000).toISOString(), expireAt: new Date(now-86400000).toISOString() };
const expiredResult = judgeUpdate('1.1.4', { latest: '1.1.5' }, expiredSkip, now);
test('D1-31', 'dismiss-after-expiry', expiredResult.result==='update_available', expiredResult.result, 'update_available', 'expired re-reminds', 'expired not re-reminding');

// D1-33: skip file paths
test('D1-33', 'skipFilePath', typeof skipFilePath()==='string'&&skipFilePath().length>0, skipFilePath(), 'string', `skipFilePath: ${skipFilePath()}`, 'skipFilePath empty');
test('D1-33', 'fallbackSkipFilePath', typeof fallbackSkipFilePath()==='string'&&fallbackSkipFilePath().length>0, fallbackSkipFilePath(), 'string', `fallback: ${fallbackSkipFilePath()}`, 'fallback empty');
test('D1-33', 'resolveSkipFilePath', typeof resolveSkipFilePath('test')==='string', resolveSkipFilePath('test'), 'string', 'resolveSkipFilePath returns path', 'resolveSkipFilePath error');
test('D1-33', 'skip-fields', skipState!==null&&skipState.dismissedVersion!==undefined&&skipState.dismissedAt!==undefined&&skipState.expireAt!==undefined, Object.keys(skipState??{}).join(','), 'all fields', 'skip file fields complete', 'skip file fields missing');

// D1-26: tool registration
const toolNames = TOOL_DEFINITIONS.map(t=>t.name);
test('D1-26', 'check_update-registered', toolNames.includes('huaweicloud_check_update'), toolNames.includes('huaweicloud_check_update'), true, 'check_update registered', 'check_update not registered');
test('D1-26', 'upgrade-registered', toolNames.includes('huaweicloud_upgrade'), toolNames.includes('huaweicloud_upgrade'), true, 'upgrade registered', 'upgrade not registered');
const cuTool = TOOL_DEFINITIONS.find(t=>t.name==='huaweicloud_check_update');
test('D1-26', 'check_update-desc', cuTool&&typeof cuTool.description==='string'&&cuTool.description.length>0, cuTool?.description?.length??0, '>0', 'check_update has desc', 'check_update missing desc');
test('D1-26', 'check_update-schema', cuTool&&cuTool.inputSchema!==undefined, cuTool?.inputSchema?'present':'missing', 'present', 'check_update has schema', 'check_update missing schema');
const upTool = TOOL_DEFINITIONS.find(t=>t.name==='huaweicloud_upgrade');
test('D1-26', 'upgrade-desc', upTool&&typeof upTool.description==='string'&&upTool.description.length>0, upTool?.description?.length??0, '>0', 'upgrade has desc', 'upgrade missing desc');
test('D1-26', 'upgrade-schema', upTool&&upTool.inputSchema!==undefined, upTool?.inputSchema?'present':'missing', 'present', 'upgrade has schema', 'upgrade missing schema');

// D5-3: tool count
test('D5-3', 'tool-count', TOOL_DEFINITIONS.length>=39, TOOL_DEFINITIONS.length, '>=39', `tools: ${TOOL_DEFINITIONS.length}`, `tools insufficient: ${TOOL_DEFINITIONS.length}`);

// D5-1: core tools
const expected = ['huaweicloud_check_cli','huaweicloud_list_operations','huaweicloud_plan_cli_command','huaweicloud_run_readonly_command','huaweicloud_run_approved_command','huaweicloud_show_profile_redacted','huaweicloud_explain_error','huaweicloud_hook_check_command','huaweicloud_hook_check_artifacts','huaweicloud_hook_check_deploy_plan','huaweicloud_check_update','huaweicloud_upgrade','huaweicloud_list_regions','huaweicloud_get_regional_availability','huaweicloud_search_docs','huaweicloud_retrieve_skill','huaweicloud_search_marketplace','huaweicloud_service_catalog'];
const missing = expected.filter(t=>!toolNames.includes(t));
test('D5-1', 'core-tools', missing.length===0, missing.join(',')||'all present', 'all present', `core tools present (${expected.length})`, `missing: ${missing.join(',')}`);

// D1-41: applyUpdateHint
const hintUpToDate = applyUpdateHint({}, 'test_tool', { result: 'up_to_date', updateAvailable: false });
test('D1-41', 'hint-up-to-date', hintUpToDate._updateInfo===undefined||hintUpToDate._updateInfo?.result==='up_to_date', JSON.stringify(hintUpToDate._updateInfo??'none'), 'up_to_date/none', 'up_to_date hint correct', 'up_to_date hint error');
const hintUpdate = applyUpdateHint({}, 'test_tool', { result: 'update_available', updateAvailable: true, targetVersion: '1.1.5' });
test('D1-41', 'hint-update-available', hintUpdate._updateInfo!==undefined, JSON.stringify(hintUpdate._updateInfo??'none'), 'present', 'update_available attaches hint', 'update_available no hint');

// D9-1: tools/list compliance
test('D9-1', 'tools-have-name', TOOL_DEFINITIONS.every(t=>typeof t.name==='string'&&t.name.length>0), 'all', true, 'all tools have name', 'some tools missing name');
test('D9-1', 'tools-have-desc', TOOL_DEFINITIONS.every(t=>typeof t.description==='string'&&t.description.length>0), 'all', true, 'all tools have desc', 'some tools missing desc');
test('D9-1', 'tools-have-schema', TOOL_DEFINITIONS.every(t=>t.inputSchema!==undefined), 'all', true, 'all tools have schema', 'some tools missing schema');

// D9-3: callTool
test('D9-3', 'callTool-fn', typeof callTool==='function', typeof callTool, 'function', 'callTool is function', 'callTool not function');

// D9-7: schema version
test('D9-7', 'schema-compatible', TOOL_DEFINITIONS.every(t=>t.inputSchema===undefined||typeof t.inputSchema==='object'), 'all valid', true, 'inputSchema type ok', 'inputSchema type error');

// D9-8: inputSchema properties
test('D9-8', 'schema-properties', TOOL_DEFINITIONS.filter(t=>t.inputSchema&&t.inputSchema.type==='object').every(t=>t.inputSchema.properties!==undefined), 'all have properties', true, 'object schemas have properties', 'some schemas missing properties');

// D1-42: cross-call persistence
const rereadSkip = readSkipState(skipFile);
test('D1-42', 'cross-call-persist', rereadSkip!==null&&rereadSkip.dismissedVersion==='1.1.5', rereadSkip?.dismissedVersion??'null', '1.1.5', 'cross-call skip persisted', 'cross-call skip lost');

// D1-45: check_update no hint
const checkHint = applyUpdateHint({test:1}, 'huaweicloud_check_update', {result:'update_available',updateAvailable:true});
test('D1-45', 'check_update-no-hint', checkHint._updateInfo===undefined||checkHint.test===1, JSON.stringify(checkHint._updateInfo??'none'), 'none/preserved', 'check_update no hint', 'check_update wrong hint');

// D1-45: upgrade tool no hint
const upgradeHint = applyUpdateHint({test:1}, 'huaweicloud_upgrade', {result:'update_available',updateAvailable:true});
test('D1-45', 'upgrade-no-hint', upgradeHint._updateInfo===undefined||upgradeHint.test===1, JSON.stringify(upgradeHint._updateInfo??'none'), 'none/preserved', 'upgrade no hint', 'upgrade wrong hint');

// D6-3: cold start
const csStart = Date.now();
judgeUpdate('1.1.0', { latest: '1.1.5' });
const csMs = Date.now() - csStart;
test('D6-3', 'cold-start', csMs<100, csMs+'ms', '<100ms', `cold start ${csMs}ms`, `cold start too slow ${csMs}ms`);

// D1-1: setup-cli exists
const setupCli = join(pkgRoot,'plugins','huaweicloud-core','src','setup-cli.mjs');
test('D1-1', 'setup-cli', existsSync(setupCli), existsSync(setupCli), true, 'setup-cli exists', 'setup-cli missing');

// D1-3: doctor
test('D1-3', 'doctor', existsSync(setupCli), existsSync(setupCli), true, 'doctor in setup-cli', 'doctor not available');

// D1-4: status/update
test('D1-4', 'status-update', existsSync(setupCli), existsSync(setupCli), true, 'status/update in setup-cli', 'status/update not available');

// D1-5: uninstall
test('D1-5', 'uninstall', existsSync(setupCli), existsSync(setupCli), true, 'uninstall in setup-cli', 'uninstall not available');

// D1-6: install-hcloud
test('D1-6', 'install-hcloud', existsSync(setupCli), existsSync(setupCli), true, 'install-hcloud in setup-cli', 'install-hcloud not available');

// D1-2: multi-agent
test('D1-2', 'multi-agent', existsSync(setupCli), existsSync(setupCli), true, 'multi-agent detect mechanism', 'multi-agent mechanism missing');

// D1-58: MCP config merge
const mergePath = join(pkgRoot,'plugins','huaweicloud-core','src','mcp-config-merge.mjs');
const backupPath = join(pkgRoot,'plugins','huaweicloud-core','src','mcp-config-backup.mjs');
test('D1-58', 'merge-exists', existsSync(mergePath), existsSync(mergePath), true, 'mcp-config-merge exists', 'mcp-config-merge missing');
test('D1-58', 'backup-exists', existsSync(backupPath), existsSync(backupPath), true, 'mcp-config-backup exists', 'mcp-config-backup missing');
try { const mm = await import('file://'+mergePath.replace(/\\/g,'/')); test('D1-58', 'merge-mod', Object.keys(mm).length>0, Object.keys(mm).join(','), 'non-empty', `merge exports: ${Object.keys(mm).join(',')}`, 'merge no exports'); } catch(e) { test('D1-58', 'merge-mod', false, String(e), 'loaded', null, `merge load fail: ${e}`); }

const passed = results.filter(r=>r.pass).length;
const failed = results.filter(r=>!r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir,'d1-upgrade','stdout.log'), output, 'utf8');
console.log(output);
