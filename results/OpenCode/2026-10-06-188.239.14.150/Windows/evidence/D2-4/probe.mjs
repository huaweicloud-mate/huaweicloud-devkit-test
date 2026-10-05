// D2-4 凭证脱敏正确性（P0）
// 断言：show_profile_redacted / auth_status 输出中无明文凭证——SK 永不完整出现，AK 中段被掩码
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D2-4';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const s1Path = creds.globalCredentialsPath();
const raw = existsSync(s1Path) ? JSON.parse(readFileSync(s1Path, 'utf8')) : {};
const ak = String(raw.ak || '');
const sk = String(raw.sk || '');

const profile = await tools.callTool('huaweicloud_show_profile_redacted', {});
const status = await tools.callTool('huaweicloud_auth_status', { target: 'all' });
const profileText = JSON.stringify(profile);
const statusText = JSON.stringify(status);

// redactSecrets 单元断言（真实函数）
const sample = { access_key: 'AKIAIOSFODNN7EXAMPLE', secret_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', adminPass: 'Aa@123456', region: 'cn-north-4' };
const redacted = safety.redactSecrets(sample);

const leaks = [];
if (sk && profileText.includes(sk)) leaks.push('show_profile_redacted 输出含完整 SK');
if (sk && statusText.includes(sk)) leaks.push('auth_status 输出含完整 SK');
if (ak && sk && profileText.includes(ak) && profileText.includes(sk)) leaks.push('profile 输出同时含完整 AK+SK');
if (ak && profileText.includes(ak)) {
  const masked = ak.slice(0, 4) + '*'.repeat(Math.max(0, ak.length - 8)) + ak.slice(-4);
  if (!profileText.includes(masked)) leaks.push(`profile 中 AK 未按中段掩码呈现（期望形如 ${masked}）`);
}
if (redacted.secret_key !== '<redacted>') leaks.push('redactSecrets 未把 secret_key 替换为 <redacted>');
if (redacted.access_key !== '<redacted>') leaks.push('redactSecrets 未把 access_key 替换为 <redacted>');
if (redacted.adminPass !== '<redacted>') leaks.push('redactSecrets 未把 adminPass 替换为 <redacted>');
if (redacted.region !== 'cn-north-4') leaks.push('redactSecrets 误伤非敏感字段 region');

const ok = leaks.length === 0 && !!profile && !!status;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `show_profile_redacted / auth_status 输出无明文凭证；redactSecrets 对 access_key/secret_key/adminPass 全部替换为 <redacted> 且不误伤 region`
      : `脱敏缺陷：${JSON.stringify(leaks)}`,
  {
    s1Path,
    akFingerprint: ak ? `${ak.slice(0, 4)}****${ak.slice(-4)} (len=${ak.length})` : null,
    skLengthOnly: sk ? `len=${sk.length}` : null,
    profileResult: profile,
    authStatusResult: status,
    redactSecretsProbe: { input: sample, output: redacted },
    leaks,
  });