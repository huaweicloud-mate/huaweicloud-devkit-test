// Real probe for D3-S8: 操作失败后排障指引
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0004', message: 'Authentication failed: token expired', requestId: 'req-123' }, 45000);
  const txt = (r.text || '') + JSON.stringify(r.parsed || {});
  const hasNext = /(下一步|建议|检查|IAM|region|配额|next|check|action)/i.test(txt);
  const noStack = !/at Object\.<anonymous>|ENOENT.*at /.test(txt);
  const ok = r.ok && hasNext && noStack && txt.length > 40;
  return { status: ok ? 'PASS' : 'FAIL', why: '给出可执行下一步=' + hasNext + ' 非裸堆栈=' + noStack, result: r.parsed || r.text };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
