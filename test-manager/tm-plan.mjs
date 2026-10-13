// tm-plan.mjs — AI Test Manager 决策引擎（含纯函数逻辑，可单测）
//
// 实现 test-ai-orchestration-architecture.md §2.2 决策引擎的确定性部分：
//   impactAnalysis → riskLevel → strategy → missions
// 输入（纯数据，不读仓库）：
//   changeScope: { changedFiles: string[], changedTools?: string[], version?: string }
// 输出：
//   { strategy, missions, affectedDimensions }
//
// 使命格式对齐 test-ai-orchestration-architecture.md §四 missions/*.yaml 结构
// （missionId/domain/scope/constraints/qualityCriteria/affectedTools）。

import { DIMENSION_LABELS, MODULE_DIMENSIONS, TOOL_DIMENSIONS, RISK_POLICY, normalizeModuleName } from './module-map.mjs';

const MODULE_INDEX = (() => {
  const idx = new Map();
  for (const row of MODULE_DIMENSIONS) {
    for (const m of row.modules) idx.set(m, row);
  }
  return idx;
})();

// 变更文件 → 命中维度（模块名归一化后查表）
export function analyzeImpact({ changedFiles = [], changedTools = [] } = {}) {
  const dims = new Map(); // dim -> { risk, note, casesSet, modules }
  for (const file of changedFiles) {
    for (const norm of normalizeModuleName(file)) {
      const row = MODULE_INDEX.get(norm);
      if (!row) continue;
      const cur = dims.get(row.dim) || {
        dim: row.dim,
        risk: row.risk,
        note: row.note,
        modules: new Set(),
        cases: new Set(row.cases),
      };
      cur.modules.add(norm);
      dims.set(row.dim, cur);
    }
  }
  for (const tool of changedTools) {
    const dim = TOOL_DIMENSIONS[tool];
    if (!dim) continue;
    const row = MODULE_DIMENSIONS.find((r) => r.dim === dim);
    const cur = dims.get(dim) || { dim, risk: row?.risk || 'medium', note: row?.note || '', modules: new Set(), cases: new Set(row?.cases || []) };
    cur.modules.add(`tool:${tool}`);
    dims.set(dim, cur);
  }
  return {
    affectedDimensions: [...dims.values()].map((d) => ({
      dim: d.dim,
      label: DIMENSION_LABELS[d.dim] || d.dim,
      risk: d.risk,
      note: d.note,
      modules: [...d.modules],
      cases: [...d.cases],
    })),
  };
}

// 风险聚合：任一 high → high；否则任一 medium → medium；否则 low
export function aggregateRisk(dimensions) {
  if (dimensions.some((d) => d.risk === 'high')) return 'high';
  if (dimensions.some((d) => d.risk === 'medium')) return 'medium';
  return 'low';
}

// 生成测试策略（对齐 §2.2 Step 3 的 test-strategy.yaml 内容结构）
export function generateStrategy({ version, changeScope }) {
  const { affectedDimensions } = analyzeImpact(changeScope);
  const risk = aggregateRisk(affectedDimensions);
  const policy = RISK_POLICY[risk];
  const totalCases = affectedDimensions.reduce((a, d) => a + d.cases.length, 0);
  return {
    version: version || 'unversioned',
    date: new Date().toISOString().slice(0, 10),
    risk,
    riskNote: policy.note,
    affectedDimensions,
    recommended: {
      mustRunDimensions: affectedDimensions.map((d) => d.dim),
      mustRunCaseCount: totalCases,
      fullSuite: policy.fullSuite,
      skip: policy.skip,
      fixedBaselines: risk === 'high' ? ['D4 全量', 'D9 全量'] : [],
    },
    fixedBaselines: risk === 'high' ? ['D4安全全量', 'D9协议全量'] : ['安装闭环冒烟'],
  };
}

// 生成使命清单（对齐 §四 missions/*.yaml：missionId/domain/scope/...）
export function generateMissions({ strategy }) {
  return strategy.affectedDimensions.map((d, i) => ({
    missionId: `mission-${String(i + 1).padStart(3, '0')}`,
    domain: d.label,
    priority: d.risk === 'high' ? 'P0' : d.risk === 'medium' ? 'P1' : 'P2',
    scope: `${d.label} 回归：源码变更命中 ${d.modules.join(',')} (${d.note})`,
    affectedTools: d.modules.filter((m) => m.startsWith('tool:')).map((m) => m.slice(5)),
    qualityCriteria: [
      `${d.cases.length} 条相关用例全部执行，P0 不得 NOT_RUN`,
      '输出不得包含 AK/SK/token 明文',
      'FAIL/SPEC 需记根因(文件:行号)',
    ],
    affectedCases: d.cases,
    estimatedDuration: d.risk === 'high' ? '30m' : d.risk === 'medium' ? '15m' : '5m',
  }));
}

// 一站式整定（供 CLI / CI / 单测入口）
export function planTestRun({ version, changeScope }) {
  const strategy = generateStrategy({ version, changeScope });
  const missions = generateMissions({ strategy });
  return { strategy, missions };
}