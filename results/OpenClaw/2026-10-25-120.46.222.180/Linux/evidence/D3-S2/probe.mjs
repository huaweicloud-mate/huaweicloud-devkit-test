#!/usr/bin/env node
// D3-S2 场景-删 VPC 先确认（真实建删 + 归零）OpenClaw Linux 2026-10-25 fresh
import { pathToFileURL } from 'node:url';
const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const REGION = 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const vpcName = 'tctest-openclaw-s2-' + TS;
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 300) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}  ${String(detail).slice(0, 120)}`);
}
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }

const createArgs = ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.77.0/24'];
const cp = await call('huaweicloud_plan_cli_command', { args: createArgs, allowWrites: true });
const cr = await call('huaweicloud_run_approved_command', { args: createArgs, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
const vpcId = idOf(cr.stdout || '') || '';
const created = cr.ok === true && !!vpcId;
console.log('创建测试VPC ' + vpcName + ' -> id=' + vpcId.slice(0, 12));
check('测试 VPC 创建成功', created, 'vpcId=' + vpcId.slice(0, 12));

const delArgs = ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId];
const dp = await call('huaweicloud_plan_cli_command', { args: delArgs });
const needConfirm = dp.classification?.decision === 'deny' && !!dp.approvalToken;
console.log('plan DeleteVpc -> decision=' + dp.classification?.decision + ' hasToken=' + !!dp.approvalToken + ' safeToRun=' + dp.safeToRun);
check('plan DeleteVpc 要求确认(confirm-not-deny)', needConfirm, JSON.stringify(dp.classification));

const hk = await call('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --cli-region=' + REGION + ' --vpc_id=' + vpcId });
console.log('hook_check_command DeleteVpc -> decision=' + hk.decision + ' risk=' + hk.risk);
check('hook 预检 DeleteVpc 返回决策', typeof hk.decision === 'string', 'decision=' + hk.decision);

const roBefore = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
const stillThere = (roBefore.stdout || '').includes(vpcId);
console.log('未确认前 ListVpcs 仍含该 VPC = ' + stillThere);
check('未确认前零执行', stillThere, 'stillThere=' + stillThere);

const dr = await call('huaweicloud_run_approved_command', { args: delArgs, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
console.log('确认后 DeleteVpc -> ok=' + dr.ok);
const roAfter = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
const zeroed = !(roAfter.stdout || '').includes(vpcId) && !(roAfter.stdout || '').includes(vpcName);
console.log('删除后归零 = ' + zeroed);
check('确认后删除成功且归零', dr.ok === true && zeroed, 'ok=' + dr.ok + ' zeroed=' + zeroed);

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ case: 'D3-S2', status: results.some(r => !r.ok) ? 'FAIL' : 'PASS', total: results.length, passed: results.filter(r => r.ok).length, results }, null, 2));
process.exit(0);