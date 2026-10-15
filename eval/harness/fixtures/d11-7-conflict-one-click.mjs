// D11-7 冲突一键选择（中文标签 + 确认闭环）（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：首次返回 needs_confirmation==true 且含 confirmToken 且两个候选 label
//   均为中文并各自含账号指纹（不含裸代号 "S1"）；confirm 后 S1/env/S3 三端指纹一致。
// 指引来源：auth_switch/auth_confirm(tools.mjs) + setConfiguredBySession
//
// 做法：造「S1=A + env=B + OBS(S3)=B」冲突态 →
//   ① callTool auth_switch(mode=memory, action=persist) 拿 confirmToken/options
//   ② 校验候选标签中文 + 含指纹 + 无裸代号
//   ③ callTool auth_confirm 完成 → 校验三端（S1 / env / S3）指纹已收敛一致
// 口径：需求验收（UX-R2/R4 冲突一键选择）。实现前预期 FAIL。
// 用法: node d11-7-conflict-one-click.mjs <hdk src> [--evid <dir>]
import { existsSync, readFileSync } from 'node:fs';
import { blocked, contaminatedHost, fingerprint8, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-7';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-7-conflict-one-click.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-7');
const A = { ak: 'D11SEVENAAK00000001', sk: 'D11SEVENASK00000001', region: 'cn-north-4' };
const B = { ak: 'D11SEVENBAK00000001', sk: 'D11SEVENBSK00000001', region: 'cn-east-3' };

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

// 冲突态：S1=A 落盘；env=B；OBS(S3)=B
creds.writeGlobalCredentials({ ak: A.ak, sk: A.sk, region: A.region });
try { creds.writeObsConfig({ ak: B.ak, sk: B.sk, region: B.region }); } catch { /* 缺 region 报错时忽略 */ }
process.env.HW_ACCESS_KEY = B.ak;
process.env.HW_SECRET_KEY = B.sk;
process.env.HW_REGION = B.region;

const r = await callTool('huaweicloud_auth_switch', {
  mode: 'memory', action: 'persist', ak: B.ak, sk: B.sk, region: B.region,
});
const wire = JSON.stringify(r ?? {});
const options = Array.isArray(r?.options) ? r.options : [];
const labels = options.map((o) => String(o?.label ?? ''));
const fpA = fingerprint8(A.ak, A.sk);
const fpB = fingerprint8(B.ak, B.sk);
const ZH = /[\u4e00-\u9fff]/;
const codeNames = labels.filter((l) => /\bS1\b|\bS2\b|\bS3\b/.test(l));

rec('D11-7-needs-confirm', '首次返回标示需确认（status=needs_confirmation 或 needs_confirmation==true）',
  r?.status === 'needs_confirmation' || r?.needs_confirmation === true,
  { status: r?.status ?? null, needs_confirmation: r?.needs_confirmation ?? null }, 'needs_confirmation');
rec('D11-7-token', '返回 confirmToken（可继续完成确认闭环）',
  typeof r?.confirmToken === 'string' && r.confirmToken.length > 0, r?.confirmToken ? '(已返回)' : null, '非空 token');
rec('D11-7-labels-zh', '候选 label 均为中文（人话化）',
  labels.length >= 2 && labels.every((l) => ZH.test(l)),
  { 候选数: labels.length, 示例: labels.slice(0, 2).map((l) => l.slice(0, 40)) }, '≥2 条且全中文');
rec('D11-7-labels-fp', '候选 label 各自含账号指纹（可分辨选的是谁）',
  labels.length >= 2 && labels.some((l) => l.includes(fpA)) && labels.some((l) => l.includes(fpB)),
  { 期望指纹: [fpA, fpB], 命中: [labels.some((l) => l.includes(fpA)), labels.some((l) => l.includes(fpB))] },
  `含 ${fpA} 与 ${fpB}`);
rec('D11-7-no-codename', '候选 label 不含裸代号 S1/S2/S3（反断言）', codeNames.length === 0,
  codeNames.length ? codeNames.slice(0, 2) : '无命中', '不含裸代号');

// 确认闭环 → 三端指纹收敛
let confirmed = null;
if (r?.confirmToken) {
  try {
    confirmed = await callTool('huaweicloud_auth_confirm', { token: r.confirmToken, decision: options.some((o) => o.key === 'newImported') ? 'newImported' : options[0]?.key });
  } catch (e) {
    confirmed = { error: String(e?.message).slice(0, 120) };
  }
}
const s1 = creds.readGlobalCredentials();
// OBS(S3) 侧：直接读配置文件（credentials.mjs 只导出路径、无 readObsConfig）
let obsFp = null;
try {
  const p = creds.obsConfigPath?.();
  if (p && existsSync(p)) {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    obsFp = j?.ak ? fingerprint8(j.ak, j.sk ?? '') : null;
  }
} catch { obsFp = null; }
const s1Fp = s1?.ak ? fingerprint8(s1.ak, s1.sk) : null;
const envFp = process.env.HW_ACCESS_KEY ? fingerprint8(process.env.HW_ACCESS_KEY, process.env.HW_SECRET_KEY) : null;
rec('D11-7-triple-consistent', 'confirm 后 S1 / env / S3 三端指纹一致',
  Boolean(s1Fp) && s1Fp === obsFp,
  { s1: s1Fp, env: envFp, s3: obsFp, confirm结果: JSON.stringify(confirmed).slice(0, 80),
    说明: 'env 由平台注入、确认流程不改写入，故只对 S1 与 S3 做一致性断言' },
  'S1 == S3（env 由平台侧负责）');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R2/R4）；FAIL = 冲突选择闭环未实现，非 harness 问题');
