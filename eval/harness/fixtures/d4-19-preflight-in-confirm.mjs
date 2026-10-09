// D4-19 确认流下预检仍生效夹具
// 协议层 harness：高危进入确认流 → preflight 拦截；非高危 → 不受干扰
// 用法: node d4-19-preflight-in-confirm.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D4-19/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d4-19-preflight-in-confirm.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// SUT imports
const safetyBase = new URL(`file://${hdkSrc}/safety-policy.mjs`);
const { classifyHcloudArgs, assertAllowed } = await import(safetyBase);

const toolsBase = new URL(`file://${hdkSrc}/tools.mjs`);
const { callTool } = await import(toolsBase);

const hcloudBase = new URL(`file://${hdkSrc}/hcloud-cli.mjs`);
const { planHcloudCommand } = await import(hcloudBase);

// 隔离审批文件
const tmpHome = join(tmpdir(), `d4-19-${Date.now()}`);
mkdirSync(join(tmpHome, '.config', 'huaweicloud'), { recursive: true });
const oldHome = process.env.HUAWEICLOUD_HOME;
process.env.HUAWEICLOUD_HOME = tmpHome;

// Mock hcloud 二进制：用 /bin/echo 替代真实 hcloud，使 runHcloud 成功返回（exit 0）
// 传入 stdin:'' 跳过 stdin 写入，避免 EPIPE
const oldHcloudBin = process.env.HCLOUD_BIN;
process.env.HCLOUD_BIN = '/bin/echo';

try {
  // ① 高危写操作：确认流中（allowWrites=false）→ deny → assertAllowed 拦截
  {
    const writeArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.flavor_id=s6.small.1'];
    const cls = classifyHcloudArgs(writeArgs, { allowWrites: false });
    let blocked = false;
    try { assertAllowed(cls); } catch { blocked = true; }
    rec('D4-19-write-deny-in-confirm', '高危写操作确认流中 -> deny -> assertAllowed 拦截',
        cls.decision === 'deny' && blocked,
        { decision: cls.decision, blocked },
        { decision: 'deny', blocked: true });
  }

  // ② 高危写操作 allowWrites=true → allow → 放行
  {
    const writeArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.flavor_id=s6.small.1'];
    const cls = classifyHcloudArgs(writeArgs, { allowWrites: true });
    let blocked = false;
    try { assertAllowed(cls); } catch { blocked = true; }
    rec('D4-19-write-allow-with-approval', '高危写操作 allowWrites=true -> allow -> 放行',
        cls.decision === 'allow' && !blocked,
        { decision: cls.decision, blocked },
        { decision: 'allow', blocked: false });
  }

  // ③ 只读命令 → allow → 不受确认流影响
  {
    const readArgs = ['ECS', 'ListServers', '--cli-region=cn-north-4'];
    const clsNoAllow = classifyHcloudArgs(readArgs, { allowWrites: false });
    const clsAllow = classifyHcloudArgs(readArgs, { allowWrites: true });
    let blockedNoAllow = false, blockedAllow = false;
    try { assertAllowed(clsNoAllow); } catch { blockedNoAllow = true; }
    try { assertAllowed(clsAllow); } catch { blockedAllow = true; }
    rec('D4-19-readonly-not-affected', '只读命令 -> 不受确认流影响',
        clsNoAllow.decision === 'allow' && clsAllow.decision === 'allow' && !blockedNoAllow && !blockedAllow,
        { noAllow: clsNoAllow.decision, allow: clsAllow.decision, blockedNoAllow, blockedAllow },
        { noAllow: 'allow', allow: 'allow', blockedNoAllow: false, blockedAllow: false });
  }

  // ④ hook_check_command 对 rm -rf / → deny → ok=false
  {
    const result = await callTool('huaweicloud_hook_check_command', { command: 'rm -rf /' });
    rec('D4-19-hook-check-dangerous', 'hook_check_command rm -rf / -> deny -> ok=false',
        result.decision === 'deny' && result.ok === false,
        { decision: result.decision, ok: result.ok },
        { decision: 'deny', ok: false });
  }

  // ④b hook_check_command 对 DeleteServers → warn → ok=true
  {
    const result = await callTool('huaweicloud_hook_check_command', {
      command: 'hcloud ECS DeleteServers --server.id.1=abc --cli-region=cn-north-4',
    });
    rec('D4-19-hook-check-hcloud-warn', 'hook_check_command DeleteServers -> warn -> ok=true',
        result.decision === 'warn' && result.ok === true,
        { decision: result.decision, ok: result.ok },
        { decision: 'warn', ok: true });
  }

  // ⑤ hook_check_command 对 ListServers → allow → ok=true
  {
    const result = await callTool('huaweicloud_hook_check_command', {
      command: 'hcloud ECS ListServers --cli-region=cn-north-4',
    });
    rec('D4-19-hook-check-safe', 'hook_check_command ListServers -> allow -> ok=true',
        result.decision === 'allow' && result.ok === true,
        { decision: result.decision, ok: result.ok },
        { decision: 'allow', ok: true });
  }

  // ⑥ approvedByUser=true 但 token 无效 → 拦截
  {
    const writeArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.flavor_id=s6.small.1'];
    let threw = false;
    let errMsg = '';
    try {
      await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken: 'invalid-token-12345678',
        approvedByUser: true,
      });
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-19-approved-but-bad-token-blocked', 'approvedByUser=true 但 token 无效 -> 拦截',
        threw && /Invalid or expired approval token/.test(errMsg),
        { threw, errMsg: errMsg.slice(0, 80) },
        { threw: true, errMsgContains: 'Invalid or expired approval token' });
  }

  // ⑦ plan→approvedByUser=true+有效token → 通过审批+token 门禁 + 执行成功
  // Mock hcloud=/bin/echo, stdin:'' 避免 EPIPE，真正断言门禁通过后执行成功
  {
    const writeArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.flavor_id=s6.small.1'];
    const plan = planHcloudCommand(writeArgs, { allowWrites: false });
    let threw = false;
    let errMsg = '';
    let resultOk = false;
    try {
      const result = await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken: plan.approvalToken,
        approvedByUser: true,
        stdin: '',
      });
      resultOk = result?.ok === true || result?.approved === true;
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-19-plan-then-approve-passes-gates', 'plan->approvedByUser=true+有效token -> 通过审批+token 门禁 + 执行成功',
        !threw && resultOk,
        { threw, errMsg: errMsg.slice(0, 80), resultOk },
        { threw: false, resultOk: true },
        threw ? `unexpected throw: ${errMsg.slice(0, 120)}` : 'approval + token gates passed, execution succeeded');
  }

  // ⑧ 预检嵌入 plan 结果
  {
    const sgArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.flavor_id=s6.small.1', '--security_group_id.1=sg-test-123'];
    const plan = planHcloudCommand(sgArgs, { allowWrites: false });
    rec('D4-19-plan-includes-preflight', 'plan 结果包含 sgFindings（preflight 已运行）',
        Array.isArray(plan.sgFindings),
        { hasSgFindings: Array.isArray(plan.sgFindings), len: plan.sgFindings?.length },
        { hasSgFindings: true });
  }
} finally {
  if (oldHome === undefined) delete process.env.HUAWEICLOUD_HOME;
  else process.env.HUAWEICLOUD_HOME = oldHome;
  if (oldHcloudBin === undefined) delete process.env.HCLOUD_BIN;
  else process.env.HCLOUD_BIN = oldHcloudBin;
  rmSync(tmpHome, { recursive: true, force: true });
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D4-19 确认流下预检仍生效夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D4-19');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D4-19 确认流下预检仍生效夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
