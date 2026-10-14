// D11-12 auth init 无效 SK 前置校验（IAM 401 中文可动作）（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：输出含中文校验失败提示且含可执行动作（指向控制台重新生成访问密钥）；
//   不出现英文 "IAM rejected the credentials" 裸串。
// 指引来源：validateIamCredentials(credential-validator.mjs:90)；上游 #900（IAM-401 文案）
//
// 做法：mock globalThis.fetch 返回 401（注入手法与 d11-44 一致，无需真实 AK），
// 直接调用校验函数并断言其错误面是否「中文 + 可动作」。
// 口径：需求验收（UX-R5 登录即校验 / UX-R7 统一错误卡）。实现前预期 FAIL。
// 用法: node d11-12-iam401-zh.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-12';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-12-iam401-zh.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

// 清空代理 env：避免走 undici dispatcher 绕过 globalThis.fetch mock
for (const k of ['HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'https_proxy', 'http_proxy', 'all_proxy']) {
  delete process.env[k];
}

const { validateIamCredentials } = await importHdk(hdkSrc, 'auth/credential-validator.mjs');
const CREDS = { ak: 'D11TWELVEAK00000000001', sk: 'D11TWELVESK00000000001', region: 'cn-north-4' };

globalThis.fetch = () =>
  Promise.resolve({
    status: 401,
    text: () => Promise.resolve(JSON.stringify({ error: { message: 'Incorrect IAM authentication information' } })),
  });

const r = await validateIamCredentials({ ...CREDS });
globalThis.fetch = undefined;

const ZH = /[\u4e00-\u9fff]/;
const blob = JSON.stringify(r ?? {});
const text = String(r?.error ?? '');

rec('D11-12-invalid', '无效 SK 判定为校验失败（valid=false）', r?.valid === false, r?.valid ?? null, false);
rec('D11-12-zh', '失败提示含中文字符（面向用户可读）', ZH.test(text), text.slice(0, 120), '含中文字符');
rec('D11-12-actionable', '提示含可执行动作（控制台重新生成密钥 / npx / hcloud）',
  /控制台|重新生成|访问密钥|npx\s|hcloud\s/.test(blob) || /控制台|重新生成/.test(String(r?.action ?? '')),
  { action: r?.action ?? null, 命中: /控制台|重新生成|npx\s|hcloud\s/.test(blob) },
  '含「控制台重新生成访问密钥」类可执行动作');
rec('D11-12-no-en', '不出现英文 "IAM rejected the credentials" 裸串（反断言）',
  !/IAM rejected the credentials/.test(text), text.slice(0, 120), '不含该英文整句');

finish(CASE_ID, evid, '口径: 需求验收（UX-R5/R7）；FAIL = 文案未中文化/缺可执行动作，非 harness 问题');
