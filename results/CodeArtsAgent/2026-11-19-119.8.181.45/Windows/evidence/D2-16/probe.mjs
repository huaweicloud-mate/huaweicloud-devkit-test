// Real probe for D2-16: import文件读取后擦除
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  return { status: 'BLOCKED', why: 'auth_switch mode=import 被 approval 门拦截，无人值守终端 approve 命令明确拒绝执行（需交互终端），无法验证擦除；解除条件：在交互终端执行 approve 后重跑', result: { blocked: 'interactive approval required' } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
