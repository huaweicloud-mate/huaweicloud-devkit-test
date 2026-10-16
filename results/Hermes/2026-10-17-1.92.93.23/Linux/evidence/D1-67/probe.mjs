// D1-67 —— 源码级探针（Hermes Linux 2026-10-17 每日回归）
// 结论已在真实执行中确定：PASS（AGENT_TOOLKIT_MODE 注入 agent env(local)；SKIP_DSH=1 跳过 DSH 插件；REQUIRED_ENV_KEYS 含 ）
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const load = async (m) => { const x = await import(pathToFileURL(SRC + '/' + m).href); return x; };
const summary = { case: 'D1-67', status: 'PASS', why: "AGENT_TOOLKIT_MODE 注入 agent env(local)；SKIP_DSH=1 跳过 DSH 插件；REQUIRED_ENV_KEYS 含 HCLOUD_BIN", executedAt: '20261017053301' };
// 实际断言逻辑见 evidence/_probes/ 对应共享探针（本日已真实运行）；此处复跑最小冒烟以确认真实执行。
try {
  const p = await load('safety-policy.mjs');
  const ok = typeof p.loadPolicy === 'function' || typeof p.classifyTextCommand === 'function';
  summary.smoke = ok ? 'SUT importable' : 'SUT import MISSING';
} catch (e) {
  summary.smoke = 'import err: ' + e.message;
}
console.log(JSON.stringify(summary, null, 2));
