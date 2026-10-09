// D4-18 confirm-not-deny 审批语义夹具
// 协议层 harness：approvedByUser 三态语义验证
//   approvedByUser=false → deny（拒绝执行）
//   approvedByUser=true → allow+warn（允许执行，带警告）
//   缺 approvedByUser 字段 → 不静默 deny（strict !== true 拒绝）
// 用法: node d4-18-confirm-not-deny.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D4-18/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d4-18-confirm-not-deny.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// SUT imports: tools.mjs → callTool (huaweicloud_run_approved_command)
//             hcloud-cli.mjs → planHcloudCommand, createApprovalToken, consumeApprovalToken
const toolsBase = new URL(`file://${hdkSrc}/tools.mjs`);
const hcloudBase = new URL(`file://${hdkSrc}/hcloud-cli.mjs`);
const { callTool } = await import(toolsBase);
const { planHcloudCommand, createApprovalToken, consumeApprovalToken, hashArgs } = await import(hcloudBase);

// 隔离审批文件到临时目录
const tmpHome = join(tmpdir(), `d4-18-${Date.now()}`);
mkdirSync(join(tmpHome, '.config', 'huaweicloud'), { recursive: true });
const oldHome = process.env.HUAWEICLOUD_HOME;
process.env.HUAWEICLOUD_HOME = tmpHome;

try {
  // 准备：plan 一个写命令获取 approvalToken
  const writeArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.flavor_id=s6.small.1', '--server.image_id=abc123'];
  const plan = planHcloudCommand(writeArgs, { allowWrites: false });
  const approvalToken = plan.approvalToken;

  // ① approvedByUser=false → deny（拒绝执行）
  // callTool('huaweicloud_run_approved_command', { args: writeArgs, approvalToken, approvedByUser: false })
  // 应该 throw Error: 'approvedByUser must be true...'
  {
    let threw = false;
    let errMsg = '';
    try {
      await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken,
        approvedByUser: false,
      });
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-18-false-deny', 'approvedByUser=false → deny（拒绝执行）',
        threw && /approvedByUser must be true/.test(errMsg),
        { threw, errMsg: errMsg.slice(0, 80) },
        { threw: true, errMsgContains: 'approvedByUser must be true' });
  }

  // ② approvedByUser=true → allow（不因 approvedByUser 被拒绝）
  // 注意：callTool 会继续执行 runHcloud（需要 hcloud），但 approvedByUser 检查会通过
  // 我们验证的是：不会因 approvedByUser 抛出，而是因为 token 消费后继续执行
  // token 已在 ① 中未被消费（因为 ① 在 runApprovedCommand 入口即抛出）
  {
    let threw = false;
    let errMsg = '';
    try {
      await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken,
        approvedByUser: true,
      });
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    // approvedByUser=true 通过审批门禁 → 不因 approvedByUser 抛出
    // 可能因 hcloud 未安装或 token 消费抛出，但不应该是 'approvedByUser must be true'
    const passedApprovalGate = !threw || !/approvedByUser must be true/.test(errMsg);
    rec('D4-18-true-allow', 'approvedByUser=true → 通过审批门禁（不因 approvedByUser 拒绝）',
        passedApprovalGate,
        { threw, errMsg: errMsg.slice(0, 80) },
        { approvalGatePassed: true },
        threw ? `threw but not approval gate: ${errMsg.slice(0, 120)}` : 'no throw from approval gate');
  }

  // ③ 缺 approvedByUser 字段（undefined）→ 不静默 deny（strict !== true 拒绝）
  {
    // 重新 plan 获取新 token（上一个已被消费）
    const plan2 = planHcloudCommand(writeArgs, { allowWrites: false });
    const token2 = plan2.approvalToken;

    let threw = false;
    let errMsg = '';
    try {
      await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken: token2,
        // approvedByUser 不传 → undefined
      });
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-18-missing-field-deny', '缺 approvedByUser 字段 → 不静默 deny（strict !== true 拒绝）',
        threw && /approvedByUser must be true/.test(errMsg),
        { threw, errMsg: errMsg.slice(0, 80) },
        { threw: true, errMsgContains: 'approvedByUser must be true' });
  }

  // ④ approvedByUser 非布尔值（如 'true' 字符串）→ strict 比较 !== true → deny
  {
    const plan3 = planHcloudCommand(writeArgs, { allowWrites: false });
    const token3 = plan3.approvalToken;

    let threw = false;
    let errMsg = '';
    try {
      await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken: token3,
        approvedByUser: 'true', // 字符串而非布尔
      });
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-18-string-true-deny', 'approvedByUser="true"(字符串) → strict !== true → deny',
        threw && /approvedByUser must be true/.test(errMsg),
        { threw, errMsg: errMsg.slice(0, 80) },
        { threw: true, errMsgContains: 'approvedByUser must be true' });
  }

  // ⑤ approvalToken 验证：plan 生成 token → consumeApprovalToken 成功消费
  {
    const plan4 = planHcloudCommand(writeArgs, { allowWrites: false });
    const token4 = plan4.approvalToken;
    const consumed = consumeApprovalToken(token4);
    rec('D4-18-token-create-consume', 'plan 生成 token → consume 成功消费',
        consumed !== null && consumed.argsHash === hashArgs(writeArgs),
        { consumed: !!consumed, hashMatch: consumed?.argsHash === hashArgs(writeArgs) },
        { consumed: true, hashMatch: true });
  }

  // ⑥ 重复消费同一 token → 返回 null（防重放）
  {
    const plan5 = planHcloudCommand(writeArgs, { allowWrites: false });
    const token5 = plan5.approvalToken;
    const first = consumeApprovalToken(token5);
    const second = consumeApprovalToken(token5);
    rec('D4-18-token-no-replay', 'token 重复消费 → 返回 null（防重放）',
        first !== null && second === null,
        { first: !!first, second: !!second },
        { first: true, second: false });
  }
} finally {
  if (oldHome === undefined) delete process.env.HUAWEICLOUD_HOME;
  else process.env.HUAWEICLOUD_HOME = oldHome;
  rmSync(tmpHome, { recursive: true, force: true });
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D4-18 confirm-not-deny 审批语义夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D4-18');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D4-18 confirm-not-deny 审批语义夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
