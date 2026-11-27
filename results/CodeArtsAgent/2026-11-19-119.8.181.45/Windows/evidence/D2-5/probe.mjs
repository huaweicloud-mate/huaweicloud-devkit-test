// Real probe for D2-5: 凭证缺失报错指引
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const h = iso('d25b');
  const r = await mcpTool('huaweicloud_auth_status', { vendorConfirmed: VC_QUOTE }, 45000, { USERPROFILE: h, HOME: h });
  const txt = (r.text || '') + JSON.stringify(r.parsed || {});
  const guided = /auth init|configure|credential/i.test(txt);
  const noStack = !/at Object\.<anonymous>|node:internal/.test(txt);
  return { status: guided && noStack ? 'PASS' : 'FAIL', why: '无凭证返回含可执行指引=' + guided + '，无裸堆栈=' + noStack, result: { text: txt.slice(0, 700) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
