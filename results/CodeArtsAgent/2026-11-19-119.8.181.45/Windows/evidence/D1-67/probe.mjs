// Real probe for D1-67: Agent toolkit 模式与 DSH 跳过安装环境变量
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const merge = readFileSync(DIST + '/mcp-config-merge.js', 'utf8');
  const io = readFileSync(DIST + '/mcp-config-io.js', 'utf8');
  const up = readFileSync(DIST + '/update-upgrade.js', 'utf8');
  const modeInjected = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(io);
  const requiredHasBin = /REQUIRED_ENV_KEYS\s*=\s*new Set\(\[[^\]]*HUAWEICLOUD_AGENT_TOOLKIT_MODE[^\]]*HCLOUD_BIN/.test(merge);
  const skipDsh = /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL/.test(up);
  const ok = modeInjected && requiredHasBin && skipDsh;
  return { status: ok ? 'PASS' : 'FAIL', why: '注入 AGENT_TOOLKIT_MODE=' + modeInjected + '，REQUIRED_ENV_KEYS 含 MODE+HCLOUD_BIN=' + requiredHasBin + '，SKIP_DSH 开关=' + skipDsh, result: { modeInjected, requiredHasBin, skipDsh } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
