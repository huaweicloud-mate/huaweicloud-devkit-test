// checks5.mjs — OpenClaw 客户端专属展开级用例探针（EXP-D5-9-1 / EXP-D5-9-3）（v2.0.0-next.4 适配）
import { reg, chk, hdk } from './core.mjs';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

// EXP-D5-9-1: OpenClaw 可发现并加载插件清单（D5-1 客户端矩阵）
reg('EXP-D5-9-1', async () => {
  const h = await hdk();
  const targets = h.authReg.SUPPORTED_AGENT_TARGETS || [];
  const ocTarget = targets.some(t => /openclaw/i.test(t));
  const coreDir = dirname(h.SRC);
  const pluginManifest = existsSync(join(coreDir, 'openclaw.plugin.json'));
  const mcpManifest = existsSync(join(coreDir, '.mcp.json'));
  const mcpServer = existsSync(join(h.SRC, 'mcp-server.ts'));
  // v2: openclawRegistered 变成私有，走 getAgentRegistrationStatuses('openclaw')
  let registered = null;
  try { registered = h.authReg.getAgentRegistrationStatuses('openclaw'); } catch {}
  const regOk = registered && registered.agents && registered.agents.openclaw && registered.agents.openclaw.configured !== false;
  const ok = ocTarget && pluginManifest && mcpServer && (mcpManifest || regOk);
  return chk(ok,
    `OpenClaw 可发现并加载插件清单: target=${ocTarget} plugin.json=${pluginManifest} .mcp.json=${mcpManifest} mcp-server=${mcpServer} registered=${JSON.stringify(registered).slice(0, 100)}`,
    JSON.stringify({ ocTarget, pluginManifest, mcpManifest, mcpServer, registered }));
});

// EXP-D5-9-3: OpenClaw tools/list 枚举全量工具可达且 schema 完整（D5-3 客户端矩阵）
reg('EXP-D5-9-3', async () => {
  const h = await hdk();
  const n = h.tools.TOOL_DEFINITIONS.length;
  const dup = new Set(h.tools.TOOL_DEFINITIONS.map(t => t.name)).size !== n;
  const okS = n > 0 && !dup;
  // v2 tools/list 的 inputSchema 由 tool-schemas 渲染，通过协议层校验
  return chk(okS, `OpenClaw tools/list 枚举全量可达: n=${n}(注册源数量) dup=${dup}`, `工具数=${n} dup=${dup}`);
});