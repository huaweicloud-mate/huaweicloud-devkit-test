// 聚焦探针 — Hermes/Linux/2026-10-01 v1.1.8-next.1 (ffd7b474)
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
import { writeFileSync } from 'node:fs';
const results = [];
function record(id, pass, actual, expected, why) { results.push({ id, pass, actual: String(actual).slice(0,120), expected, why }); }
const __spec = null;
try {
  const tools = await import(`file://${HDK}/src/tools.mjs`);
  
  const r = await tools.callTool('huaweicloud_service_catalog', { intent: '先预览沙箱再上生产ECS部署' });
  const svc = (r && r.recommendedServices) || [];
  const hitSandbox = Array.isArray(svc) && svc.some(s => /sandbox/i.test(String(s)));
  const hitEcs = Array.isArray(svc) && svc.some(s => /ECS/i.test(String(s)));
  record('layered-route', hitSandbox && hitEcs, JSON.stringify(svc), 'Sandbox + ECS 均命中', '分层关键词未命中 Sandbox');

} catch (e) {
  results.push({ id: '__EXCEPTION__', pass: false, actual: e && e.message, expected: 'no throw', why: 'probe 异常' });
}
const allPass = results.length > 0 && results.every(r => r.pass);
let status = allPass ? 'PASS' : (__spec || 'FAIL');
const why = results.filter(r => !r.pass).map(r => `${r.id}:${r.why || (r.actual + '!=' + r.expected)}`).join('; ');
const obj = { status, why: why || undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL('file:///home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-03-113.44.143.91/Linux/evidence/D3-S5/stdout.log'), JSON.stringify(obj, null, 2), 'utf8');
console.log(`${cid} => ${status} ${results.filter(r=>!r.pass).length}/results.length 未过: ${why || '无'}`);
