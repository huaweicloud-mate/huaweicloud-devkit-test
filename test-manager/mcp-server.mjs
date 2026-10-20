#!/usr/bin/env node
// mcp-server.mjs — AI Test Manager 决策引擎的 MCP 包装（stdio · Content-Length 帧）
//
// 背景（docs/test-ai-orchestration-architecture.md §六）：决策引擎原为"独立运行 + CLI
// （run-plan.mjs）"，arch 对照表登记为 🔶「MCP 包装待建」。本文件补齐该包装 —— 把纯函数
// 能力暴露为 MCP 工具，使任意 MCP 客户端（agent / 编排器）能在会话内直接取策略与使命，
// 不必先落盘再读文件。
//
// 设计约束（对齐本仓纪律）：
// - 零依赖：不引入 @modelcontextprotocol/sdk；帧协议与仓内既有 client 同源
//   （skill-bench/harness/mcp-client.mjs / eval/harness/run-eval.mjs 的 Content-Length 帧）。
// - 纯 stdio：stdout **只**输出协议帧，任何诊断信息走 stderr —— 帧污染会让客户端解析失败。
// - fail-closed 且不崩：解析错误 -32700 / 未知方法 -32601 / 参数非法 -32602 / 内部错误 -32603；
//   畸形帧不终止进程。（这些正是我们上报给 SUT 的缺陷类型，自身不得复现。）
// - 无状态：服务端不缓存、不注入时间戳或随机量；工具输出即引擎纯函数结果
//   （引擎自带 `date` 字段，同日内稳定，跨日比对需忽略它）。
//
// 复跑自检：node test-manager/mcp-server.mjs --selftest
import {
  analyzeImpact,
  aggregateRisk,
  generateStrategy,
  generateMissions,
  planTestRun,
} from './tm-plan.mjs';

const PROTOCOL_VERSION = '2024-11-05'; // 与 SUT 侧 MCP 基线一致（见 D9-4 用例）
const SERVER_INFO = { name: 'devkit-test-manager', version: '1.0.0' };

const log = (...a) => process.stderr.write(a.join(' ') + '\n'); // 只能走 stderr

class InvalidParams extends Error {}

function normScope(changeScope) {
  if (changeScope === undefined || changeScope === null) return { changedFiles: [], changedTools: [] };
  if (typeof changeScope !== 'object' || Array.isArray(changeScope)) {
    throw new InvalidParams('changeScope 必须是对象：{ changedFiles?: string[], changedTools?: string[] }');
  }
  const { changedFiles = [], changedTools = [] } = changeScope;
  for (const [k, v] of Object.entries({ changedFiles, changedTools })) {
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
      throw new InvalidParams(`${k} 必须是字符串数组`);
    }
  }
  return { changedFiles, changedTools };
}

function impactOf(changeScope) {
  const scope = normScope(changeScope);
  const { affectedDimensions } = analyzeImpact(scope);
  return {
    risk: aggregateRisk(affectedDimensions),
    affectedDimensions,
    caseCount: affectedDimensions.reduce((a, d) => a + (d.cases?.length ?? 0), 0),
    changedFileCount: scope.changedFiles.length + scope.changedTools.length,
  };
}

const TOOLS = [
  {
    name: 'tm_analyze_impact',
    description:
      '影响域分析（Layer 1）：按变更的源码模块/工具名，命中受影响的测试维度（D1~D10）并给出风险等级与代表性用例。',
    inputSchema: {
      type: 'object',
      properties: {
        changeScope: {
          type: 'object',
          description: '变更范围',
          properties: {
            changedFiles: { type: 'array', items: { type: 'string' }, description: '变更的源码文件（可为相对路径或模块名）' },
            changedTools: { type: 'array', items: { type: 'string' }, description: '变更的 MCP 工具名' },
          },
        },
      },
    },
    handler: ({ changeScope }) => impactOf(changeScope),
  },
  {
    name: 'tm_generate_strategy',
    description:
      '生成测试策略（Layer 1）：风险定级 + 受影响维度 + 推荐执行范围 + 固定安全基线（对齐 §2.2 的 test-strategy 结构）。',
    inputSchema: {
      type: 'object',
      properties: {
        version: { type: 'string', description: '被测版本，如 v1.1.9-next.0（缺省 unspecified）' },
        changeScope: { type: 'object', description: '变更范围 { changedFiles?, changedTools? }' },
      },
    },
    handler: ({ version = 'unspecified', changeScope }) => generateStrategy({ version, changeScope: normScope(changeScope) }),
  },
  {
    name: 'tm_generate_missions',
    description:
      '生成使命清单（Layer 2）：每个受影响维度一个 mission（missionId/domain/scope/affectedTools/criteria），供 Worker Agent 自主展开用例。',
    inputSchema: {
      type: 'object',
      properties: {
        version: { type: 'string', description: '被测版本（缺省 unspecified）' },
        changeScope: { type: 'object', description: '变更范围 { changedFiles?, changedTools? }' },
      },
    },
    handler: ({ version = 'unspecified', changeScope }) =>
      generateMissions({ strategy: generateStrategy({ version, changeScope: normScope(changeScope) }) }),
  },
  {
    name: 'tm_plan_test_run',
    description: '一站式：策略 + 使命一次返回（等价 CLI planTestRun），供编排器单次调用取全量决策结果。',
    inputSchema: {
      type: 'object',
      properties: {
        version: { type: 'string', description: '被测版本（缺省 unspecified）' },
        changeScope: { type: 'object', description: '变更范围 { changedFiles?, changedTools? }' },
      },
    },
    handler: ({ version = 'unspecified', changeScope }) => planTestRun({ version, changeScope: normScope(changeScope) }),
  },
];

function send(obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  process.stdout.write(Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'ascii'), body]));
}

const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

function handle(msg) {
  const { id, method, params } = msg ?? {};
  const notification = id === undefined || id === null; // 通知无 id，不得回包
  try {
    switch (method) {
      case 'initialize':
        if (notification) return;
        return reply(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });
      case 'notifications/initialized':
        return;
      case 'ping':
        return notification ? undefined : reply(id, {});
      case 'tools/list':
        return notification ? undefined : reply(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
      case 'tools/call': {
        if (notification) return;
        const { name, arguments: args } = params ?? {};
        const tool = TOOLS.find((t) => t.name === name);
        if (!tool) return fail(id, -32602, `Unknown tool: ${name}`);
        try {
          const out = tool.handler(args ?? {});
          return reply(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], isError: false });
        } catch (e) {
          // 工具内部失败 = 业务错误（isError=true），不是协议错误
          log(`tool ${name} failed: ${e.message}`);
          return reply(id, { content: [{ type: 'text', text: `调用失败：${e.message}` }], isError: true });
        }
      }
      default:
        return notification ? undefined : fail(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    if (!notification) fail(id, -32603, `Internal error: ${e.message}`);
  }
}

function main() {
  if (process.argv.includes('--selftest')) {
    const impact = impactOf({ changedFiles: ['safety-policy.mjs'] });
    const missions = TOOLS.find((t) => t.name === 'tm_generate_missions').handler({
      version: 'selftest',
      changeScope: { changedFiles: ['safety-policy.mjs'] },
    });
    log(`selftest: risk=${impact.risk} dims=${impact.affectedDimensions.map((d) => d.dim).join(',')} missions=${missions.length}`);
    log(`selftest: tools=${TOOLS.length} 协议=${PROTOCOL_VERSION}`);
    process.exit(impact.risk === 'high' && missions.length > 0 ? 0 : 1);
  }

  let buf = Buffer.alloc(0);
  process.stdin.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString('utf8'));
      if (!m) {
        buf = buf.slice(h + 4); // 无长度头：丢帧但保持存活
        continue;
      }
      const n = Number(m[1]);
      if (buf.length < h + 4 + n) break; // 帧未收全，等下一块
      const body = buf.slice(h + 4, h + 4 + n).toString('utf8');
      buf = buf.slice(h + 4 + n);
      let msg;
      try {
        msg = JSON.parse(body);
      } catch {
        fail(null, -32700, 'Parse error'); // 不崩，回错误码后继续
        continue;
      }
      handle(msg);
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

main();