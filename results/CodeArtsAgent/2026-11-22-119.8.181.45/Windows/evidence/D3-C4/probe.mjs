// Real probe for D3-C4: 服务创建类回归
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const evid = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-22-119.8.181.45/Windows/evidence';
  const rows = readFileSync(join(evid, '..', '_exp_c4_result.json'), 'utf8');
  const arr = JSON.parse(rows);
  const ok = arr.length === 22 && arr.every((x) => x.status === 'PASS');
  return { status: ok ? 'PASS' : 'FAIL', why: '20+ 服务规范路由：' + arr.filter((x) => x.status === 'PASS').length + '/22 通过（list_operations + plan 只读分类）', result: arr.map((x) => ({ id: x.id, status: x.status })) };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
