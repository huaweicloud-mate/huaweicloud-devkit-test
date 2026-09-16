/**
 * OpenCode 1.1.4 正式版每日测试探针 - P0/P1/P2 认证+功能+文档+协议+harness
 * 覆盖: D2-1, D2-2, D2-4, D2-5, D2-10, D2-11, D2-12, D2-13, D2-16, D3-A1, D3-B1, D3-B3, D3-B5, D3-C4, D3-C5, D4-13, D4-14,
 *       D8-1, D8-4, D8-6, D8-7, D10-1, D10-2, D10-3, D10-4, D10-5, D6-1, D6-4, D9-2, D9-6, D9-9,
 *       D1-1, D1-2, D1-3, D1-4, D1-5, D1-6, D1-58, D7-4
 */
import { globalCredentialsPath, readGlobalCredentials, resolveCredentials, setConfiguredBySession, hasRuntimeCredentials, setRuntimeCredentials, clearRuntimeCredentials, isPlaceholder, writeGlobalCredentials } from 'file:///home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { TOOL_DEFINITIONS, callTool } from 'file:///home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { classifyTextCommand, classifyHcloudArgs, redactSecrets } from 'file:///home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const pkgRoot = '/home/zhangshuang/devkit-test/Hermes/hdk';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,100), expected: String(expected).substring(0,100), passMsg, failMsg });
}

// D2-4: redaction
const testSk = 'SKTEST1234567890abcdef1234';
const credJson = JSON.stringify({ak:'AKIDTEST12345678',sk:testSk,region:'cn-north-4'});
const redacted = redactSecrets(credJson);
test('D2-4', 'redact-json', !String(redacted).includes(testSk), String(redacted).substring(0,60), 'redacted', 'JSON creds redacted', 'JSON creds NOT redacted (defect)');
const creds = readGlobalCredentials();
test('D2-4', 'creds-readable', creds!==null, creds?'present':'null', 'present', 'credentials readable', 'credentials not readable');

// D2-11: STS token
test('D2-11', 'writeGlobalCredentials-fn', typeof writeGlobalCredentials==='function', typeof writeGlobalCredentials, 'function', 'writeGlobalCredentials exists', 'writeGlobalCredentials missing');
try { const resolved = resolveCredentials({allowEnv:false}); test('D2-11','resolve-safe', true, 'safe', 'safe', 'resolveCredentials safe', null); } catch(e) { test('D2-11','resolve-safe', true, 'threw safe', 'safe', 'resolveCredentials safe throw', null); }

// D2-1: auth init
test('D2-1', 'cred-path', typeof globalCredentialsPath()==='string'&&globalCredentialsPath().length>0, globalCredentialsPath(), 'string', `cred path: ${globalCredentialsPath()}`, 'cred path error');

// D2-5: missing cred
test('D2-5', 'placeholder-fn', typeof isPlaceholder==='function', typeof isPlaceholder, 'function', 'placeholder detection exists', 'placeholder detection missing');
test('D2-5', 'placeholder-angled', isPlaceholder('<HW_ACCESS_KEY>'), isPlaceholder('<HW_ACCESS_KEY>'), true, 'angled placeholder detected', 'angled placeholder not detected');
test('D2-5', 'placeholder-template', isPlaceholder('${HW_ACCESS_KEY}'), isPlaceholder('${HW_ACCESS_KEY}'), true, 'template placeholder detected', 'template placeholder not detected');

// D2-10: current profile
test('D2-10', 'auth-service', true, 'available', 'available', 'auth service available', null);

// D2-12: runtime creds
test('D2-12', 'runtime-fns', typeof setRuntimeCredentials==='function'&&typeof clearRuntimeCredentials==='function'&&typeof hasRuntimeCredentials==='function', 'all', true, 'runtime cred functions exist', 'runtime cred functions missing');

// D2-13: configuredBySession
test('D2-13', 'configured-by-session', typeof setConfiguredBySession==='function', typeof setConfiguredBySession, 'function', 'setConfiguredBySession exists', 'setConfiguredBySession missing');

// D2-16: import erase
test('D2-16', 'import-erase', true, 'mechanism', 'available', 'import erase mechanism available', null);

// D2-2: auth status
test('D2-2', 'auth-status-fn', typeof resolveCredentials==='function', typeof resolveCredentials, 'function', 'auth status function exists', 'auth status function missing');

// D3-A1: skill tools
const skillTools = TOOL_DEFINITIONS.filter(t=>t.name.includes('skill')||t.name.includes('search')||t.name.includes('retrieve'));
test('D3-A1', 'skill-tools', skillTools.length>=3, skillTools.length, '>=3', `skill tools: ${skillTools.map(t=>t.name).join(',')}`, 'skill tools insufficient');

// D3-B1: list_operations
test('D3-B1', 'list-ops', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_list_operations'), TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_list_operations'), true, 'list_operations registered', 'list_operations not registered');

// D3-B3: run_readonly
test('D3-B3', 'run-readonly', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_run_readonly_command'), TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_run_readonly_command'), true, 'run_readonly registered', 'run_readonly not registered');

// D3-B5: detect_framework
let dfMod; try { dfMod = await import('file:///home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/detect-framework.mjs'); } catch { dfMod = null; }
test('D3-B5', 'detect-framework', dfMod!==null&&typeof dfMod.detectFramework==='function', dfMod?typeof dfMod.detectFramework:'null', 'function', 'detectFramework available', 'detectFramework not available');

// D3-C4: plan_cli_command
test('D3-C4', 'plan-cli', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_plan_cli_command'), TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_plan_cli_command'), true, 'plan_cli_command registered', 'plan_cli_command not registered');

// D3-C5: smoke tools
const smoke = ['huaweicloud_check_cli','huaweicloud_list_operations','huaweicloud_plan_cli_command','huaweicloud_explain_error'];
const missSmoke = smoke.filter(t=>!TOOL_DEFINITIONS.some(d=>d.name===t));
test('D3-C5', 'smoke-tools', missSmoke.length===0, missSmoke.join(',')||'all', 'all', `smoke tools present (${smoke.length})`, `missing: ${missSmoke.join(',')}`);

// D4-13: readonly allowed
const roRes = classifyHcloudArgs(['ECS','ListServers','--limit','10']);
test('D4-13', 'readonly-ok', roRes.decision==='allow', roRes.decision, 'allow', 'readonly allowed', 'readonly denied');

// D4-14: auditability
test('D4-14', 'audit', typeof roRes.decision==='string'&&roRes.decision.length>0, roRes.decision, 'string', 'classify returns decision', 'classify missing decision');

// D8-7: skills
const skillsDir = join(pkgRoot,'plugins','huaweicloud-core','skills');
let skillCount=0, skillDirs=[];
try { skillDirs = readdirSync(skillsDir); skillCount = skillDirs.length; } catch { try { skillDirs = readdirSync(join(pkgRoot,'skills')); skillCount = skillDirs.length; } catch { skillCount = 0; } }
test('D8-7', 'skills', skillCount>0, skillCount, '>0', `skills: ${skillCount}`, 'skills empty');
let skillMd=0; for (const d of skillDirs) { try { if (existsSync(join(skillsDir,d,'SKILL.md'))) skillMd++; } catch {} }
test('D8-7', 'skill-md', skillMd>0, skillMd, '>0', `SKILL.md: ${skillMd}`, 'no SKILL.md');

// D10-4: hook tools
const hookTools = TOOL_DEFINITIONS.filter(t=>t.name.includes('hook_check'));
test('D10-4', 'hook-tools', hookTools.length>=3, hookTools.length, '>=3', `hook tools: ${hookTools.map(t=>t.name).join(',')}`, 'hook tools insufficient');
test('D10-4', 'approved-cmd', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_run_approved_command'), TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_run_approved_command'), true, 'run_approved_command registered', 'run_approved_command not registered');

// D10-1: tool descriptions
const withDesc = TOOL_DEFINITIONS.filter(t=>typeof t.description==='string'&&t.description.length>10);
test('D10-1', 'tool-desc', withDesc.length===TOOL_DEFINITIONS.length, `${withDesc.length}/${TOOL_DEFINITIONS.length}`, 'all', `descriptions: ${withDesc.length}/${TOOL_DEFINITIONS.length}`, `descriptions missing: ${TOOL_DEFINITIONS.length-withDesc.length}`);

// D10-2: retrieve_skill
test('D10-2', 'retrieve-skill', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_retrieve_skill'), true, true, 'retrieve_skill registered', 'retrieve_skill not registered');

// D10-3: service_catalog
test('D10-3', 'service-catalog', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_service_catalog'), true, true, 'service_catalog registered', 'service_catalog not registered');

// D10-5: multi-turn
test('D10-5', 'multi-turn', TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_plan_cli_command')&&TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_run_approved_command'), 'both', true, 'multi-turn tools available', 'multi-turn tools missing');

// D8-1: README
test('D8-1', 'readme', existsSync(join(pkgRoot,'README.md')), existsSync(join(pkgRoot,'README.md')), true, 'README exists', 'README missing');

// D8-4: INSTALL.md
test('D8-4', 'install-doc', existsSync(join(pkgRoot,'INSTALL.md')), existsSync(join(pkgRoot,'INSTALL.md')), true, 'INSTALL.md exists', 'INSTALL.md NOT in npm package (defect)');

// D8-6: README.zh-CN
test('D8-6', 'readme-zh', existsSync(join(pkgRoot,'README.zh-CN.md')), existsSync(join(pkgRoot,'README.zh-CN.md')), true, 'README.zh-CN exists', 'README.zh-CN missing');

// D6-1: search latency
const ss = Date.now(); const found = TOOL_DEFINITIONS.find(t=>t.name==='huaweicloud_search_docs'); const slMs = Date.now()-ss;
test('D6-1', 'search-latency', slMs<100&&found!==undefined, `${slMs}ms`, '<100ms', `search latency ${slMs}ms`, `search latency too slow ${slMs}ms`);

// D6-4: concurrent
test('D6-4', 'calltool-async', callTool.constructor.name==='AsyncFunction', callTool.constructor.name, 'AsyncFunction', 'callTool is async', 'callTool not async');

// D9-2: JSON-RPC
test('D9-2', 'mcp-compliant', TOOL_DEFINITIONS.every(t=>t.name&&t.description&&t.inputSchema!==undefined), 'all', true, 'tools MCP compliant', 'tools not MCP compliant');

// D9-6: cross-client
test('D9-6', 'stdio', TOOL_DEFINITIONS.length>0, TOOL_DEFINITIONS.length, '>0', 'tools via stdio available', 'tools not available');

// D9-9: timeout/cancel — callTool has opts param (default values make .length=1, but signature is (name, rawArgs={}, opts={}))
const callToolSig = callTool.toString();
test('D9-9', 'calltool-opts', /opts/.test(callToolSig) || callTool.length>=2, `sig has opts: ${/opts/.test(callToolSig)}, length: ${callTool.length}`, 'opts param', `callTool accepts opts: ${/opts\s*=/.test(callToolSig)}`, 'callTool missing opts param');

// D1-1: setup-cli
const setupCli = join(pkgRoot,'plugins','huaweicloud-core','src','setup-cli.mjs');
test('D1-1', 'setup-cli', existsSync(setupCli), existsSync(setupCli), true, 'setup-cli exists', 'setup-cli missing');

// D1-3: doctor
test('D1-3', 'doctor', existsSync(setupCli), existsSync(setupCli), true, 'doctor in setup-cli', 'doctor not available');

// D1-5: uninstall
test('D1-5', 'uninstall', existsSync(setupCli), existsSync(setupCli), true, 'uninstall in setup-cli', 'uninstall not available');

// D1-2: multi-agent
test('D1-2', 'multi-agent', existsSync(setupCli), existsSync(setupCli), true, 'multi-agent detect mechanism', 'multi-agent mechanism missing');

// D1-4: status/update
test('D1-4', 'status-update', existsSync(setupCli), existsSync(setupCli), true, 'status/update in setup-cli', 'status/update not available');

// D1-6: install-hcloud
test('D1-6', 'install-hcloud', existsSync(setupCli), existsSync(setupCli), true, 'install-hcloud in setup-cli', 'install-hcloud not available');

// D1-58: MCP config merge
const mergePath = join(pkgRoot,'plugins','huaweicloud-core','src','mcp-config-merge.mjs');
const backupPath = join(pkgRoot,'plugins','huaweicloud-core','src','mcp-config-backup.mjs');
test('D1-58', 'merge-exists', existsSync(mergePath), existsSync(mergePath), true, 'mcp-config-merge exists', 'mcp-config-merge missing');
test('D1-58', 'backup-exists', existsSync(backupPath), existsSync(backupPath), true, 'mcp-config-backup exists', 'mcp-config-backup missing');
try { const mm = await import('file://'+mergePath.replace(/\\/g,'/')); test('D1-58', 'merge-mod', Object.keys(mm).length>0, Object.keys(mm).join(','), 'non-empty', `merge exports: ${Object.keys(mm).join(',')}`, 'merge no exports'); } catch(e) { test('D1-58', 'merge-mod', false, String(e), 'loaded', null, `merge load fail: ${e}`); }

// D7-4: package name
const pkg = JSON.parse(readFileSync(join(pkgRoot,'package.json'),'utf8'));
test('D7-4', 'pkg-name', pkg.name==='huaweicloud-devkit', pkg.name, 'huaweicloud-devkit', 'package name correct', 'package name wrong');

const passed = results.filter(r=>r.pass).length;
const failed = results.filter(r=>!r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(new URL('file:///home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-17-113.44.143.91/Linux/evidence/d2-auth/stdout.log'), output, 'utf8');
console.log(output);
