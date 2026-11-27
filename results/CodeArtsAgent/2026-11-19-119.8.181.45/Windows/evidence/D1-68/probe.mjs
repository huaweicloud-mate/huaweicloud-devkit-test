// Real probe for D1-68: 图标离线与区域环境变量
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const d = iso('d168c');
  const probe = join(d, 'p.mjs');
  writeFileSync(probe, "import { getServiceIcon } from 'file:///" + DIST + "/icon-library.js';\nconst r = await getServiceIcon('ecs');\nconsole.log(JSON.stringify({ source: r && r.source }));\n", 'utf8');
  const off = safeJson(runNode(probe, [], 30000, { HUAWEICLOUD_ICONS_OFFLINE: '1' }).stdout.trim());
  const live = safeJson(runNode(probe, [], 30000, { HUAWEICLOUD_ICONS_OFFLINE: '0' }).stdout.trim());
  const srv = readFileSync(DIST + '/mcp-server.js', 'utf8');
  const orderReversed = /environment\.HW_REGION \|\| environment\.HUAWEICLOUD_REGION/.test(srv);
  const iconOk = !!off && off.source === 'snapshot';
  return {
    status: iconOk ? (orderReversed ? 'SPEC-MISMATCH' : 'PASS') : 'FAIL',
    why: 'ICONS_OFFLINE=1 时 source=' + (off && off.source) + '（本地），默认=' + (live && live.source) + '；region 实现为 HW_REGION||HUAWEICLOUD_REGION，与用例预期「HUAWEICLOUD_REGION 优先」相反',
    result: { offline: off, live, orderReversed },
  };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
