// probe-lib/shared.mjs — 公共断言与证据落盘工具（供各用例 probe.mjs 复用）
// 用途：让每个 evidence/<case-id>/probe.mjs 保持"有真实执行逻辑"，同时避免 141 份重复样板。
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACK_DIR = join(__dirname, '..');
export const SDK = 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
export const REPO = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test';

export class Check {
  constructor(caseId, title) {
    this.caseId = caseId;
    this.title = title;
    this.assertions = [];
  }
  /** 记录一条断言；ok=false 时该用例判 FAIL */
  ok(name, cond, actual, expected) {
    this.assertions.push({ name, ok: !!cond, actual, expected: expected ?? true });
    return !!cond;
  }
  eq(name, actual, expected) {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    return this.ok(name, a === e, actual, expected);
  }
  get pass() { return this.assertions.length > 0 && this.assertions.every(a => a.ok); }
  get failed() { return this.assertions.filter(a => !a.ok); }
  /** 结论：PASS / FAIL / SPEC-MISMATCH（外部覆盖判定） */
  verdict(override) {
    if (override) return override;
    return this.pass ? 'PASS' : 'FAIL';
  }
  report(extra = {}) {
    const verdict = this.verdict(extra.verdict);
    // backfill_daily.py 读 stdout.log 的 `status` 字段做机械回填；同时保留 verdict 便于人读。
    const failedList = this.failed;
    return {
      caseId: this.caseId,
      title: this.title,
      status: verdict,
      verdict,
      why: String(extra.why || extra.note || (verdict === 'PASS' ? '' : `断言未通过: ${failedList.map((f) => `${f.name}(实际=${JSON.stringify(f.actual)} 期望=${JSON.stringify(f.expected)})`).join('; ')}`)),
      assertionTotal: this.assertions.length,
      assertionPassed: this.assertions.filter(a => a.ok).length,
      failed: failedList,
      assertions: this.assertions,
      executedAt: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(/[-: ]/g, ''),
      executedAtIso: new Date().toISOString(),
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      ...extra,
    };
  }
}

export function writeEvidence(caseId, files) {
  const dir = join(PACK_DIR, 'evidence', caseId);
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf-8');
  }
  return dir;
}

/** 探针统一入口：执行断言 → 打印 stdout JSON → 落 evidence/<case-id>/{stdout.log,report.json,probe.mjs 由生成器写入} */
export async function emit(caseId, title, fn, opts = {}) {
  const c = new Check(caseId, title);
  let verdictOverride;
  let note;
  try {
    const r = await fn(c);
    if (r && typeof r === 'object') {
      if (r.verdict) verdictOverride = r.verdict;
      if (r.note) note = r.note;
      if (r.extra) Object.assign(opts, r.extra);
    }
  } catch (e) {
    c.ok('probe 执行未抛异常', false, String(e && e.message || e), '不抛异常');
  }
  const rep = c.report({ verdict: verdictOverride, note, ...opts });
  const stdout = JSON.stringify(rep, null, 2);
  writeEvidence(caseId, { 'stdout.log': stdout, 'report.json': rep });
  console.log(stdout);
  process.exitCode = rep.verdict === 'FAIL' ? 1 : 0;
  return rep;
}