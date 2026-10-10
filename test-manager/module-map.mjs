// module-map.mjs — 源码模块 ↔ 测试维度 / 风险级 / 代表性用例 映射表
//
// AI Test Manager（test-ai-orchestration-architecture.md §2.1）决策引擎的核心数据：
// 变更影响域分析 = changedFiles → 命中模块 → 该维度用例集。
//
// 维度编号对齐 test-cases README：D1安装/D2认证/D3功能/D4安全/D5客户端/D6性能/D7兼容/
// D8质量/D9协议/D10评测。

export const DIMENSION_LABELS = {
  D1: 'D1 安装与生命周期',
  D2: 'D2 认证与凭证',
  D3: 'D3 功能覆盖',
  D4: 'D4 安全与风险护栏',
  D5: 'D5 多Agent客户端矩阵',
  D6: 'D6 性能与可靠性',
  D7: 'D7 兼容性跨平台',
  D8: 'D8 可观测性/文档质量',
  D9: 'D9 MCP协议合规',
  D10: 'D10 Agent行为评测',
};

// 模块 → 维度 + 风险级 + 典型用例
// 变更命中任一模块即触发对应维度的测试回归
export const MODULE_DIMENSIONS = [
  { dim: 'D1', risk: 'medium', modules: ['setup-cli', 'update-check'], cases: ['D1-1', 'D1-2', 'D1-3', 'D1-5'], note: '安装/升级/卸载生命周期' },
  { dim: 'D2', risk: 'high', modules: ['auth', 'credentials', 'reconcile', 'project-id', 'agent-registration'], cases: ['D2-1', 'D2-2', 'D2-3', 'D2-4', 'D2-5', 'D2-26'], note: '凭证读写/同步/脱敏，涉密必须重点回归' },
  { dim: 'D3', risk: 'low', modules: ['tools', 'detect-framework', 'search-market', 'icon-library', 'hcloud-cli', 'mcp-config-merge', 'mcp-config-backup'], cases: ['D3-A1', 'D3-B1', 'D3-B2', 'D3-B3', 'D3-B5', 'D3-B6'], note: '功能路由/命令规划/能力发现' },
  { dim: 'D4', risk: 'high', modules: ['safety-policy', 'risk-rule-engine', 'hooks'], cases: ['D4-1', 'D4-2', 'D4-4', 'D4-5', 'D4-7', 'D4-15', 'D4-16', 'D4-25', 'D4-27'], note: '安全策略/风险规则/拦截，P0 必测、禁剪枝' },
  { dim: 'D5', risk: 'medium', modules: ['officeace-paths', 'setup-cli', 'mcp-config-merge'], cases: ['D5-1', 'D5-2', 'D5-3', 'D5-4'], note: '客户端适配矩阵' },
  { dim: 'D6', risk: 'low', modules: ['session-manager', 'ws-exec', 'hdkitservice-api', 'hwlink-api'], cases: ['D6-1', 'D6-3', 'D6-4', 'D6-5', 'D6-9'], note: '性能/并发/大对象' },
  { dim: 'D7', risk: 'medium', modules: ['setup-cli', 'mcp-server'], cases: ['D7-1', 'D7-2', 'D7-3', 'D7-4', 'D7-5'], note: '跨平台/跨Node版本/共存' },
  { dim: 'D8', risk: 'low', modules: ['telemetry', 'agent-registry', 'mcp-config-backup', 'mcp-config-merge'], cases: ['D8-1', 'D8-2', 'D8-3', 'D8-9', 'D8-10'], note: '遥测/配置备份合并/文档一致性' },
  { dim: 'D9', risk: 'high', modules: ['mcp-server', 'mcp-server-remote', 'mcp-protocol'], cases: ['D9-1', 'D9-2', 'D9-3', 'D9-4', 'D9-5', 'D9-6', 'D9-10', 'D9-11'], note: 'MCP 协议合规，禁剪枝' },
  { dim: 'D10', risk: 'medium', modules: ['tools', 'mcp-server'], cases: ['EXP-E01', 'EXP-E03', 'EXP-E08', 'EXP-E15'], note: 'serviceCatalog 路由/Agent 行为评测' },
];

// 工具名（MCP）→ 维度 映射（变更工具清单时使用）
export const TOOL_DIMENSIONS = {
  huaweicloud_sandbox_connect: 'D6',
  huaweicloud_sandbox_credentials: 'D6',
  huaweicloud_sandbox_exec_one_shot: 'D6',
  huaweicloud_plan_cli_command: 'D3',
  huaweicloud_run_readonly_command: 'D3',
  huaweicloud_service_catalog: 'D3',
  huaweicloud_hook_check_command: 'D4',
  huaweicloud_hook_check_artifacts: 'D4',
  huaweicloud_hook_check_deploy_plan: 'D4',
  huaweicloud_auth_sync: 'D2',
  huaweicloud_auth_init: 'D2',
  huaweicloud_check_update: 'D1',
  huaweicloud_upgrade: 'D1',
};

// 风险级 → 必测集策略
export const RISK_POLICY = {
  high: { mustRun: true, fullSuite: true, skip: [], note: '高安全风险：全量回归，P0 禁 NOT_RUN，禁剪枝' },
  medium: { mustRun: true, fullSuite: false, skip: [], note: '中风险：该维度用例全跑，涉其它维度抽测' },
  low: { mustRun: false, fullSuite: false, skip: ['性能长耗时用例'], note: '低风险：冒烟 + 变更直接相关用例' },
};

export function normalizeModuleName(relPath) {
  // 相对源码 src 的路径 → 模块短名：取首段（子目录展开为顶层模块）
  const p = String(relPath).replace(/\\/g, '/').replace(/^plugins\/huaweicloud-core\/src\//, '').replace(/\.mjs$/, '');
  const parts = p.split('/');
  if (parts.length === 1) return parts[0];
  // 子目录模块（auth/credentials → auth）映射到父模块；若父模块不在表内则用全名匹配模块表条目
  return parts[0];
}