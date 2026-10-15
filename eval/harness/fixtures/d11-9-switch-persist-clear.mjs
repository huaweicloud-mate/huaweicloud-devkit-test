// D11-9 切换持久性显式化：persist / clear（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：persist 返回 persistsAfterRestart==true 且 S1.configuredBySession==true；
//   clear 后 effective.source 回退为 "s1"。
// 指引来源：setConfiguredBySession(credentials.mjs:194-198)
//
// 做法（走真实闭环）：隔离 HOME 预置 S1=A →
//   ① callTool auth_switch persist（mode=memory, 账号 B）→ 拿 confirmToken/options
//   ② callTool auth_confirm 完成确认 → 读 auth_status 的 S1.configuredBySession
//   ③ callTool auth_switch clear → 读 effective.source 是否回退 s1
// 口径：需求验收（UX-R4）。契约未实现 → 预期 FAIL（门禁先行，结果仅记趋势）。
// 用法: node d11-9-switch-persist-clear.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-9';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-9-switch-persist-clear.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-9');
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

const A = { ak: 'D11NINEAAK0000000001', sk: 'D11NINEASK0000000001', region: 'cn-north-4' };
const B = { ak: 'D11NINEBAK0000000001', sk: 'D11NINEBSK0000000001', region: 'cn-east-3' };

creds.writeGlobalCredentials({ ak: A.ak, sk: A.sk, region: A.region }); // 已登录态（S1=A）

// ① persist
const persist = await callTool('huaweicloud_auth_switch', {
  mode: 'memory', action: 'persist', ak: B.ak, sk: B.sk, region: B.region,
});
rec('D11-9-persist-hot', 'persist 返回 persistsAfterRestart == true（写盘 → 重启仍生效）',
  persist?.persistsAfterRestart === true,
  { persistsAfterRestart: persist?.persistsAfterRestart ?? null, status: persist?.status ?? null, keys: Object.keys(persist || {}) },
  true);

// ② 若返回待确认，走 auth_confirm 完成闭环（否则视为已直接生效）
let confirmed = null;
if (persist?.confirmToken) {
  try {
    confirmed = await callTool('huaweicloud_auth_confirm', { token: persist.confirmToken, decision: 'newImported' });
  } catch (e) {
    confirmed = { error: String(e?.message).slice(0, 120) };
  }
}
const afterPersist = svc.getAuthStatus();
// 契约要求「会话写入标记」显式可读；字段名未冻结，故按语义匹配任意命名后再判值
const flatReconciled = JSON.stringify(afterPersist?.reconciled ?? {});
const flagMatch = flatReconciled.match(/"(configuredBySession|sessionWritten|writtenBySession)"\s*:\s*(true|false)/);
const cbs = flagMatch ? flagMatch[2] === 'true' : null;
rec('D11-9-s1-session-flag', 'persist 后 S1.configuredBySession == true（会话写入标记须显式可读）',
  cbs === true,
  { s1_configuredBySession: cbs ?? '(字段不存在)', stores: afterPersist?.reconciled?.stores ?? null,
    reconciledKeys: Object.keys(afterPersist?.reconciled || {}) },
  true, `confirm 结果: ${JSON.stringify(confirmed).slice(0, 80)}`);

// ③ clear → 回退到 s1
const cleared = await callTool('huaweicloud_auth_switch', { mode: 'memory', action: 'clear' });
const afterClear = svc.getAuthStatus();
rec('D11-9-clear-fallback', 'clear 后 effective.source 回退为 "s1"',
  afterClear?.effective?.source === 's1',
  { effective: afterClear?.effective ?? null, clearStatus: cleared?.status ?? null,
    credentialPanel: afterClear?.credentialPanel ?? null },
  's1');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R4）；FAIL = 持久性未显式化/回退结论缺失，非 harness 问题');
