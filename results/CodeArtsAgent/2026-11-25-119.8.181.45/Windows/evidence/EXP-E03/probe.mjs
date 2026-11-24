// EXP-E03 路由评测（真实调用 serviceCatalog）
import { mcpTool, VC_QUOTE, ts } from '../../_runner/lib.mjs';
const prompt = "把本地 dist 目录部署成一个公网静态网站";
const exp = "OBS";
const r = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: prompt }, 60000);
const actual = JSON.stringify(r.parsed || r.text || '');
const hit = actual.includes(exp);
console.log(JSON.stringify({ caseId: 'EXP-E03', status: hit ? 'PASS' : 'FAIL', why: '期望路由=' + exp + ' 实际命中=' + hit + (hit ? '' : ' 实际返回=' + actual.slice(0, 200)), executedAt: ts(), result: { prompt, expected: exp, actual: actual.slice(0, 800) } }, null, 2));
