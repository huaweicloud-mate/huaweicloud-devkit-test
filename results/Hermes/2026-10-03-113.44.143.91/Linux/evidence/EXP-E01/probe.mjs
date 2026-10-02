// EXP-E01 eval 意图路由：'查华北北京四云主机' 应命中 ECS（eval harness 已实测 MISS）
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
import { writeFileSync } from 'node:fs';
const tools = await import(`file://${HDK}/src/tools.mjs`);
const cat = await tools.callTool('huaweicloud_service_catalog', { intent: '帮我查一下我账号在华北北京四有哪些云主机' });
const svc = (cat && cat.recommendedServices) || [];
const hit = Array.isArray(svc) && svc.some(s => /ECS/i.test(String(s)));
const status = hit ? 'PASS' : 'FAIL';
const why = hit ? '' : 'routeMap 缺「云主机」，中文意图未映射 ECS（eval harness MISS，准确率 92.9%）';
const obj = { status, why: why || undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL('file:///home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-03-113.44.143.91/Linux/evidence/EXP-E01/stdout.log'), JSON.stringify(obj, null, 2), 'utf8');
console.log('EXP-E01 => ' + status + ' hit=' + hit + ' svc=' + JSON.stringify(svc));
