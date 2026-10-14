// D11-1 未登录首触中文引导（P1）—— 可执行载体
//
// 判据（取自 test-cases/ux/用例矩阵-体验级.csv::预期结果）：
//   err.code=="HDKIT_CRED_MISSING" 且 err.onboarding.scenario==3
//   且 err.onboarding.message 含中文字符且不含英文整句 "Huawei Cloud credentials are not configured"
//   且 steps[] 同时含 action=="obtain-aksk"(label 含"控制台")与 action=="auth-init"
//
// 与 D11-37 的分工：D11-37 判「闭环有效性」（按引导完成登录后症状消失）；
// 本夹具判「首触引导的三要素」——scenario 编号、取 AK/SK 步骤的存在与其人话 label。
// 口径：需求验收（UX-R1 / 上游 #900）。实现前预期 FAIL —— 如实记录。
// 用法: node d11-1-onboarding-first-touch.mjs <hdk src> [--evid <dir>]
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blocked, contaminatedHost, finish, importHdk, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-1';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-1-onboarding-first-touch.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const tmp = join(tmpdir(), `d11-1-${Date.now()}`);
mkdirSync(tmp, { recursive: true });
process.env.HUAWEICLOUD_HOME = tmp;
for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION']) {
  delete process.env[k];
}

const ZH = /[\u4e00-\u9fff]/;
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');

let err = null;
try {
  creds.resolveCredentials();
} catch (e) {
  err = e;
}

const ob = err?.onboarding || {};
const steps = ob.steps || [];
const acts = steps.map((s) => s.action);
const akskStep = steps.find((s) => s.action === 'obtain-aksk');

rec('D11-1-code', '错误码为 HDKIT_CRED_MISSING', err?.code === 'HDKIT_CRED_MISSING', err?.code ?? null,
  'HDKIT_CRED_MISSING');
rec('D11-1-scenario', 'onboarding.scenario == 3（未登录首触场景）', ob.scenario === 3,
  { scenario: ob.scenario ?? null, message: String(ob.message || '').slice(0, 40) }, 'scenario=3');
rec('D11-1-zh', 'onboarding.message 为中文', ZH.test(ob.message || ''), ob.message ?? null, '含中文字符');
rec('D11-1-steps-obtain', 'steps 含取得 AK/SK 的动作（action=obtain-aksk）', acts.includes('obtain-aksk'),
  acts, '含 obtain-aksk');
rec('D11-1-steps-label', '取得 AK/SK 的步骤 label 指向「控制台」', /控制台/.test(akskStep?.label || ''),
  akskStep?.label ?? null, 'label 含「控制台」');
rec('D11-1-step-auth-init', 'steps 含会话内登录动作（auth-init）', acts.includes('auth-init') || acts.includes('auth_switch'),
  acts, '含 auth-init|auth_switch');
rec('D11-1-no-en', '顶层 message 无英文整句残留（反断言）',
  !/Huawei Cloud credentials are not configured/.test(err?.message || ''),
  String(err?.message || '').slice(0, 72), '不含英文整句');

rmSync(tmp, { recursive: true, force: true });
delete process.env.HUAWEICLOUD_HOME;

finish(CASE_ID, evid, '口径: 需求验收（UX-R1）；FAIL = 需求未实现，非 harness 问题');
