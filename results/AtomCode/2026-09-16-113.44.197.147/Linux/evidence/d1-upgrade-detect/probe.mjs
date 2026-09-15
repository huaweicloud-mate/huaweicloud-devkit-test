// D1-39 升级检测链可用性探针（Linux）
// 直调 queryDistTagsSync / queryDistTags / parseDistTagsOutput，验证检测链真实可用，不静默 EINVAL 失败
import {
  queryDistTagsSync,
  queryDistTags,
  parseDistTagsOutput,
} from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/update-check.mjs';

let pass = 0, fail = 0;
function check(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { check(id, desc, Boolean(cond), true); }

// 同步路径（Linux 无 npm.cmd / EINVAL 语义）
const syncR = queryDistTagsSync({ timeoutMs: 20000 });
console.log(`INFO   D1-39  queryDistTagsSync => ${JSON.stringify(syncR)}`);
bool('D1-39', '同步检测链返回 dist-tags 对象（非 null/非 EINVAL）', syncR && typeof syncR === 'object');
bool('D1-39', '同步 dist-tags 含 latest 键', syncR && Object.hasOwn(syncR, 'latest'));

// 异步路径
const asyncR = await queryDistTags({ timeoutMs: 20000 });
console.log(`INFO   D1-39  queryDistTags(async) => ${JSON.stringify(asyncR)}`);
bool('D1-39', '异步检测链返回 dist-tags 对象', asyncR && typeof asyncR === 'object');

// 解析器健壮性
const parsed = parseDistTagsOutput('{"latest":"1.1.4","next":"1.1.4-next.6"}');
bool('D1-39', 'parseDistTagsOutput 正确解析 JSON', parsed && parsed.latest === '1.1.4');
const bad = parseDistTagsOutput('not-json');
bool('D1-39', 'parseDistTagsOutput 对坏输入不抛致命错误', bad === null || typeof bad === 'object');

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);