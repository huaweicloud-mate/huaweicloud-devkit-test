// D11-36 未登录引导「闭环有效性」验收夹具（体验用例可执行样板）
//
// 与 v1「纸面断言」的差别（三条范式升级）：
//   ① 文案达标 = 正断言（含中文）+ **反断言**（不含指定英文原文）
//   ② **闭环有效性** —— 按返回的引导步骤真的把症状去掉，而非只断言"返回里有字段"
//   ③ **宿主隔离自检** —— 本机若存在真实凭证/码道目录，"未登录态"根本构造不出来；
//      此时必须报 ENV_CONTAMINATED（用例不可判定），而不是给一个假 FAIL。
//      体验用例的可判定性前提 = 干净的宿主（见 docs/UX-体验验证案例升级方案）。
//
// 口径：这是**需求验收**用例（UX-R1）。实现前预期 FAIL —— 如实记录，不以 FAIL 掩盖"未实现"。
// 用法: node d11-36-guidance-closure.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d11-36-guidance-closure.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`);
  if (detail) console.log('    ' + detail);
}

const ZH = /[\u4e00-\u9fff]/;
const tmp = join(tmpdir(), `d11-36-${Date.now()}`);
mkdirSync(tmp, { recursive: true });

// ---- 0) 宿主隔离前置门（不是用例，是前置条件；污染时整例不可判定） ----
const contam = ['.config/huaweicloud/credentials.json', '.hcloud/config.json',
  '.codeartsdoer', '.codearts', '.codeartswork']
  .filter((p) => existsSync(join(homedir(), p)));
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) {
  console.log('RESULT: ENV_CONTAMINATED');
  console.log('  未登录态不可构造 → 整例不可判定（不计入 PASS/FAIL）。');
  console.log('  重跑: 置 USERPROFILE/HOME 到空目录后再执行本夹具。');
  if (EVID) {
    const outDir = join(EVID, 'D11-36');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'stdout.txt'),
      `[HOST] CONTAMINATED :: ${contam.join(', ')}\nRESULT: ENV_CONTAMINATED\n`, 'utf8');
  }
  process.exit(2);
}

process.env.HUAWEICLOUD_HOME = tmp;
for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION']) delete process.env[k];

const creds = await import(pathToFileURL(join(hdkSrc, 'auth', 'credentials.mjs')).href);

// ---- 1) 文案达标：错误码 + 中文 + 步骤 + 反断言 ----
let err = null;
try { creds.resolveCredentials(); } catch (e) { err = e; }
rec('D11-36-code', '无凭证抛 HDKIT_CRED_MISSING',
  err?.code === 'HDKIT_CRED_MISSING', err?.code ?? null, 'HDKIT_CRED_MISSING');
rec('D11-36-zh', 'onboarding.message 为中文',
  ZH.test(err?.onboarding?.message || ''), err?.onboarding?.message ?? null, '含中文字符');
const acts = (err?.onboarding?.steps || []).map((s) => s.action);
rec('D11-36-steps', 'steps 同时含 取AK 与 登录动作',
  acts.includes('obtain-aksk') && (acts.includes('auth-init') || acts.includes('auth_switch')),
  acts, ['obtain-aksk', 'auth-init|auth_switch']);
rec('D11-36-no-en', '顶层 message 无英文整句残留（反断言）',
  !/Huawei Cloud credentials are not configured/.test(err?.message || ''),
  String(err?.message || '').slice(0, 72), '不含英文整句');

// ---- 2) 闭环有效性：按引导完成登录 → 症状消失 ----
let after = null;
try {
  creds.writeGlobalCredentials({ ak: 'D11FAKEAKABCDEFGHIJKL', sk: 'D11FAKESKABCDEFGHIJKL', region: 'cn-north-4' });
  after = creds.resolveCredentials();
} catch (e) { after = { error: String(e.message).slice(0, 80) }; }
rec('D11-36-closure', '按引导完成登录后症状消失（闭环有效性）',
  after?.ak === 'D11FAKEAKABCDEFGHIJKL', after?.ak ?? after, 'D11FAKEAKABCDEFGHIJKL');

rmSync(tmp, { recursive: true, force: true });
delete process.env.HUAWEICLOUD_HOME;

const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
console.log(`\n=== D11-36 未登录引导闭环有效性 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
console.log('口径: 需求验收（UX-R1）；FAIL = 需求未实现，非 harness 问题');

if (EVID) {
  const outDir = join(EVID, 'D11-36');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) =>
    `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D11-36 未登录引导闭环有效性 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
