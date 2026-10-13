/**
 * UX 体验度量（D11-40）：从真实 agent 会话输出提取三指标 + 做「基线 ↔ 新版」对照判定。
 *
 * ⚠️ 口径声明（重要，勿越界）
 *
 * 这三个指标是**启发式近似**，用途**仅限**「同一条评测集在同 SUT 的 基线版 ↔ 新版 之间做
 * **相对对照**」（不劣化 + 至少一项改善）。**不得**用于绝对判定（如"steps<=3 才通过"）：
 * agent 输出格式因客户端/模型而异，只能靠特征词计数近似；相对比较可抵消格式差异，
 * 绝对阈值不能。故本模块只提供 `extractUxMetrics` / `compareUxMetrics` 两个纯函数，
 * 由调用方（run-agent-eval.mjs）负责记录两条曲线。
 *
 * 三指标定义（D11-40 用例口径：steps / fails / clarifications）
 *   - steps          动作步数：输出里「执行动作」的出现次数（命令/工具/文件写入等），
 *                    若输出带 `tool #N` 递增标记则以最大 N 为准
 *   - fails          失败次数：错误迹象特征词出现次数（失败/error/timeout/denied…）
 *   - clarifications 求助次数：向用户追问 / 请求补充信息的迹象次数
 */

export const UX_METRIC_KEYS = ['steps', 'fails', 'clarifications'];

/** 「执行动作」迹象（近似 steps） */
const STEP_PATTERNS = [
  /hcloud\s+[A-Z][A-Za-z0-9]*\s+[A-Z][A-Za-z0-9]*/g,
  /huaweicloud_[a-z_]+/g,
  /\b(?:explain_error|voucher_status|voucher_claim|run_readonly_command|plan_cli_command|run_approved_command|hook_check_command)\b/g,
  /\b(?:exec_command|read_file|write_file|write_to_file|apply_patch|bash|powershell)\b/g,
];

/** 失败迹象（近似 fails） */
const FAIL_PATTERNS = [
  /失败/g,
  /错误/g,
  /\berror\b/gi,
  /traceback/gi,
  /exception/gi,
  /\bnot found\b/gi,
  /超时/g,
  /\btimeout\b/gi,
  /无法/g,
  /\bdenied\b/gi,
  /不支持的?操作/g,
];

/** 求助/追问迹象（近似 clarifications） */
const CLARIFY_PATTERNS = [
  /请提供/g,
  /需要你/g,
  /请确认/g,
  /你能告诉我/g,
  /请告诉我/g,
  /请问/g,
  /是否要/g,
  /需要我/g,
  /不明确/g,
  /你希望/g,
  /麻烦(?:你)?(?:提供|告诉)/g,
  /补充(?:一下)?(?:你)?(?:的)?(?:需求|信息|说明)/g,
];

function countAll(text, patterns) {
  let total = 0;
  for (const re of patterns) {
    // 每次重建正则实例，避免 lastIndex 状态污染（同一模块被多次调用）
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    const hits = text.match(g);
    if (hits) total += hits.length;
  }
  return total;
}

/**
 * 「动作行」计数 —— steps 用它而不是 countAll。
 * 原因：同一行常同时出现「工具名 + 它执行的命令」（如 `exec_command: hcloud ECS ListServersDetails`），
 * 用 countAll 会把**同一步动作双计**。一行算一步更稳，也更贴近"用户视角要走几步"。
 */
function countActionLines(text, patterns) {
  const lines = text.split(/\r?\n/);
  let n = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (patterns.some((re) => new RegExp(re.source, re.flags.replace('g', '')).test(line))) n += 1;
  }
  return n;
}

/**
 * 提取三指标。
 * @param {string} text agent 会话原始输出
 * @param {{commands?: string[], tools?: string[]}} [evidence] 已有的取证结果（兜底用）
 * @returns {{steps:number, fails:number, clarifications:number}}
 */
export function extractUxMetrics(text, evidence = {}) {
  const s = String(text ?? '');
  let steps = countActionLines(s, STEP_PATTERNS);
  if (steps === 0) {
    steps = (evidence.commands?.length ?? 0) + (evidence.tools?.length ?? 0);
  }
  const toolMarkers = [...s.matchAll(/tool\s*#\s*(\d+)/gi)].map((m) => Number(m[1]));
  if (toolMarkers.length > 0) steps = Math.max(steps, ...toolMarkers);
  return {
    steps,
    fails: countAll(s, FAIL_PATTERNS),
    clarifications: countAll(s, CLARIFY_PATTERNS),
  };
}

/**
 * 「基线 ↔ 新版」对照判定（实现 D11-40 预期结果）。
 *
 * 通过条件：三项**均不劣化**（新版 ≤ 基线）且**至少一项严格改善**（<）。
 * @returns {{pass:boolean, regressed:string[], improved:string[], detail:object}}
 */
export function compareUxMetrics(baseline, current) {
  const regressed = [];
  const improved = [];
  const detail = {};
  for (const k of UX_METRIC_KEYS) {
    const b = Number(baseline?.[k] ?? 0);
    const c = Number(current?.[k] ?? 0);
    detail[k] = { baseline: b, current: c, delta: c - b };
    if (c > b) regressed.push(k);
    else if (c < b) improved.push(k);
  }
  return { pass: regressed.length === 0 && improved.length > 0, regressed, improved, detail };
}
