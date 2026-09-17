/**
 * WorkBuddy 每日测试探针 - D4 审批流（真实函数级，next.6）
 * 覆盖: D4-18 confirm-not-deny 审批语义 (P0)
 *       D4-19 确认流下预检仍生效 (P0)
 *       D4-24 确认令牌过期/重复确认（函数级部分；真云资源计数部分 BLOCKED）
 * 方法: 隔离 HUAWEICLOUD_HOME（approvals.json 落隔离目录）；
 *       HCLOUD_BIN=node.exe 使"确认后执行"可观测（spawn 尝试即证明放行，无需真执行云命令）。
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TMP = join(HERE, 'tmp-isolated');
const SRC = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
process.env.HUAWEICLOUD_HOME = TMP;
process.env.HCLOUD_BIN = process.execPath; // node: spawn 尝试即 MODULE_NOT_FOUND 快速失败，可观测"已放行"
delete process.env.HCLOUD_BIN_ARGS_JSON;
for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION']) delete process.env[k];

const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const APPROVALS = () => join(TMP, '.config', 'huaweicloud', 'approvals.json');
const readApprovals = () => (existsSync(APPROVALS()) ? JSON.parse(readFileSync(APPROVALS(), 'utf8')) : {});

const results = [];
function t(name, pass, detail) {
  results.push({ name, pass: pass === null ? null : !!pass, detail: typeof detail === 'string' ? detail.slice(0, 400) : detail });
  const tag = pass === null ? 'INFO' : pass ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? ' :: ' + (typeof detail === 'string' ? detail.slice(0, 300) : JSON.stringify(detail).slice(0, 300)) : ''}`);
}
async function tc(name, fn) {
  try { await fn(); } catch (e) { t(name, false, 'EXCEPTION: ' + e.message); }
}
const WRITE_ARGS = ['ECS', 'NovaCreateServers', '--cli-region=cn-north-4', '--name=probe-approved'];

// ========== D4-18: confirm-not-deny 审批语义 ==========
await tc('D4-18 写操作 plan：需确认而非直接拒绝/直接放行', async () => {
  const p = await callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS });
  const pa = await callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS, allowWrites: true });
  // 契约: 未确认时 safeToRun=false + 提示需用户批准（非裸拒绝）；显式确认(allowWrites)后 allow（非静默放行，仍需 token 执行）
  const gate = p.safeToRun === false && /approval|approved/i.test(p.classification.reason || '') && typeof p.approvalToken === 'string' && p.approvalToken.length > 0;
  const confirm = pa.classification.decision === 'allow' && pa.classification.risk === 'write';
  t('D4-18 写操作 plan：需确认而非直接拒绝/直接放行', gate && confirm,
    `未确认: decision=${p.classification.decision} safeToRun=${p.safeToRun} reason="${(p.classification.reason || '').slice(0, 60)}" token=${p.approvalToken ? '有' : '无'} | 确认后: decision=${pa.classification.decision} risk=${pa.classification.risk}`);
});

await tc('D4-18 未确认（approvedByUser!=true）不放行', async () => {
  const p = await callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS });
  let err = null;
  try { await callTool('huaweicloud_run_approved_command', { args: WRITE_ARGS, approvalToken: p.approvalToken }); } catch (e) { err = e; }
  t('D4-18 未确认（approvedByUser!=true）不放行', err && /approvedByUser must be true/.test(err.message),
    `拦截=${!!err} msg=${err ? err.message.slice(0, 80) : '未拦截(直接执行!)'}`);
});

await tc('D4-18 无效令牌不放行', async () => {
  let err = null;
  try { await callTool('huaweicloud_run_approved_command', { args: WRITE_ARGS, approvalToken: '00000000-not-a-token', approvedByUser: true }); } catch (e) { err = e; }
  t('D4-18 无效令牌不放行', err && /Invalid or expired approval token/.test(err.message),
    `拦截=${!!err} msg=${err ? err.message.slice(0, 80) : '未拦截'}`);
});

await tc('D4-18 确认后放行执行（spawn 已尝试）且令牌一次性', async () => {
  const p = await callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS });
  const r = await callTool('huaweicloud_run_approved_command', { args: WRITE_ARGS, approvalToken: p.approvalToken, approvedByUser: true, timeoutMs: 15000 });
  const executed = r.approved === true && typeof r.exitCode === 'number' && String(r.stderr || '').includes('MODULE_NOT_FOUND'); // node 假 hcloud：spawn 尝试即证明放行
  let err2 = null;
  try { await callTool('huaweicloud_run_approved_command', { args: WRITE_ARGS, approvalToken: p.approvalToken, approvedByUser: true }); } catch (e) { err2 = e; }
  const oneTime = err2 && /Invalid or expired approval token/.test(err2.message);
  t('D4-18 确认后放行执行（spawn 已尝试）且令牌一次性', executed && oneTime,
    `approved=${r.approved} spawn已尝试=${typeof r.exitCode === 'number'} 复用令牌被拒=${!!oneTime}`);
});

// ========== D4-19: 确认流下预检仍生效 ==========
await tc('D4-19 高危命令（csms ShowSecretVersion）plan 即 deny', async () => {
  const p = await callTool('huaweicloud_plan_cli_command', { args: ['CSMS', 'ShowSecretVersion', '--cli-region=cn-north-4', '--secret-name=probe'] });
  t('D4-19 高危命令（csms ShowSecretVersion）plan 即 deny',
    p.classification.decision === 'deny' && p.safeToRun === false,
    `decision=${p.classification.decision} risk=${p.classification.risk} reason=${(p.classification.reason || '').slice(0, 80)}`);
});

await tc('D4-19 高危命令即便持有效令牌+用户确认仍被预检拦截', async () => {
  const p = await callTool('huaweicloud_plan_cli_command', { args: ['CSMS', 'ShowSecretVersion', '--cli-region=cn-north-4', '--secret-name=probe'] });
  let err = null;
  try {
    await callTool('huaweicloud_run_approved_command', {
      args: ['CSMS', 'ShowSecretVersion', '--cli-region=cn-north-4', '--secret-name=probe'],
      approvalToken: p.approvalToken, approvedByUser: true, timeoutMs: 15000,
    });
  } catch (e) { err = e; }
  t('D4-19 高危命令即便持有效令牌+用户确认仍被预检拦截',
    err && /denied|not allowed|blocked|deny/i.test(err.message),
    `拦截=${!!err} msg=${err ? err.message.slice(0, 120) : '!! 未拦截（高危命令被放行）'}`);
});

await tc('D4-19 令牌绑定的 args 被篡改后拒绝执行', async () => {
  const p = await callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS });
  let err = null;
  try {
    await callTool('huaweicloud_run_approved_command', {
      args: ['ECS', 'NovaCreateServers', '--cli-region=cn-south-1', '--name=probe-tampered'], // 篡改 region/name
      approvalToken: p.approvalToken, approvedByUser: true, timeoutMs: 15000,
    });
  } catch (e) { err = e; }
  t('D4-19 令牌绑定的 args 被篡改后拒绝执行',
    err && /do not match the approved plan/.test(err.message),
    `拦截=${!!err} msg=${err ? err.message.slice(0, 100) : '未拦截(篡改参数被执行!)'}`);
});

// ========== D4-24: 令牌过期（函数级；注入"时钟" = 改写 approvals.json createdAt） ==========
await tc('D4-24 过期令牌被拒（TTL 实际 300s，改写 createdAt 模拟）', async () => {
  const p = await callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS });
  const map = readApprovals();
  if (map[p.approvalToken]) {
    map[p.approvalToken].createdAt = Date.now() - 301 * 1000; // 推进 301s > TTL 300s
    writeFileSync(APPROVALS(), JSON.stringify(map), 'utf8');
  }
  let err = null;
  try { await callTool('huaweicloud_run_approved_command', { args: WRITE_ARGS, approvalToken: p.approvalToken, approvedByUser: true }); } catch (e) { err = e; }
  const expired = err && /Invalid or expired approval token/.test(err.message);
  // 过期拒绝后资源计数=0 由"从未 spawn"保证（无执行副作用）
  t('D4-24 过期令牌被拒（TTL 实际 300s，改写 createdAt 模拟）',
    expired,
    `过期令牌被拒=${!!expired}；注: 产品 APPROVAL_TTL_MS=300s，用例假设 60s（SPEC 观察）；真云资源计数部分 → BLOCKED`);
});

t('D4-24 真云资源计数/already_processed 云侧断言', null, '需真云创建最小规格资源并查询计数（tctest- 前缀）；本机无真云凭证 → 真云部分 BLOCKED（函数级过期+一次性已验证）');

// ---------- 汇总 ----------
const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const info = results.filter((r) => r.pass === null).length;
console.log(String.fromCharCode(10) + `=== d4-approval: ${pass} PASS / ${fail} FAIL / ${info} INFO / ${results.length} TOTAL ===`);
import { writeFileSync as wf } from 'node:fs';
wf(join(HERE, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
process.exit(0);
