// EXP-E01 路由评测（真实调用 serviceCatalog）
import { mcpTool, VC_QUOTE, ts } from '../../_runner/lib.mjs';
const prompt = "帮我查一下我账号在华北北京四有哪些云主机";
const exp = "ECS";
const r = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: prompt }, 60000);
const actual = JSON.stringify(r.parsed || r.text || '');
const hit = actual.includes(exp);
console.log(JSON.stringify({ caseId: 'EXP-E01', status: hit ? 'PASS' : 'FAIL', why: '期望路由=' + exp + ' 实际命中=' + hit + (hit ? '' : ' 实际返回=' + actual.slice(0, 200)), executedAt: ts(), result: { prompt, expected: exp, actual: actual.slice(0, 800) } }, null, 2));
