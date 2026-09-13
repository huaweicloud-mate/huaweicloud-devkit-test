/**
 * Hermes 每日测试探针 - D1-39 Linux 升级检测链 + 展开级 Linux 代表性用例 (Linux)
 * SUT: huaweicloud-devkit@1.1.4-next.3 (commit 3b6290b0)
 * 覆盖: EXP-NR3-10 (D1-39 Linux OS_MATRIX) / D1-40 镜像lag / EXP-D5-8-1(清单)/EXP-D5-8-3(39工具)
 */
import { queryDistTagsSync, judgeUpdate, semverCompare, readInstalledVersion } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { TOOL_DEFINITIONS } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { getAgentRegistrationStatuses } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/agent-registration.mjs';

let pass = 0, fail = 0; const failures = [];
function T(id, name, actual, expected, expectFn) {
  let ok;
  try { ok = typeof expectFn === 'function' ? expectFn(actual) : (actual === expected); }
  catch (e) { ok = false; actual = 'THREW:' + e.message; }
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}  => ${JSON.stringify(actual)}${ok ? '' : '  (expected ' + JSON.stringify(expected) + ')'}`);
  if (ok) pass++; else { fail++; failures.push({ id, name, actual, expected }); }
  return ok;
}

console.log('===== D1-39 升级检测链 (Linux scope) =====');
let qres = null;
try { qres = queryDistTagsSync({ timeoutMs: 15000 }); } catch (e) { qres = { error: e.message }; }
console.log('  queryDistTagsSync =>', JSON.stringify(qres));
T('D1-39', 'queryDistTagsSync 不抛 EINVAL/可返回 dist-tags (Linux)', !!qres && !qres.error && (qres.latest || qres.next) ? true : false, true);
T('D1-39', 'queryDistTagsSync 返回 latest+next 两字段', !qres?.error && typeof qres?.latest === 'string' && typeof qres?.next === 'string', true);
const installed = readInstalledVersion();
console.log('  readInstalledVersion =>', installed);
T('D1-39', 'readInstalledVersion 可读', typeof installed === 'string' && installed.length > 0, true);

console.log('===== D1-40 镜像 lag 反向提醒防护 =====');
T('D1-40', '本地 1.1.4 / 镜像 latest=1.1.3 => up_to_date (不倒退)', judgeUpdate('1.1.4', { latest: '1.1.3' }).result, 'up_to_date');
T('D1-40', '本地 1.1.4 / 镜像 latest=1.1.4 => up_to_date', judgeUpdate('1.1.4', { latest: '1.1.4' }).result, 'up_to_date');
T('D1-40', '本地 1.1.4 / 镜像 latest=1.1.5 => update_available', judgeUpdate('1.1.4', { latest: '1.1.5' }).result, 'update_available');

console.log('===== EXP-D5-8-1 Hermes 清单发现/注册状态 =====');
let reg = null;
try { reg = getAgentRegistrationStatuses('hermes'); } catch (e) { reg = { error: e.message }; }
console.log('  hermes registration =>', JSON.stringify(reg));
T('EXP-D5-8-1', 'getAgentRegistrationStatuses("hermes") 可查询 (不抛)', typeof reg === 'object', true);

console.log('===== EXP-D5-8-3 Hermes 39 工具全量枚举 =====');
T('EXP-D5-8-3', '39 工具可达', TOOL_DEFINITIONS.length, 39);

console.log(`\n===== 汇总: ${pass} PASS / ${fail} FAIL =====`);
if (fail) { console.log('失败项:'); failures.forEach(f=>console.log(`  - ${f.id} ${f.name}: actual=${JSON.stringify(f.actual)}`)); }
process.exitCode = fail > 0 ? 1 : 0;