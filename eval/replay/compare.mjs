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
// 【D11-39 范式②】另有一组**文案级**分类（classifyUxText，供 ux-replay.mjs 驱动）：
//   MISLEADING_HINT / INTERNAL_JARGON_LEAK / ENGLISH_RESIDUE / UNCLEAR_NEXT_STEP  -> FAIL（体验退化）
//   PASS 类沿用上面三态（SEMANTIC_EQUIVALENT / MINOR_FORMAT_CHANGE / ORDER_CHANGE）。
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

// ==================== 体验（UX）文案语义分类（D11-39 范式②） ====================
//
// 与上方「工具调用序列」分类并列的**面向用户文案**分类：判「用户可见文案是否退化」。
// 驱动方：eval/replay/ux-replay.mjs（基线 = recordings/ux-baseline-v1.jsonl，录制于夹具断言）。
//
// 口径：PASS 类**沿用既有三态**（PASS_VERDICTS）：与基线语义等价 / 仅格式微差；
//      新增 4 类 FAIL（均属体验退化，会被门禁计入失败）：
//   MISLEADING_HINT       归因把用户带偏：命中误导词组，或（要求给正确根因时）缺正确根因关键词
//   INTERNAL_JARGON_LEAK  面向用户文案出现内部代号（S1/S2/S3、A+ C、UX-R*、cli-domain-id）
//   ENGLISH_RESIDUE       中文语境下残留英文整句
//   UNCLEAR_NEXT_STEP     要求给出下一步时缺失或不可执行（没有命令/动作指引）
//
// 纯函数、无 IO，供 ux-replay.mjs 驱动 + 契约单测直调。

export const UX_VERDICT = {
  MISLEADING_HINT: 'MISLEADING_HINT',
  INTERNAL_JARGON_LEAK: 'INTERNAL_JARGON_LEAK',
  ENGLISH_RESIDUE: 'ENGLISH_RESIDUE',
  UNCLEAR_NEXT_STEP: 'UNCLEAR_NEXT_STEP',
};

// 面向用户文案**不得出现**的内部代号（独立出现才算，避免误伤普通单词）
export const INTERNAL_JARGON_PATTERNS = [
  /(?:^|[^A-Za-z0-9])S[123](?![A-Za-z0-9])/, // S1/S2/S3 来源代号
  /A\+\s?C(?:omponents)?(?![A-Za-z0-9])/, // A+ C 客户端代号
  /\bUX-R\d+\b/, // 内部需求编号
  /\bD\d{1,2}-\d{1,2}\b/, // 内部用例编号
  /\bcli-domain-id\b/, // 实现细节字段
  /\b(?:HUAWEICLOUD_HOME|HW_ACCESS_KEY|HW_SECRET_KEY|HW_SECURITY_TOKEN)\b/, // 环境变量名
];

// 机器字段/机器 token：分类前剥离，避免把「错误码、机器动作名、字段名」误判为文案问题。
// 只剥离**机器字段的值**（错误码 / 字段名 / 动作名等键值对）；
// 反之保留字段名与英文整句 —— cli-domain-id 这类实现细节出现即属内部代号泄漏（须能被 JARGON 判到），
// 英文整句正是 ENGLISH_RESIDUE 的判定对象。
export function stripMachineTokens(text) {
  return String(text ?? '')
    .replace(
      /"(?:code|id|action|source|fingerprint|region|accountType|scenario|tenant|projectId|persistsAfterRestart|affects|effective|selfCheck)"\s*:\s*(?:"[^"]*"|true|false|null|\{[^{}]*\}|\[[^\[\]]*\]|[^,}\s]+)/g,
      '',
    )
    .replace(/\bHDKIT_[A-Z0-9_]+\b/g, '') // 内部错误码（机器标识符，非文案）
}

export function normalizeUxText(text) {
  return stripMachineTokens(text).replace(/\s+/g, ' ').replace(/[\u201c\u201d]/g, '"').trim();
}

const ZH_CHAR = /[\u4e00-\u9fff]/;
// 英文整句：连续英文（含空格/撇号）≥ 6 个词且以句末标点收尾
const EN_SENTENCE = /[A-Za-z][A-Za-z',.-]*(?:\s+[A-Za-z',.-]+){5,}\s*[.!?;]/;
// 可执行下一步：命令形态 or 明确动作指引
const ACTIONABLE =
  /(?:hcloud\s|npx\s|huaweicloud_[a-z_]+|请(?:执行|运行|前往|点击|设置|输入|选择|使用|在)|控制台|帮助文档|文档中心|\/settings)/;

/**
 * 体验文案分类。
 * @param {string} text 待分类文本（夹具断言 actual 拼接后的原始文本）
 * @param {object} rules
 *   baselineText       基线文案（录制值）—— 缺失且未 skipBaselineValidation 时判 BASELINE_INVALID
 *   misleadingPatterns 误导词组（正则或字符串）；命中即 MISLEADING_HINT
 *   requiredKeywords   必须命中的正确根因关键词（任一命中即可）；全未命中判 MISLEADING_HINT
 *   requireAction      是否要求有可执行下一步（true 时无 ACTIONABLE 判 UNCLEAR_NEXT_STEP）
 *   skipBaselineValidation 跳过基线校验（仅在明确无基线时使用）
 * @returns {{verdict: string, reasons: string[], matched: string[]}}
 */
export function classifyUxText(text, rules = {}) {
  const reasons = [];
  const matched = [];
  const raw = String(text ?? '');
  const norm = normalizeUxText(raw);

  if (!rules.skipBaselineValidation && !rules.baselineText) {
    return { verdict: VERDICT.BASELINE_INVALID, reasons: ['基线缺失 baselineText'], matched };
  }

  const hitAny = (patterns) =>
    (patterns || []).filter((p) => (p instanceof RegExp ? p.test(norm) : norm.includes(String(p))));

  // 1) 误导性归因（显式误导词组优先）
  const mis = hitAny(rules.misleadingPatterns);
  if (mis.length) {
    return {
      verdict: UX_VERDICT.MISLEADING_HINT,
      reasons: [`命中误导词组: ${mis.map(String).join(' | ')}`],
      matched: mis.map(String),
    };
  }

  // 2) 内部代号泄漏
  const jargon = INTERNAL_JARGON_PATTERNS.filter((p) => p.test(norm));
  if (jargon.length) {
    return {
      verdict: UX_VERDICT.INTERNAL_JARGON_LEAK,
      reasons: [`文案含内部代号: ${jargon.map(String).join(' | ')}`],
      matched: jargon.map(String),
    };
  }

  // 3) 英文整句残留（中文语境）
  if (ZH_CHAR.test(norm) && EN_SENTENCE.test(norm)) {
    const seg = (norm.match(EN_SENTENCE) || [''])[0];
    return {
      verdict: UX_VERDICT.ENGLISH_RESIDUE,
      reasons: [`中文语境残留英文整句: ${seg.slice(0, 80)}`],
      matched: [seg.slice(0, 80)],
    };
  }

  // 4) 下一步不可执行
  if (rules.requireAction && !ACTIONABLE.test(norm)) {
    return {
      verdict: UX_VERDICT.UNCLEAR_NEXT_STEP,
      reasons: ['未给出可执行的下一步（无命令/动作指引）'],
      matched,
    };
  }

  // 5) 正确根因缺失（要求给根因却一条都没命中）
  if (Array.isArray(rules.requiredKeywords) && rules.requiredKeywords.length) {
    const hit = hitAny(rules.requiredKeywords);
    if (!hit.length) {
      return {
        verdict: UX_VERDICT.MISLEADING_HINT,
        reasons: [`未指向正确根因（未命中: ${rules.requiredKeywords.map(String).join(' | ')}）`],
        matched,
      };
    }
    matched.push(...hit.map(String));
  }

  // 6) 与基线对照（PASS 类）
  const baselineNorm = normalizeUxText(rules.baselineText);
  if (norm === baselineNorm) {
    return { verdict: VERDICT.SEMANTIC_EQUIVALENT, reasons: ['与基线文案一致'], matched };
  }
  const sameShape =
    norm.length > 0 && Math.abs(norm.length - baselineNorm.length) <= Math.max(8, baselineNorm.length * 0.1);
  return {
    verdict: VERDICT.MINOR_FORMAT_CHANGE,
    reasons: [sameShape ? '与基线仅格式微差（建议更新基线）' : '与基线文案不同但无退化特征（建议更新基线）'],
    matched,
  };
}

/** 体验分类是否通过（复用既有 PASS_VERDICTS：三个 PASS 类之一即通过）。 */
export function isUxPass(verdict) {
  return PASS_VERDICTS.has(verdict);
}
