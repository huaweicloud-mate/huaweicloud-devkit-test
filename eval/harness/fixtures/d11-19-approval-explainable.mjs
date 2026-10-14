// D11-19 写操作审批可解释性（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：返回含中文拦截理由且给出「先 plan 再 approve」两点可执行指引
//   （含工具名 huaweicloud_plan_cli_command / huaweicloud_run_approved_command）；
//   不出现纯英文 "unapproved Huawei Cloud write operations must be planned first and explicitly approved by the user." 裸串。
// 指引来源：evaluate(huaweicloud-safety.py:185-186)
//
// 做法：以 hook 协议（stdin JSON：{tool_name, tool_input}）spawn 目标源码的 hook 脚本，
// 喂一条「未审批的写命令」，读其 permissionDecisionReason。
// 口径：需求验收（UX-R9）。实现前预期 FAIL。
// 用法: node d11-19-approval-explainable.mjs <hdk src> [--evid <dir>]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { blocked, finish, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-19';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-19-approval-explainable.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

// hook 脚本位于 <plugin>/hooks/（hdkSrc = <plugin>/src）
const hook = join(hdkSrc, '..', 'hooks', 'huaweicloud-safety.py');
if (!existsSync(hook)) {
  blocked(CASE_ID, `未找到 hook 脚本：${hook}`, evid);
}

// 选一个可用的 python 解释器（Windows 用 python，Linux 常见 python3）
const PY = ['python', 'python3'].find((c) => {
  const r = spawnSync(c, ['--version'], { encoding: 'utf8' });
  return r.status === 0;
});
if (!PY) blocked(CASE_ID, '宿主无 python 解释器（无法运行 hook 脚本）', evid);

const payload = JSON.stringify({
  tool_name: 'Bash',
  tool_input: { command: 'hcloud ECS DeleteServers --server_id=abc-123' },
});

const r = await new Promise((resolve) => {
  const p = spawn(PY, [hook], { stdio: ['pipe', 'pipe', 'pipe'] });
  let out = '';
  let err = '';
  p.stdout.on('data', (d) => { out += d.toString(); });
  p.stderr.on('data', (d) => { err += d.toString(); });
  p.on('close', (code) => resolve({ code, out, err }));
  p.stdin.end(payload);
});

const all = `${r.out}\n${r.err}`;
let decision = null;
try {
  decision = JSON.parse(r.out.trim());
} catch { /* 非 JSON 输出时按裸文本判定 */ }
const reason = String(
  decision?.hookSpecificOutput?.permissionDecisionReason ?? decision?.permissionDecisionReason ?? r.out,
);

rec('D11-19-deny', '未审批写命令被拦截（permissionDecision=deny）',
  decision?.hookSpecificOutput?.permissionDecision === 'deny' ||
    /deny|blocked|拦截|拒绝/.test(`${decision?.hookSpecificOutput?.permissionDecision ?? ''}${reason}`),
  decision?.hookSpecificOutput?.permissionDecision ?? reason.slice(0, 80), 'deny');
rec('D11-19-reason-zh', '拦截理由含中文（面向用户可读）', /[\u4e00-\u9fff]/.test(reason),
  reason.slice(0, 140), '含中文字符');
rec('D11-19-two-steps', '给出两点可执行指引（含 plan 与 run_approved 工具名）',
  /huaweicloud_plan_cli_command/.test(reason) && /huaweicloud_run_approved_command/.test(reason),
  { plan: /huaweicloud_plan_cli_command/.test(reason), approve: /huaweicloud_run_approved_command/.test(reason) },
  '含 huaweicloud_plan_cli_command 与 huaweicloud_run_approved_command');
rec('D11-19-no-en', '不出现英文整句裸串（反断言）',
  !/unapproved Huawei Cloud write operations must be planned first and explicitly approved by the user\./.test(all),
  reason.slice(0, 140), '不含该英文整句');

finish(CASE_ID, evid, '口径: 需求验收（UX-R9）；FAIL = 拦截文案未中文化/缺两点指引，非 harness 问题');
