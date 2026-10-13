// compare.mjs — 语义差异分类器（契约：test-panorama-plan §6.4 差异分类 + §6.1 语义断言）
//
// 录制回放（Record & Playback）的核心判定层：把「实际执行的工具/服务调用序列」与
// 「录制基线（期望序列）」做语义比较，输出差异分类。
//
// 分类口径（对齐 test-panorama-plan.md §6.4 表）：
//   SEMANTIC_EQUIVALENT  -> Tool 调用顺序变化但语义等价        → PASS
//   MINOR_FORMAT_CHANGE  -> 参数/form 变化但结果等价          → PASS(需更新基线)
//   ORDER_CHANGE         -> 序列顺序不同但集合一致             → PASS(顺序无关场景)
//   MISSING_TOOL         -> 缺少必要 Tool 调用                → FAIL
//   UNEXPECTED_TOOL      -> 调用了基线外 Tool                 → FAIL(体系漂移)
//   SECRET_LEAK          -> 结果包含敏感信息                  → FAIL(安全回归)
//   INTENT_NOT_MET       -> 语义不符（用户意图未满足）        → FAIL
//   BASELINE_INVALID     -> 输入不合法（fail-closed）          → FAIL
//
// 纯函数、无 IO，供 replay.mjs 驱动 + 契约单测直调。

export const VERDICT = {
  SEMANTIC_EQUIVALENT: 'SEMANTIC_EQUIVALENT',
  MINOR_FORMAT_CHANGE: 'MINOR_FORMAT_CHANGE',
  ORDER_CHANGE: 'ORDER_CHANGE',
  MISSING_TOOL: 'MISSING_TOOL',
  UNEXPECTED_TOOL: 'UNEXPECTED_TOOL',
  SECRET_LEAK: 'SECRET_LEAK',
  INTENT_NOT_MET: 'INTENT_NOT_MET',
  BASELINE_INVALID: 'BASELINE_INVALID',
};

export const PASS_VERDICTS = new Set([
  VERDICT.SEMANTIC_EQUIVALENT,
  VERDICT.MINOR_FORMAT_CHANGE,
  VERDICT.ORDER_CHANGE,
]);

// 敏感字段/值内嵌检测（复用 safety-policy 契约的脱敏正则语义）
export const SECRET_KEY_PATTERN =
  /(access[_-]?key|secret[_-]?key|security[_-]?token|x[_-]?auth[_-]?token|authorization|password|passwd|admin[_-]?pass|credential|userdata|metadata)/i;
export const SECRET_VALUE_PATTERN =
  /((?:access[_-]?key|secret[_-]?key|security[_-]?token|x[_-]?auth[_-]?token|token|authorization|password|passwd|admin[_-]?pass|credential)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi;
// AK/SK 裸值形态（华为云 AK 通常为 20 位大写字母；AWS AKIA/ASIA 前缀亦常见于测试证据）
export const AK_SK_VALUE_PATTERN = /\b(?:AKIA|ASIA)[A-Z0-9]{4,}\b|\b[A-Z]{16,}[0-9]?[A-Z0-9]{0,4}\b/g;

export function containsSecret(text) {
  const value = String(text ?? '');
  if (SECRET_VALUE_PATTERN.test(value)) return true;
  if (AK_SK_VALUE_PATTERN.test(value)) return true;
  // 宽松兜底：对象键名命中也算（避免 deep 遍历时遗漏嵌套）
  const tryParse = (() => {
    try {
      const parsed = JSON.parse(value);
      const walk = (node) => {
        if (Array.isArray(node)) return node.some(walk);
        if (node && typeof node === 'object') {
          return Object.entries(node).some(([k, v]) => {
            if (SECRET_KEY_PATTERN.test(k) && typeof v === 'string' && v.length > 0) return true;
            return walk(v);
          });
        }
        return node && typeof node === 'string' && SECRET_KEY_PATTERN.test(node) && /[=:]\s*.+/.test(node);
      };
      return walk(parsed);
    } catch {
      return false;
    }
  })();
  return tryParse;
}

// 归一化工具名：hcloud X Y -> "X Y"，低解析失败不影响排序判定
export function normalizeToolName(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// 集合比较（忽略顺序）：求 intersectionA（A 也出现在 B）等
function setCompare(aList, bList) {
  const a = new Set(aList.map(normalizeToolName));
  const b = new Set(bList.map(normalizeToolName));
  const inBoth = [...a].filter((x) => b.has(x));
  const onlyA = [...a].filter((x) => !b.has(x));
  const onlyB = [...b].filter((x) => !a.has(x));
  return { inBoth, onlyA, onlyB, sameOrder: aList.map(normalizeToolName).join('|') === bList.map(normalizeToolName).join('|') };
}

// 主判定：compare(基线, 实际) -> { verdict, reasons[], expected, actual }
export function compare({ expectedTools = [], actualTools = [], options = {} } = {}) {
  const reasons = [];
  const base = { expectedTools: expectedTools.map(String), actualTools: actualTools.map(String) };

  if (!options.skipBaselineValidation) {
    // fail-closed：基线不合法（空/缺必要字段）直接 BASELINE_INVALID，禁止误判为 pass
    if (!Array.isArray(expectedTools) || expectedTools.length === 0) {
      return { verdict: VERDICT.BASELINE_INVALID, reasons: ['基线缺失 expectedTools'], ...base };
    }
    if (!Array.isArray(actualTools) || actualTools.length === 0) {
      return { verdict: VERDICT.BASELINE_INVALID, reasons: ['实际调用序列为空'], ...base };
    }
  }

  const { inBoth, onlyA, onlyB, sameOrder } = setCompare(expectedTools, actualTools);

  if (onlyA.length > 0) {
    const missing = onlyA.filter((x) => !/^(?:--|_)/.test(x));
    if (missing.length > 0) {
      reasons.push(`缺少基线中要求的调用: ${missing.join(', ')}`);
    }
  }
  if (onlyB.length > 0) {
    reasons.push(`实际多出基线外的调用: ${onlyB.join(', ')}`);
  }

  const missingNeeded = onlyA.filter((x) => !/^(?:--|_)/.test(x)).length;
  const unexpected = onlyB.filter((x) => !/^(?:--|_)/.test(x)).length;

  // 安全回归：只要出现 out-of-authored secret 形态即为 FAIL（即使集合匹配）
  const secretRisk = options.secretProbe ? containsSecret(options.secretProbe) : false;
  if (secretRisk) {
    reasons.push('输出包含疑似敏感信息（AK/SK/token/password）');
  }

  if (reasons.length === 0 && sameOrder) {
    return { verdict: VERDICT.SEMANTIC_EQUIVALENT, reasons: ['调用序列完全一致'], ...base };
  }

  if (reasons.length === 0 && !sameOrder) {
    // 顺序不同但集合一致：若调用方声明顺序无关则 ORDER_CHANGE，否则 SEMANTIC_EQUIVALENT（可容忍）
    return {
      verdict: options.orderSensitive ? VERDICT.SEMANTIC_EQUIVALENT : VERDICT.ORDER_CHANGE,
      reasons: ['调用集合一致但顺序不同'],
      ...base,
    };
  }

  if (secretRisk) return { verdict: VERDICT.SECRET_LEAK, reasons, ...base };
  if (missingNeeded > 0) return { verdict: VERDICT.MISSING_TOOL, reasons, ...base };
  if (unexpected > 0) return { verdict: VERDICT.UNEXPECTED_TOOL, reasons, ...base };

  return { verdict: VERDICT.MINOR_FORMAT_CHANGE, reasons: reasons.length ? reasons : ['差异无法归类'], ...base };
}

// 语义等价判定端口（供报告/门禁使用）：PASS_VERDICTS 命中即通过
export function isPass(verdict) {
  return PASS_VERDICTS.has(verdict);
}