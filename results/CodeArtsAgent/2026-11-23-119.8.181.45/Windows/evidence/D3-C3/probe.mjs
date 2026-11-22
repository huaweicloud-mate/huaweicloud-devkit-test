// Real probe for D3-C3: 沙箱实测
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const cu = await mcpTool('huaweicloud_sandbox_check_user', {}, 45000);
    const cred = await mcpTool('huaweicloud_sandbox_credentials', {}, 45000);
    return { status: 'BLOCKED', why: '实测 ' + ts() + ' sandbox_check_user ok=' + cu.ok + '（' + (cu.text || '').slice(0, 120) + '）；sandbox_credentials ok=' + cred.ok + '；缺 DevStation 沙箱 workspace 会话与配额；影响：sandbox 部署/7 隐式工具/预览 URL 无法实测；解除条件：提供已签协议的有效沙箱会话', result: { checkUser: { ok: cu.ok, text: (cu.text || '').slice(0, 300) }, credentials: { ok: cred.ok, text: (cred.text || '').slice(0, 200) } } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
