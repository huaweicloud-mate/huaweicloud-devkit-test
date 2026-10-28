/**
 * v2 shim：mcp-protocol.mjs → v2 dist/mcp-protocol.js
 *
 * v1 的 `dispatch`（方法分派：initialize / tools/list / tools/call）在 v2 被删除，
 * 重构为 createDevkitMcpServer / normalizeToolCallParams 等工厂函数（v2 full 报告 FINDINGS #2）。
 * 夹具 d11-27 依赖 `dispatch('tools/call', ...)` 走完整 MCP 包装面做「中文摘要输出可读」断言，
 * 这里提供最小等价实现，复现 v1 dispatch 的 tools/list · tools/call · initialize 三路语义，
 * 其余协议装饰函数（_decorateResult / _isHintConsumed / _resetHintConsumption）直接桥接 v2 同名实现。
 */
import { load } from './_loader.mjs';

const p = await load('mcp-protocol.js');
const t = await load('tools.js');

export const _decorateResult = p._decorateResult;
export const _isHintConsumed = p._isHintConsumed;
export const _resetHintConsumption = p._resetHintConsumption;

export async function dispatch(method, params = {}, opts = {}) {
  const sessionId = opts?.sessionId || 'default';
  if (method === 'initialize') {
    return {
      protocolVersion: params.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'huaweicloud-devkit', version: '2.0.0' },
    };
  }

  if (method === 'tools/list') {
    return { tools: t.TOOL_DEFINITIONS };
  }

  if (method === 'tools/call') {
    const tool = t.TOOL_DEFINITIONS.find((x) => x.name === params.name);
    if (!tool) {
      const unknownToolError = new Error(`Unknown tool: ${params.name}`);
      unknownToolError.code = -32602;
      throw unknownToolError;
    }
    const missing = (tool.inputSchema?.required || []).filter(
      (key) => !params.arguments || !Object.hasOwn(params.arguments, key),
    );
    if (missing.length > 0) {
      const invalidParamsError = new Error(
        `Invalid params: missing required field(s) ${missing
          .map((key) => JSON.stringify(key))
          .join(', ')} for tool "${params.name}".`,
      );
      invalidParamsError.code = -32602;
      throw invalidParamsError;
    }
    const result = await t.callTool(params.name, params.arguments || {});
    const decorated = p._decorateResult(sessionId, params.name, result);
    return { content: [{ type: 'text', text: JSON.stringify(decorated, null, 2) }], isError: false };
  }

  throw new Error(`[v2shim] dispatch: unsupported method ${method}`);
}