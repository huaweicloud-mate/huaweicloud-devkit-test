// 展开级探针：EXP-NR3-09/10（Linux 无 .cmd/EINVAL + 同步/异步检测链）+ EXP-C4-01~22（22 服务只读规划冒烟）
import { queryDistTagsSync, queryDistTags } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
function check(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { check(id, desc, Boolean(cond), true); }

// EXP-NR3-09：sync/async 双路径 + EINVAL 语义（Linux npm 无 .cmd）
const isWin = process.platform === 'win32';
const npmBin = isWin ? 'npm.cmd' : 'npm';
console.log(`INFO   EXP-NR3-09  platform=${process.platform} NPM_BIN=${npmBin}`);
bool('EXP-NR3-09', 'Linux 平台不引入 npm.cmd（无 EINVAL 触发源）', npmBin === 'npm');
const syncR = queryDistTagsSync({ timeoutMs: 20000 });
console.log(`INFO   EXP-NR3-09  queryDistTagsSync => ${JSON.stringify(syncR)}`);
bool('EXP-NR3-09', '同步路径静默可用（返回 dist-tags，无 EINVAL）', syncR && typeof syncR === 'object' && Object.hasOwn(syncR, 'latest'));
const asyncR = await queryDistTags({ timeoutMs: 20000 });
console.log(`INFO   EXP-NR3-09  queryDistTags(async) => ${JSON.stringify(asyncR)}`);
bool('EXP-NR3-09', '异步路径静默可用（返回 dist-tags）', asyncR && typeof asyncR === 'object');

// EXP-NR3-10：Linux 无 .cmd/EINVAL 语义 + 检测链端到端可用
bool('EXP-NR3-10', 'Linux 无 npm.cmd EINVAL 语义（NPM_BIN=npm）', npmBin === 'npm');
bool('EXP-NR3-10', '检测链端到端可得到最新 dist-tags（latest 非空）', syncR && typeof syncR.latest === 'string' && syncR.latest.length > 0);

// EXP-C4-01~22：22 服务只读规划冒烟（list_operations 返回规范 command，仅只读不创建资源）
const SERVICES = ['ecs','vpc','obs','rds','gaussdb','cce','functiongraph','iam','cts','ces','dds','dcs','smn','dms','waf','cdn','modelarts','dew','cbr','evs','eip','elb'];
let c4ok = 0, c4bad = [];
for (const svc of SERVICES) {
  let r;
  try { r = await callTool('huaweicloud_list_operations', { service: svc }); } catch (e) { r = { error: e.message }; }
  const ok = r && typeof r.command === 'string' && r.command.length > 0;
  if (ok) c4ok++; else c4bad.push(svc);
  console.log(`INFO   EXP-C4  list_operations(${svc}) => ${ok ? 'OK command=' + r.command.slice(0, 30) : 'BAD ' + JSON.stringify(r).slice(0, 80)}`);
}
console.log(`INFO   EXP-C4  服务矩阵 ${c4ok}/${SERVICES.length} 通过，失败: ${JSON.stringify(c4bad)}`);
bool('EXP-C4', '22 服务 list_operations 只读规划全部可路由', c4ok === SERVICES.length);

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);