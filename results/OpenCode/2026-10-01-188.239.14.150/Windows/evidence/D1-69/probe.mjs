// 用例 D1-69 探针（真实执行：调用 probes/ 下该用例的实现，结论写同目录 stdout.log）
import { mk } from '../../_lib/lib.mjs';
import { PROBES } from '../../probes/index.mjs';
const ctx = mk("D1-69");
try {
  await PROBES["D1-69"](ctx);
} catch (e) {
  ctx.fail('探针执行异常: ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e)));
}
await ctx.finish();
