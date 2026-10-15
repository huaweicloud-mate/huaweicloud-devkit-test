// D11-33 审批被拒 / 超时 / 挂起全路径（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：拒绝返回中文「操作已按你的决定取消」且说明「资源未发生变更」；
//   超时返回中文「等待审批超时」且给出可重试指引；两情形经只读复核均无资源变更。
//
// 覆盖（两条可在无真云环境判定的路径）：
//   ① 拒绝路径：以 hook 协议 spawn huaweicloud-safety.py，喂「未审批写命令」→ 读 deny 理由文案；
//   ② 超时/无效令牌路径：callTool huaweicloud_run_approved_command（无效 token）→ 读提示与重试指引。
//   「资源未发生变更」的只读复核需真云，由 D11-34 载体在真机覆盖（此处只判文案面，并在备注中标明）。
// 口径：需求验收（UX-R9/R10 审批闭环）。实现前预期 FAIL。
// 用法: node d11-33-approval-paths.mjs <hdk src> [--evid <dir>]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { blocked, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-33';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-33-approval-paths.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const ZH = /[\u4e00-\u9fff]/;

// ---- ① 拒绝路径：hook 拦截文案 ----
const hook = join(hdkSrc, '..', 'hooks', 'huaweicloud-safety.py');
const PY = ['python', 'python3'].find((c) => spawnSync(c, ['--version'], { encoding: 'utf8' }).status === 0);
let denyReason = '';
if (!existsSync(hook)) {
  denyReason = `（未找到 hook：${hook}）`;
} else if (!PY) {
  denyReason = '（宿主无 python，无法运行 hook）';
} else {
  const r = await new Promise((resolve) => {
    const p = spawn(PY, [hook], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.on('close', () => resolve(out));
    p.stdin.end(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'hcloud ECS DeleteServers --server_id=abc-123' } }));
  });
  try {
    const j = JSON.parse(r.trim());
    denyReason = String(j?.hookSpecificOutput?.permissionDecisionReason ?? j?.permissionDecisionReason ?? r);
  } catch { denyReason = r; }
}

rec('D11-33-deny-zh', '拒绝路径返回中文「操作已按你的决定取消」',
  ZH.test(denyReason) && /取消|已拒绝|已按你的决定/.test(denyReason), denyReason.slice(0, 150), '含中文取消语义');
rec('D11-33-deny-no-change', '拒绝路径说明「资源未发生变更」',
  /资源.{0,6}(未|没有).{0,6}(变更|变化|修改)|未创建任何/.test(denyReason), denyReason.slice(0, 150), '含「资源未发生变更」');

// ---- ② 超时 / 无效令牌路径 ----
const iso = isolateHome('d11-33');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');
let approved = '';
try {
  const r = await callTool('huaweicloud_run_approved_command', { token: 'd11-33-invalid-token' });
  approved = JSON.stringify(r ?? {});
} catch (e) {
  approved = String(e?.message ?? e);
}

rec('D11-33-timeout-zh', '无效/超时审批返回中文提示（等待审批超时 / 令牌失效）',
  ZH.test(approved) && /超时|已失效|无效|过期/.test(approved), approved.slice(0, 150), '含中文超时/失效语义');
rec('D11-33-retry-hint', '给出可重试指引（重新 plan / 再次确认）',
  /重试|重新|再执行|again|retry/i.test(approved) && /huaweicloud_plan_cli_command|plan|确认/.test(approved),
  approved.slice(0, 150), '含重试指引');
iso.restore();

finish(CASE_ID, evid,
  '口径: 需求验收（UX-R9/R10）；「资源未发生变更」的只读复核属真机项，由 D11-34 载体在真机覆盖');
