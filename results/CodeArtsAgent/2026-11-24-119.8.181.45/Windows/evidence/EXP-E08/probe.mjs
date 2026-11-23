// EXP-E08 诊断类意图：真实调用 explain_error（不走服务目录）
import { mcpTool, ts } from '../../_runner/lib.mjs';
const ex = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0004', message: 'ECS 启动失败', requestId: 'req-e08' }, 45000);
const ok = ex.ok && (ex.text || '').length > 40;
console.log(JSON.stringify({ caseId: 'EXP-E08', status: ok ? 'PASS' : 'FAIL', why: '诊断类意图走 explain_error（非服务目录）；返回可执行诊断=' + ok, executedAt: ts(), result: { explain: (ex.text || '').slice(0, 600), parsed: ex.parsed } }, null, 2));
