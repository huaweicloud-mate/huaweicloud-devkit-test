// tm-impact-llm.mjs — LLM 影响域分析（架构 §2.2 目标态）+ 确定性回退
//
// 现状：`tm-plan.analyzeImpact` 是**确定性**的（module-map 模块映射表驱动）—— 覆盖不到
// 映射表之外的新模块。本模块提供 LLM 路径，并且**永远有确定性回退**：
// LLM 不可用 / 输出不合法 / 超时 → 回退 module-map，绝不因 LLM 故障阻断流水线。
//
// 配置（环境变量，不硬编码）：
//   TM_LLM_ENDPOINT  OpenAI 兼容 base url（如 https://api.example.com/v1）
//   TM_LLM_API_KEY
//   TM_LLM_MODEL     （默认 deepseek-v4-flash）
//
// 校验纪律：LLM 输出必须通过「维度 ∈ D1~D10 + 风险 ∈ low/medium/high」校验，任一不合法
// 即整体判不可信 → 回退（防止 LLM 编造维度污染 mission 生成）。

import { DIMENSION_LABELS, MODULE_DIMENSIONS } from './module-map.mjs';
import { analyzeImpact, aggregateRisk } from './tm-plan.mjs';

export const ANALYZER = { RULES: 'rules', LLM: 'llm', AUTO: 'auto' };
const RISKS = ['low', 'medium', 'high'];

/** 从任意文本里取**第一个平衡的 JSON 对象**（容忍 ```json 围栏与前后说明文字）。 */
export function extractFirstJson(text) {
  const s = String(text ?? '');
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i += 1) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

export function buildImpactPrompt({ changedFiles = [], changedTools = [], diffText = '' } = {}) {
  const dims = Object.entries(DIMENSION_LABELS).map(([k, v]) => `${k}: ${v}`).join('\n');
  const parts = [
    '你是 huaweicloud-devkit 测试经理。分析本次源码变更的**影响域**，只输出 JSON，不要多余文字。',
    '',
    '可选测试维度（只能从下列键中选，不得编造）：',
    dims,
    '',
  ];
  if (changedFiles.length) parts.push('变更文件：', ...changedFiles.map((f) => `- ${f}`), '');
  if (changedTools.length) parts.push('变更工具：', ...changedTools.map((t) => `- ${t}`), '');
  if (diffText) parts.push('变更摘要：', '```', String(diffText).slice(0, 4000), '```', '');
  parts.push(
    '输出格式：',
    '{"dimensions":[{"dim":"D4","risk":"high","reason":"为什么命中"}],"risk":"high","notes":"补充说明"}',
  );
  return parts.join('\n');
}

/** 解析并校验 LLM 输出；不合法返回 null（调用方据此回退）。 */
export function parseImpactResponse(text) {
  const json = extractFirstJson(text);
  if (!json) return null;
  let obj;
  try {
    obj = JSON.parse(json);
  } catch {
    return null;
  }
  const rawDims = Array.isArray(obj?.dimensions) ? obj.dimensions : [];
  const dimensions = [];
  for (const d of rawDims) {
    const dim = String(d?.dim ?? '').toUpperCase();
    if (!DIMENSION_LABELS[dim]) return null; // 编造维度 → 整体不可信
    const risk = String(d?.risk ?? '').toLowerCase();
    if (!RISKS.includes(risk)) return null;
    dimensions.push({ dim, risk, reason: String(d?.reason ?? '') });
  }
  if (!dimensions.length) return null;
  const risk = obj?.risk == null ? null : String(obj.risk).toLowerCase();
  if (risk !== null && !RISKS.includes(risk)) return null;
  return { dimensions, risk, notes: String(obj?.notes ?? '') };
}

/**
 * 调 LLM 做影响域分析。失败一律 throw（由 analyzeImpactAuto 兜底回退）。
 * opts.fetchImpl 可注入（单测用 mock）。
 */
export async function analyzeImpactLLM(scope, opts = {}) {
  const {
    endpoint = process.env.TM_LLM_ENDPOINT,
    apiKey = process.env.TM_LLM_API_KEY,
    model = process.env.TM_LLM_MODEL || 'deepseek-v4-flash',
    fetchImpl = globalThis.fetch,
    timeoutMs = 30000,
    diffText = '',
  } = opts;

  if (!endpoint || !apiKey) throw new Error('缺 LLM 配置（TM_LLM_ENDPOINT / TM_LLM_API_KEY）');
  if (typeof fetchImpl !== 'function') throw new Error('运行环境无 fetch');

  const prompt = buildImpactPrompt({ ...scope, diffText });
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try {
    const res = await fetchImpl(`${String(endpoint).replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0 }),
      ...(ctl ? { signal: ctl.signal } : {}),
    });
    if (!res || res.ok !== true) throw new Error(`LLM HTTP ${res ? res.status : 'no-response'}`);
    const data = await res.json();
    const parsed = parseImpactResponse(data?.choices?.[0]?.message?.content ?? '');
    if (!parsed) throw new Error('LLM 输出不合法（维度/风险校验未通过）');
    // LLM 只决定「哪些维度受影响」；模块/用例仍取确定性映射表（真源），
    // 映射表没有的维度留空并标注来源 —— 保证 mission 生成不依赖 LLM 编造数据。
    const byDim = new Map(MODULE_DIMENSIONS.map((e) => [e.dim, e]));
    const affectedDimensions = parsed.dimensions.map((d) => {
      const ref = byDim.get(d.dim);
      return {
        dim: d.dim,
        label: DIMENSION_LABELS[d.dim],
        risk: d.risk,
        reason: d.reason,
        modules: ref ? ref.modules : [],
        cases: ref ? ref.cases : [],
        note: ref ? ref.note : 'LLM 判定（映射表无此维度）',
      };
    });
    return {
      source: ANALYZER.LLM,
      model,
      risk: parsed.risk || aggregateRisk(affectedDimensions),
      affectedDimensions,
      notes: parsed.notes,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 确定性回退结果。 */
export function rulesImpact(scope) {
  const { affectedDimensions } = analyzeImpact(scope);
  return { source: ANALYZER.RULES, risk: aggregateRisk(affectedDimensions), affectedDimensions, notes: '' };
}

/**
 * auto：有 LLM 配置且分析成功则用 LLM，否则回退确定性分析（附 fallbackReason）。
 * analyzer='rules' 强制走确定性（默认行为，保证 CI 无凭证时稳定）。
 */
export async function analyzeImpactAuto(scope, opts = {}) {
  if (opts.analyzer === ANALYZER.RULES) return rulesImpact(scope);
  try {
    return await analyzeImpactLLM(scope, opts);
  } catch (e) {
    return { ...rulesImpact(scope), fallbackReason: e.message };
  }
}
