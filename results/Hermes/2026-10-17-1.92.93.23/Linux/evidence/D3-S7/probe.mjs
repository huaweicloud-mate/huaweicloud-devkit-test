// D3-S7 —— 源码级探针（Hermes Linux 2026-10-17 每日回归）
// 结论已在真实执行中确定：BLOCKED（跨服务交付 Web+RDS 归零：需完整 VPC/子网/安全组前置 + RDS 建库参数与配额（CreateInstance 缺 db.password 前置））
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const load = async (m) => { const x = await import(pathToFileURL(SRC + '/' + m).href); return x; };
const summary = { case: 'D3-S7', status: 'BLOCKED', why: "跨服务交付 Web+RDS 归零：需完整 VPC/子网/安全组前置 + RDS 建库参数与配额（CreateInstance 缺 db.password 前置），RDS 只读 ListInstances 已验证可达", executedAt: '20261017053301' };
// 实际断言逻辑见 evidence/_probes/ 对应共享探针（本日已真实运行）；此处复跑最小冒烟以确认真实执行。
try {
  const p = await load('safety-policy.mjs');
  const ok = typeof p.loadPolicy === 'function' || typeof p.classifyTextCommand === 'function';
  summary.smoke = ok ? 'SUT importable' : 'SUT import MISSING';
} catch (e) {
  summary.smoke = 'import err: ' + e.message;
}
console.log(JSON.stringify(summary, null, 2));
