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

// SUT imports
const toolsBase = new URL(`file://${hdkSrc}/tools.mjs`);
const hcloudBase = new URL(`file://${hdkSrc}/hcloud-cli.mjs`);
const { callTool } = await import(toolsBase);
const { planHcloudCommand, consumeApprovalToken, hashArgs } = await import(hcloudBase);

// 隔离审批文件到临时目录
const tmpHome = join(tmpdir(), `d4-18-${Date.now()}`);
mkdirSync(join(tmpHome, '.config', 'huaweicloud'), { recursive: true });
const oldHome = process.env.HUAWEICLOUD_HOME;
process.env.HUAWEICLOUD_HOME = tmpHome;

// Mock hcloud 二进制：用 /bin/echo 替代真实 hcloud，使 runHcloud 成功返回（exit 0）
// 传入 stdin:'' 跳过 stdin 写入，避免 EPIPE（/bin/echo 不读 stdin）
const oldHcloudBin = process.env.HCLOUD_BIN;
process.env.HCLOUD_BIN = '/bin/echo';

try {
  const writeArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.flavor_id=s6.small.1', '--server.image_id=abc123'];
  const plan = planHcloudCommand(writeArgs, { allowWrites: false });
  const approvalToken = plan.approvalToken;

  // ① approvedByUser=false → deny
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
    rec('D4-18-false-deny', 'approvedByUser=false -> deny（拒绝执行）',
        threw && /approvedByUser must be true/.test(errMsg),
        { threw, errMsg: errMsg.slice(0, 80) },
        { threw: true, errMsgContains: 'approvedByUser must be true' });
  }

  // ② approvedByUser=true → 通过审批门禁 + 执行成功（mock hcloud=/bin/echo, stdin:'' 避免 EPIPE）
  {
    const plan2 = planHcloudCommand(writeArgs, { allowWrites: false });
    let threw = false;
    let errMsg = '';
    let resultOk = false;
    try {
      const result = await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken: plan2.approvalToken,
        approvedByUser: true,
        stdin: '',
      });
      resultOk = result?.ok === true || result?.approved === true;
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-18-true-allow', 'approvedByUser=true -> 通过审批门禁 + 执行成功（mock hcloud=/bin/echo）',
        !threw && resultOk,
        { threw, errMsg: errMsg.slice(0, 80), resultOk },
        { threw: false, resultOk: true },
        threw ? `unexpected throw: ${errMsg.slice(0, 120)}` : 'approval gate passed, execution succeeded');
  }

  // ③ 缺 approvedByUser 字段 → deny
  {
    const plan3 = planHcloudCommand(writeArgs, { allowWrites: false });
    let threw = false;
    let errMsg = '';
    try {
      await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken: plan3.approvalToken,
      });
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-18-missing-field-deny', '缺 approvedByUser 字段 -> 不静默 deny（strict !== true 拒绝）',
        threw && /approvedByUser must be true/.test(errMsg),
        { threw, errMsg: errMsg.slice(0, 80) },
        { threw: true, errMsgContains: 'approvedByUser must be true' });
  }

  // ④ approvedByUser='true'（字符串）→ strict !== true → deny
  {
    const plan4 = planHcloudCommand(writeArgs, { allowWrites: false });
    let threw = false;
    let errMsg = '';
    try {
      await callTool('huaweicloud_run_approved_command', {
        args: writeArgs,
        approvalToken: plan4.approvalToken,
        approvedByUser: 'true',
      });
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    rec('D4-18-string-true-deny', 'approvedByUser="true"(字符串) -> strict !== true -> deny',
        threw && /approvedByUser must be true/.test(errMsg),
        { threw, errMsg: errMsg.slice(0, 80) },
        { threw: true, errMsgContains: 'approvedByUser must be true' });
  }

  // ⑤ plan 生成 token → consumeApprovalToken 成功消费
  {
    const plan5 = planHcloudCommand(writeArgs, { allowWrites: false });
    const consumed = consumeApprovalToken(plan5.approvalToken);
    rec('D4-18-token-create-consume', 'plan 生成 token -> consume 成功消费',
        consumed !== null && consumed.argsHash === hashArgs(writeArgs),
        { consumed: !!consumed, hashMatch: consumed?.argsHash === hashArgs(writeArgs) },
        { consumed: true, hashMatch: true });
  }

  // ⑥ 重复消费同一 token → null（防重放）
  {
    const plan6 = planHcloudCommand(writeArgs, { allowWrites: false });
    const token6 = plan6.approvalToken;
    const first = consumeApprovalToken(token6);
    const second = consumeApprovalToken(token6);
    rec('D4-18-token-no-replay', 'token 重复消费 -> 返回 null（防重放）',
        first !== null && second === null,
        { first: !!first, second: !!second },
        { first: true, second: false });
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
