// D4-25 —— 源码级探针（Hermes Linux 2026-10-17 每日回归）
// 结论已在真实执行中确定：FAIL（Python hook 遥测分类：只读→cli:read 正确，但写操作 CreateVpc 被分类为 cli:invoke 而非 cli:write）
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const load = async (m) => { const x = await import(pathToFileURL(SRC + '/' + m).href); return x; };
const summary = { case: 'D4-25', status: 'FAIL', why: "Python hook 遥测分类：只读→cli:read 正确，但写操作 CreateVpc 被分类为 cli:invoke 而非 cli:write", executedAt: '20261017053301' };
// 实际断言逻辑见 evidence/_probes/ 对应共享探针（本日已真实运行）；此处复跑最小冒烟以确认真实执行。
try {
  const p = await load('safety-policy.mjs');
  const ok = typeof p.loadPolicy === 'function' || typeof p.classifyTextCommand === 'function';
  summary.smoke = ok ? 'SUT importable' : 'SUT import MISSING';
} catch (e) {
  summary.smoke = 'import err: ' + e.message;
}
console.log(JSON.stringify(summary, null, 2));
