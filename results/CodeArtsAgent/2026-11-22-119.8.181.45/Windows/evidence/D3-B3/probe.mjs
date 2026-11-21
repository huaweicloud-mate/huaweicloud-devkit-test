// Real probe for D3-B3: run_readonly 脱敏执行
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = await mcpTool('huaweicloud_run_readonly_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const txt = r.text || '';
  const noLeak = !/AK[A-Z0-9]{16,}|SK[A-Z0-9]{30,}/.test(txt);
  const hasFields = /servers|count/i.test(txt);
  const ok = r.ok && noLeak && hasFields;
  return { status: ok ? 'PASS' : 'FAIL', why: '只读执行成功=' + r.ok + ' 输出无明文AK/SK=' + noLeak + ' 含清单字段=' + hasFields + ' 输出=' + txt.slice(0, 160), result: { text: txt.slice(0, 900) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
