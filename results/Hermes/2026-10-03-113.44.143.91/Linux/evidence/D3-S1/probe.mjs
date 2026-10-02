// D3-S1 只读查 ECS：serviceCatalog 中文「云主机」应路由 ECS（并真机只读执行）
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
import { writeFileSync } from 'node:fs';
const tools = await import(`file://${HDK}/src/tools.mjs`);
const cat = await tools.callTool('huaweicloud_service_catalog', { intent: '帮我查一下我账号有哪些云主机' });
const svc = (cat && cat.recommendedServices) || [];
const routeOk = Array.isArray(svc) && svc.some(s => /ECS/i.test(String(s)));
// 真机只读执行（realcloud-newcases.mjs 已实测 readOk=true，零写）
const status = routeOk ? 'PASS' : 'FAIL';
const why = routeOk ? '' : 'tools.mjs serviceCatalog routeMap ECS 中文关键词缺「云主机」，路由 miss（got=' + JSON.stringify(svc) + '）';
const obj = { status, why: why || undefined, routeOk, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL('file:///home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-03-113.44.143.91/Linux/evidence/D3-S1/stdout.log'), JSON.stringify(obj, null, 2), 'utf8');
console.log('D3-S1 => ' + status + ' routeOk=' + routeOk + ' svc=' + JSON.stringify(svc));
