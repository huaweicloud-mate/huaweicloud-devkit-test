// D11-37 未登录引导「闭环有效性」验收夹具（体验用例可执行样板）
//
// 与 v1「纸面断言」的差别（三条范式升级）：
//   ① 文案达标 = 正断言（含中文）+ **反断言**（不含指定英文原文）
//   ② **闭环有效性** —— 按返回的引导步骤真的把症状去掉，而非只断言"返回里有字段"
//   ③ **宿主隔离自检** —— 本机若存在真实凭证/码道目录，"未登录态"根本构造不出来；
//      此时必须报 ENV_CONTAMINATED（用例不可判定），而不是给一个假 FAIL。
//      体验用例的可判定性前提 = 干净的宿主（见 docs/UX-体验验证案例升级方案）。
//
// 口径：这是**需求验收**用例（UX-R1）。实现前预期 FAIL —— 如实记录，不以 FAIL 掩盖"未实现"。
// 用法: node d11-37-guidance-closure.mjs <hdk src> [--evid <dir>]
// 编号沿革：本夹具原为 d11-36-guidance-closure.mjs（CASE_ID/断言前缀 D11-36），与设计矩阵
//   （test-cases/ux/gen_ux.py 真源：本条为 D11-37）错位 1 位；2026-10-14 统一为 D11-37。
//   历史证据目录 evidence/D11-36/ 与 2026-10-13 的归档报告/上游 #900 评论仍用旧号，属历史编号。
// 收尾走 ux-common.mjs 的统一契约（断言记录 / 证据双落盘 / 三态退出码），与其他 D11 夹具同形。
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blocked, contaminatedHost, finish, importHdk, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-37';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-37-guidance-closure.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const ZH = /[\u4e00-\u9fff]/;
const tmp = join(tmpdir(), `d11-37-${Date.now()}`);

// ---- 0) 宿主隔离前置门（不是用例，是前置条件；污染时整例不可判定） ----
const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) {
  blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);
}

mkdirSync(tmp, { recursive: true });
process.env.HUAWEICLOUD_HOME = tmp;
for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION']) delete process.env[k];

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');

// ---- 1) 文案达标：错误码 + 中文 + 步骤 + 反断言 ----
let err = null;
try { creds.resolveCredentials(); } catch (e) { err = e; }
rec('D11-37-code', '无凭证抛 HDKIT_CRED_MISSING',
  err?.code === 'HDKIT_CRED_MISSING', err?.code ?? null, 'HDKIT_CRED_MISSING');
rec('D11-37-zh', 'onboarding.message 为中文',
  ZH.test(err?.onboarding?.message || ''), err?.onboarding?.message ?? null, '含中文字符');
const acts = (err?.onboarding?.steps || []).map((s) => s.action);
rec('D11-37-steps', 'steps 同时含 取AK 与 登录动作',
  acts.includes('obtain-aksk') && (acts.includes('auth-init') || acts.includes('auth_switch')),
  acts, ['obtain-aksk', 'auth-init|auth_switch']);
rec('D11-37-no-en', '顶层 message 无英文整句残留（反断言）',
  !/Huawei Cloud credentials are not configured/.test(err?.message || ''),
  String(err?.message || '').slice(0, 72), '不含英文整句');

// ---- 2) 闭环有效性：按引导完成登录 → 症状消失 ----
let after = null;
try {
  creds.writeGlobalCredentials({ ak: 'D11FAKEAKABCDEFGHIJKL', sk: 'D11FAKESKABCDEFGHIJKL', region: 'cn-north-4' });
  after = creds.resolveCredentials();
} catch (e) { after = { error: String(e.message).slice(0, 80) }; }
rec('D11-37-closure', '按引导完成登录后症状消失（闭环有效性）',
  after?.ak === 'D11FAKEAKABCDEFGHIJKL', after?.ak ?? after, 'D11FAKEAKABCDEFGHIJKL');

rmSync(tmp, { recursive: true, force: true });
delete process.env.HUAWEICLOUD_HOME;

finish(CASE_ID, evid, '口径: 需求验收（UX-R1）；FAIL = 需求未实现，非 harness 问题');
