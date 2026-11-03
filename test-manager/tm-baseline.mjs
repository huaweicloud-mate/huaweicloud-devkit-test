// tm-baseline.mjs — 录制基线更新（人工确认后）
//
// 对齐 docs/test-ai-orchestration-architecture.md §五 Step 6「人工审核 + 基线更新」：
//  确切是预期行为变化（而非缺陷）时，经人工确认后更新录制基线。
//
// 纪律：
//  - **fail-closed**：`approvedByUser !== true` 一律拒绝写入（基线是判定依据，不能让引擎自己改）。
//  - `dryRun: true` 只回报将要写入的内容规模与路径，不落盘。
//  - 写入 JSONL（每行一条录制记录），与 eval/replay 的录制格式同构。

import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {object} p
 * @param {string} p.scenarioId 场景 id（决定文件名）
 * @param {(object[]|string)} p.newRecording 录制记录数组或原始文本
 * @param {boolean} p.approvedByUser 必须显式为 true（人工确认）
 * @param {boolean} [p.dryRun]
 * @param {string} [p.baselinesDir] 默认 test/baselines
 */
export function updateBaseline({
  scenarioId,
  newRecording,
  approvedByUser,
  dryRun = false,
  baselinesDir = path.join('test', 'baselines'),
} = {}) {
  if (!scenarioId || typeof scenarioId !== 'string') {
    return { ok: false, wrote: false, reason: 'scenarioId 必填' };
  }
  if (!/^[\w.-]+$/.test(scenarioId)) {
    return { ok: false, wrote: false, reason: 'scenarioId 只允许字母/数字/下划线/点/横线（防路径穿越）' };
  }
  if (newRecording === undefined || newRecording === null) {
    return { ok: false, wrote: false, reason: 'newRecording 必填' };
  }
  if (approvedByUser !== true) {
    return { ok: false, wrote: false, reason: '需人工确认（approvedByUser=true）方可更新基线 —— fail-closed' };
  }

  const text = Array.isArray(newRecording)
    ? newRecording.map((r) => JSON.stringify(r)).join('\n')
    : String(newRecording);
  if (!text.trim()) {
    return { ok: false, wrote: false, reason: '录制内容为空' };
  }
  const payload = text.endsWith('\n') ? text : `${text}\n`;
  const bytes = Buffer.byteLength(payload, 'utf8');
  const file = path.join(baselinesDir, `${scenarioId}.jsonl`);

  if (dryRun) {
    return { ok: true, wrote: false, dryRun: true, path: file, bytes, lines: payload.trim().split('\n').length };
  }

  fs.mkdirSync(baselinesDir, { recursive: true });
  fs.writeFileSync(file, payload, 'utf8');
  return {
    ok: true,
    wrote: true,
    dryRun: false,
    path: file,
    bytes,
    lines: payload.trim().split('\n').length,
  };
}
