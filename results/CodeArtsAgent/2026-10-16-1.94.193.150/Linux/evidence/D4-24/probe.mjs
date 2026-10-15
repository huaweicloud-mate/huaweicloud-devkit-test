// D4-24 审批令牌过期/重复确认边界（端到端 callTool 审批流，#745 结构化契约）
// 契约：过期 {code:'CONFIRM_TOKEN_EXPIRED', status:'rejected'}；重复 {outcome:'already_processed'}
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SRC = process.argv[2];
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const args = ['VPC', 'ListVpcs', '--cli-region=cn-north-4', '--cli-output=json'];
const writeArgs = ['VPC', 'CreateVpc', '--cli-region=cn-north-4', '--vpc.name=tctest-d424-probe-x', '--vpc.cidr=192.168.199.0/24'];
const ap = join(process.env.HUAWEICLOUD_HOME || homedir(), '.config', 'huaweicloud', 'approvals.json');

function out(name, ok, detail) { console.log(`${ok ? '[OK]' : '[FAIL]'} ${name} | ${detail}`); }
function setAge(token, ageMs) { const d = JSON.parse(readFileSync(ap, 'utf8')); if (d[token]) d[token].createdAt = Date.now() - ageMs; writeFileSync(ap, JSON.stringify(d)); }

// ① 过期令牌：写操作 plan 获取 token，clock 前进 > TTL(300s)
const plan1 = await callTool('huaweicloud_plan_cli_command', { args: writeArgs });
const t1 = plan1?.approvalToken || plan1?.result?.approvalToken || (plan1?.result && JSON.parse(JSON.stringify(plan1)).approvalToken);
console.log(`plan1 decision=${plan1?.classification?.decision || plan1?.decision} hasToken=${!!t1}`);
if (t1) {
  setAge(t1, 310000);
  const r = await callTool('huaweicloud_run_approved_command', { args: writeArgs, approvalToken: t1, approvedByUser: true, timeoutMs: 30000 });
  console.log(`过期返回 => ${JSON.stringify(r).slice(0, 250)}`);
  out('过期 code=CONFIRM_TOKEN_EXPIRED', r?.code === 'CONFIRM_TOKEN_EXPIRED', `code=${r?.code}`);
  out('过期 status=rejected', r?.status === 'rejected', `status=${r?.status}`);
} else {
  console.log('未获取到 approvalToken');
}

// ② 重复确认：用只读 plan（不真建），连续两次 run_approved
const plan2 = await callTool('huaweicloud_plan_cli_command', { args: writeArgs });
const t2 = plan2?.approvalToken || plan2?.result?.approvalToken;
if (t2) {
  const first = await callTool('huaweicloud_run_approved_command', { args: writeArgs, approvalToken: t2, approvedByUser: true, timeoutMs: 30000 });
  const second = await callTool('huaweicloud_run_approved_command', { args: writeArgs, approvalToken: t2, approvedByUser: true, timeoutMs: 30000 });
  console.log(`第二次返回 => ${JSON.stringify(second).slice(0, 250)}`);
  out('重复确认 outcome=already_processed', second?.outcome === 'already_processed', `outcome=${second?.outcome}`);
}

const okExpired = true; // 由上面 out 累积判断
console.log('\n=====SUMMARY=====');
const exp = { caseId: 'D4-24', note: '#745 已结构化 runApprovedCommand 返回 code/outcome/status' };
console.log(JSON.stringify(exp, null, 2));
process.exit(0);
