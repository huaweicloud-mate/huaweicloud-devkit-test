// D11-29 切号后立即生效验证（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：无需重启即生效——只读调用返回的账号或项目标识与 B 一致；
//   返回体提示「已生效，无需重启会话」。
// 指引来源：resolveCredentialsWithRuntime(credentials.mjs:396-407)
// 口径：需求验收（UX-R20）。① 函数级「立即生效」当前可能已成立；② 用户可见提示缺失 → 预期 FAIL。
// 用法: node d11-29-switch-effective-now.mjs <hdk src> [--evid <dir>]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprint8, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-29';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-29-switch-effective-now.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const A = { ak: 'D11TWENTYNINEA000001', sk: 'D11TWENTYNINEASK0001', region: 'cn-north-4' };
const B = { ak: 'D11TWENTYNINEB000001', sk: 'D11TWENTYNINEBSK0001', region: 'cn-east-3' };
const iso = isolateHome('d11-29');

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');

// 初始：S1 = A
creds.writeGlobalCredentials({ ak: A.ak, sk: A.sk, region: A.region });
const before = creds.resolveCredentialsWithRuntime();

// 切号：runtime = B（模拟 auth_switch，无需重启会话）
creds.setRuntimeCredentials(B.ak, B.sk, '', B.region);
const after = creds.resolveCredentialsWithRuntime();

rec('D11-29-switch-applied', '切号后运行时解析立即指向新账号（无需重启）',
  before?.ak === A.ak && after?.ak === B.ak,
  { 切换前: before?.ak ? fingerprint8(before.ak, before.sk) : null, 切换后: after?.ak ? fingerprint8(after.ak, after.sk) : null },
  { 切换前: fingerprint8(A.ak, A.sk), 切换后: fingerprint8(B.ak, B.sk) });
rec('D11-29-region-follows', '切号后区域随新账号生效', after?.region === B.region, after?.region ?? null, B.region);

// 用户可见提示：返回体须明确「已生效，无需重启会话」
const toolsSrc = readFileSync(join(hdkSrc, 'tools.mjs'), 'utf8');
const hint = /无需重启|已生效[^\n]{0,12}无需重启/.test(toolsSrc);
rec('D11-29-restart-hint', '返回/文案含「已生效，无需重启会话」提示', hint,
  hint ? '已找到该提示' : 'tools.mjs 中未找到「无需重启」相关提示', '含「已生效，无需重启会话」');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R20）；FAIL = 用户可见提示未实现，非 harness 问题');
