// Real probe for D3-S8: 场景-操作失败后排障指引
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const ex = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0044', message: 'the volumeType [SATA] is sellout in az[cn-north-4a]' }, 45000);
  const t = ex.text || '';
  const ok = ex.ok && t.length > 40 && /建议|处理|措施|改用|retry|suggest/i.test(t);
  return { status: ok ? 'PASS' : 'FAIL', why: '给出可执行下一步=' + ok + ' 非裸堆栈=' + !/at .*\.mjs:\d+/.test(t), result: { text: t.slice(0, 800) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
