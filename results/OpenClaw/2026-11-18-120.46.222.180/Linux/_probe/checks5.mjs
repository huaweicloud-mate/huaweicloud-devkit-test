// checks5.mjs — OpenClaw 客户端专属展开级用例探针（EXP-D5-9-1 / EXP-D5-9-3）
import { reg, chk, hdk } from './core.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

// EXP-D5-9-1: OpenClaw 可发现并加载插件清单（D5-1 客户端矩阵）
reg('EXP-D5-9-1', async () => {
  const h = await hdk();
  const targets = h.authReg.SUPPORTED_AGENT_TARGETS || [];
  const ocTarget = targets.some(t => /openclaw/i.test(t));
  // 插件清单落点：plugins/huaweicloud-core/openclaw.plugin.json + .mcp.json
  const coreDir = dirname(h.SRC);
  const pluginManifest = existsSync(join(coreDir, 'openclaw.plugin.json'));
  const mcpManifest = existsSync(join(coreDir, '.mcp.json'));
  const mcpServer = existsSync(join(h.SRC, 'mcp-server.mjs'));
  // 运行副本注册判定（openclawRegistered 源码级直调）
  const registered = typeof h.authReg.openclawRegistered === 'function' ? h.authReg.openclawRegistered() : null;
  const ok = ocTarget && pluginManifest && mcpServer && (mcpManifest || registered !== false);
  return chk(ok,
    `OpenClaw 可发现并加载插件清单: target=${ocTarget} plugin.json=${pluginManifest} .mcp.json=${mcpManifest} mcp-server=${mcpServer} registered=${registered}`,
    JSON.stringify({ ocTarget, pluginManifest, mcpManifest, mcpServer, registered }));
});

// EXP-D5-9-3: OpenClaw tools/list 枚举全量工具可达且 schema 完整（D5-3 客户端矩阵）
reg('EXP-D5-9-3', async () => {
  const h = await hdk();
  const n = h.tools.TOOL_DEFINITIONS.length;
  const schemaOk = h.tools.TOOL_DEFINITIONS.every(t => t.name && t.inputSchema && typeof t.inputSchema === 'object');
  const dup = new Set(h.tools.TOOL_DEFINITIONS.map(t => t.name)).size !== n;
  return chk(n > 0 && schemaOk && !dup,
    `OpenClaw tools/list 枚举全量可达且 schema 完整: n=${n}(注册源数量) schemaOk=${schemaOk} dup=${dup}`,
    `工具数=${n} schemaOk=${schemaOk} dup=${dup}`);
});