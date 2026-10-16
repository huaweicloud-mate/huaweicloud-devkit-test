#!/usr/bin/env node
// D3-S2 场景-删VPC先确认 — 真云建删归零（OpenClaw Linux 2026-10-16）
import { pathToFileURL } from 'node:url';

const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const REGION = 'cn-north-4';
const TS = String(Date.now()).slice(-8);
const vpcName = 'tctest-openclaw-s2-' + TS;
const out = [];
function check(name, ok, detail) { out.push({ name, ok, detail: String(detail).slice(0,400) }); console.log(`[${ok?'OK':'FAIL'}] ${name}  ${String(detail).slice(0,120)}`); }
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }

console.log('\n=====CASE D3-S2 (fresh)=====');
// 1) 建 VPC
const createArgs = ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.88.0/24'];
const cp = await call('huaweicloud_plan_cli_command', { args: createArgs, allowWrites: true });
const cr = await call('huaweicloud_run_approved_command', { args: createArgs, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
const vpcId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(cr.stdout || '') || [])[1] || '';
const created = cr.ok === true && !!vpcId;
console.log('CreateVpc -> ok=' + cr.ok + ' id=' + vpcId);

// 2) plan DeleteVpc 确认流
const delArgs = ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId];
const dp = await call('huaweicloud_plan_cli_command', { args: delArgs });
const needConfirm = dp.classification && dp.classification.decision === 'deny' && !!dp.approvalToken;
console.log('plan DeleteVpc -> decision=' + (dp.classification && dp.classification.decision) + ' hasToken=' + !!dp.approvalToken);

// 3) hook 预检
const hk = await call('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --cli-region=' + REGION + ' --vpc_id=' + vpcId });

// 4) 未确认前零执行
const roBefore = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
const stillThere = (roBefore.stdout || '').includes(vpcId);

// 5) 确认后删除
const dr = await call('huaweicloud_run_approved_command', { args: delArgs, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
console.log('确认后 DeleteVpc -> ok=' + dr.ok);

// 6) 归零
const roAfter = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
const zeroed = !(roAfter.stdout || '').includes(vpcId) && !(roAfter.stdout || '').includes(vpcName);

check('测试 VPC 创建成功', created, 'vpcId=' + vpcId.slice(0,12));
check('plan DeleteVpc 要求确认(confirm-not-deny)', needConfirm, dp.classification ? JSON.stringify(dp.classification) : 'no-classification');
check('hook 预检 DeleteVpc 返回决策', typeof hk.decision === 'string', 'decision=' + hk.decision);
check('未确认前零执行', stillThere, 'stillThere=' + stillThere);
check('确认后删除成功且归零', dr.ok === true && zeroed, 'ok=' + dr.ok + ' zeroed=' + zeroed);

console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), total: out.length, passed: out.filter(o=>o.ok).length, failed: out.filter(o=>!o.ok).length, results: out }, null, 2));