// EXP-E08 聚焦探针 — 诊断意图 explain_error 路由（D10 评测集）
// 断言: "我的ECS启动失败了 帮我分析原因" 应路由到 explain_error 诊断能力，而非 serviceCatalog 通用 help。
import { writeFileSync } from 'node:fs';

const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const EVID = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-03-113.44.143.91/Linux/evidence';
const now = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

const tools = await import(`file://${HDK}/src/tools.mjs`);
const prompt = '我的ECS启动失败了 帮我分析原因';
const r = await tools.callTool('huaweicloud_service_catalog', { intent: prompt });
const svcs = r && (r.recommendedServices || r.services || []);
const got = Array.isArray(svcs) ? svcs.join(',') : JSON.stringify(svcs);
const hasHelp = /help/i.test(got);
const hasExplain = /explain/i.test(got) || /诊断/.test(got) || /troubleshoot/i.test(got);

// 预期: 诊断意图应走 explain_error（不应落回 serviceCatalog 通用 help）
const ok = !hasHelp && (hasExplain || Array.isArray(svcs) && svcs.length === 0 && !hasHelp);
const status = ok ? 'PASS' : 'FAIL';
const why = ok ? '' : `诊断意图 explain_error 无 routeMap 映射，serviceCatalog 返回通用 help（got=${got}）`;

writeFileSync(`${EVID}/EXP-E08/stdout.log`, JSON.stringify({ status, caseId: 'EXP-E08', executedAt: now(), why }, null, 2), 'utf8');
console.log(`EXP-E08 => ${status} got=${got}`);