// D11-39 体验文案分类器（compare.mjs::classifyUxText）契约单测
//
// 覆盖 4 类新增 FAIL 分类 + PASS 类 + 机器字段不误报 + 基线缺失 fail-closed。
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  VERDICT,
  UX_VERDICT,
  classifyUxText,
  isUxPass,
  normalizeUxText,
  stripMachineTokens,
} from '../../eval/replay/compare.mjs';

const OK_ZH = '未配置华为云凭证。请在控制台获取 AK/SK 后执行 huaweicloud_auth_switch。';

test('PASS：与基线一致的中文文案（含可执行下一步）', () => {
  const r = classifyUxText(OK_ZH, { baselineText: OK_ZH });
  assert.equal(r.verdict, VERDICT.SEMANTIC_EQUIVALENT);
  assert.equal(isUxPass(r.verdict), true);
});

test('PASS：与基线仅格式差异 → MINOR_FORMAT_CHANGE', () => {
  const r = classifyUxText(`${OK_ZH}  `, { baselineText: OK_ZH.replace('。', '。') });
  assert.ok([VERDICT.SEMANTIC_EQUIVALENT, VERDICT.MINOR_FORMAT_CHANGE].includes(r.verdict));
  assert.equal(isUxPass(r.verdict), true);
});

test('FAIL：内部代号 cli-domain-id 泄漏', () => {
  const r = classifyUxText('缺少 cli-domain-id，请检查配置', { baselineText: OK_ZH });
  assert.equal(r.verdict, UX_VERDICT.INTERNAL_JARGON_LEAK);
  assert.equal(isUxPass(r.verdict), false);
});

test('FAIL：内部代号 S1 泄漏', () => {
  const r = classifyUxText('凭证来源为 S1，请重试', { baselineText: OK_ZH });
  assert.equal(r.verdict, UX_VERDICT.INTERNAL_JARGON_LEAK);
});

test('FAIL：中文语境残留英文整句', () => {
  const r = classifyUxText(
    '华为云凭证未配置。Huawei Cloud credentials are not configured as expected.',
    { baselineText: OK_ZH },
  );
  assert.equal(r.verdict, UX_VERDICT.ENGLISH_RESIDUE);
  assert.equal(isUxPass(r.verdict), false);
});

test('FAIL：要求下一步却无可执行指引', () => {
  const r = classifyUxText('出错了', { baselineText: OK_ZH, requireAction: true });
  assert.equal(r.verdict, UX_VERDICT.UNCLEAR_NEXT_STEP);
});

test('FAIL：未指向正确根因（requiredKeywords 全未命中）', () => {
  const r = classifyUxText('操作失败，请稍后重试', { baselineText: OK_ZH, requiredKeywords: [/凭证/] });
  assert.equal(r.verdict, UX_VERDICT.MISLEADING_HINT);
});

test('FAIL：命中显式误导词组', () => {
  const r = classifyUxText('连接成功，凭证有效', { baselineText: OK_ZH, misleadingPatterns: [/连接成功/] });
  assert.equal(r.verdict, UX_VERDICT.MISLEADING_HINT);
});

test('机器字段不误报：source/action/code 等键值对先被剥离', () => {
  const text = '{"source":"S1","action":"auth-init","code":"HDKIT_CRED_MISSING"} 未配置凭证，请执行 huaweicloud_auth_switch';
  const stripped = stripMachineTokens(text);
  assert.ok(!stripped.includes('S1'), 'source 值应被剥离');
  assert.ok(!stripped.includes('HDKIT_CRED_MISSING'), '内部错误码应被剥离');
  const r = classifyUxText(text, { baselineText: text });
  assert.equal(r.verdict, VERDICT.SEMANTIC_EQUIVALENT, `实际=${r.verdict} reasons=${r.reasons.join(';')}`);
});

test('fail-closed：无基线且未显式跳过 → BASELINE_INVALID', () => {
  const r = classifyUxText(OK_ZH, {});
  assert.equal(r.verdict, VERDICT.BASELINE_INVALID);
});

test('normalizeUxText：折叠空白 + 中文引号归一', () => {
  assert.equal(normalizeUxText('  未配置  “凭证”  '), '未配置 "凭证"');
});