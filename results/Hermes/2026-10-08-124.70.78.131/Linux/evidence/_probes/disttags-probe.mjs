// EXP-NR3-10 (源 D1-39) Linux 升级检测链负面/环境验证探针（Hermes Linux 每日回归）
// 在 Linux 上直调 update-check.mjs 的 queryDistTagsSync / queryDistTags，
// 核对检测链可用（无 Windows EINVAL 静默失败 #554），返回有效 dist-tags。
import { pathToFileURL } from 'node:url';

const SRC = process.argv[2];
const U = await import(pathToFileURL(`${SRC}/update-check.mjs`).href);

function ok(name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' | ' + detail : ''}`);
}

// 1) 同步路径 queryDistTagsSync（Windows EINVAL 专属；Linux 应正常返回）
try {
  const sync = U.queryDistTagsSync({ timeoutMs: 20000 });
  console.log(`[NR3-10] queryDistTagsSync =>`, JSON.stringify(sync));
  ok('NR3-10 queryDistTagsSync 返回对象(无 EINVAL/异常)', sync && typeof sync === 'object');
  ok('NR3-10 distTags 含 latest 键', Boolean(sync && sync.latest));
} catch (e) {
  console.log(`[NR3-10] queryDistTagsSync 抛异常: ${e.message}`);
  ok('NR3-10 queryDistTagsSync 无异常', false, e.message);
}

// 2) 异步路径 queryDistTags（spawn npm view 分支）
try {
  const async_ = await U.queryDistTags({ timeoutMs: 20000 });
  console.log(`[NR3-10] queryDistTags =>`, JSON.stringify(async_));
  ok('NR3-10 queryDistTags 返回对象(无 EINVAL/异常)', async_ && typeof async_ === 'object');
} catch (e) {
  console.log(`[NR3-10] queryDistTags 抛异常: ${e.message}`);
  ok('NR3-10 queryDistTags 无异常', false, e.message);
}

console.log('=== DONE ===');