// #616 dev 分支真实代码 E2E（import dev worktree 的 hdkitservice-api.mjs）
// 调 hdkitCheckUser() —— dev(afa9dca) 真实产品代码 + 真实 getCredentials 链
import { hdkitCheckUser } from 'file:///C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/ITER-008-20260911072254/wt-dev/plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs';

// 指向测试环境（#616 复现环境）
process.env.HDKITSERVICE_ENDPOINT = 'http://devkit.topxtopx.com/rest/developer/server/hdkitservice/';

try {
  const result = await hdkitCheckUser();
  console.log('[dev E2E] hdkitCheckUser 成功');
  console.log(JSON.stringify(result, null, 2).slice(0, 800));
} catch (e) {
  console.log('[dev E2E] hdkitCheckUser 抛错:');
  console.log('  code=' + (e.code || '-') + ' status=' + (e.status || '-') + ' traceId=' + (e.traceId || '-'));
  console.log('  message=' + (e.message || e).slice(0, 600));
  const hasTooOld = String(e.message || '').includes('HDKIT_VERSION_TOO_OLD');
  console.log('\n[判定] HDKIT_VERSION_TOO_OLD 拦截: ' + hasTooOld);
  console.log(hasTooOld
    ? '[FAIL] dev 修复形态仍被版本拦截'
    : '[PASS] 无版本拦截（dev 真实代码 E2E 通过版本关卡）');
}