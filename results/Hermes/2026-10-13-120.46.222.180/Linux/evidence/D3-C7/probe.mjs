#!/usr/bin/env node
// D3-C7 跨区域资源操作引导（区域维度）真云 E2E
// 断言:
//   1. plan 命令含目标 --cli-region=ap-southeast-3 (参数级断言, 唯一)
//   2. get_regional_availability 预查返回结构化结果
//   3. 非默认 region 只读查询 (ListServersDetails) 可执行 (空=count 0 或 Ecs.0200)
//   4. 创建最小 EIP (tctest- 前缀, 5_bgp/1M/PER) → 释放 → ListPublicips 归零
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.env.HDK_PLUGIN_SRC || join(homedir(), 'devkit-test', 'Hermes', 'hdk', 'plugins', 'huaweicloud-core');
const REGION = 'ap-southeast-3';
const HOME_REGION = process.env.HDK_REGION || 'cn-north-4';
const TAG = `tctest-eip-${String(Date.now()).slice(-9)}`;
const { callTool } = await import(pathToFileURL(join(SRC, 'src', 'tools.mjs')).href);

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail: String(detail).slice(0, 260) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' | ' + detail : ''}`);
}

let publicipId = null;

async function approve(args) {
  const plan = await callTool('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (plan?.classification?.decision !== 'allow' || !plan?.approvalToken) return { plan };
  const run = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
  return { plan, run };
}

try {
  // 1) 参数级断言: plan 命令含 --cli-region=ap-southeast-3
  const p1 = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', `--cli-region=${REGION}`], allowWrites: false });
  const cmd1 = p1?.command || JSON.stringify(p1);
  check('D3-C7 plan(ListServersDetails) 含 --cli-region=ap-southeast-3', /--cli-region=ap-southeast-3/.test(cmd1), cmd1.slice(0, 160));

  const p2 = await callTool('huaweicloud_plan_cli_command', { args: ['EIP', 'ListPublicips', `--cli-region=${REGION}`], allowWrites: false });
  const cmd2 = p2?.command || JSON.stringify(p2);
  check('D3-C7 plan(ListPublicips) 含 --cli-region=ap-southeast-3', /--cli-region=ap-southeast-3/.test(cmd2), cmd2.slice(0, 160));

  // 2) get_regional_availability 预查
  const avail = await callTool('huaweicloud_get_regional_availability', { service: 'ecs', region: REGION });
  check('D3-C7 get_regional_availability(ecs, ap-southeast-3) 结构化返回', avail && typeof avail === 'object' && 'available' in avail,
    JSON.stringify(avail).slice(0, 160));

  // 3) 非默认 region 只读查询 (ListServersDetails)
  const ro = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', `--cli-region=${REGION}`] });
  const roOk = ro?.ok === true || ro?.exitCode === 0;
  const roText = JSON.stringify(ro).slice(0, 300);
  const has0200 = /Ecs\.0200|ECS\.0200/.test(roText);
  check('D3-C7 非默认 region 只读查询可执行(count=0 或 Ecs.0200 非裸404)', roOk || has0200, roText);

  // 4) 创建最小 EIP → 释放 → 归零
  const createArgs = ['EIP', 'CreatePublicip', '--publicip.type=5_bgp', '--bandwidth.size=1', '--bandwidth.share_type=PER', `--bandwidth.name=${TAG}`, `--cli-region=${REGION}`];
  const { plan: cp, run: cr } = await approve(createArgs);
  const cc = cp?.command || JSON.stringify(cp);
  check('D3-C7 plan(CreatePublicip) 含 --cli-region=ap-southeast-3 (参数级)', /--cli-region=ap-southeast-3/.test(cc), cc.slice(0, 160));
  const crText = cr?.stdout || JSON.stringify(cr);
  const id = (/\"id\"\s*:\s*\"([0-9a-fA-F-]{36})\"/.exec(crText) || /\"publicip_id\"\s*:\s*\"([0-9a-fA-F-]{36})\"/.exec(crText) || [])[1];
  publicipId = id || null;
  check('D3-C7 创建 EIP 成功并返回 id', !!id, id ? `id=${id.slice(0, 12)}` : crText.slice(0, 160));

  if (publicipId) {
    const { run: dr } = await approve(['EIP', 'DeletePublicip', `--publicip_id=${publicipId}`, `--cli-region=${REGION}`]);
    check('D3-C7 释放 EIP 成功', dr?.ok === true || dr?.exitCode === 0, JSON.stringify(dr).slice(0, 120));
    const lr = await callTool('huaweicloud_run_readonly_command', { args: ['EIP', 'ListPublicips', `--cli-region=${REGION}`] });
    const lrText = JSON.stringify(lr);
    const leftover = new RegExp(publicipId).test(lrText) || new RegExp(TAG).test(lrText);
    check('D3-C7 释放后 ListPublicips 不再含本次 EIP(归零)', !leftover, leftover ? '发现残留' : '归零');
  }
} catch (e) {
  check('D3-C7 探针异常', false, String(e).slice(0, 220));
} finally {
  const failed = results.filter(x => !x.pass).length;
  const out = {
    case: 'D3-C7',
    SUT: 'huaweicloud-devkit 1.1.8-next.3 (gitHead 1afbcf1)',
    region: REGION,
    status: failed === 0 ? 'PASS' : 'FAIL',
    total: results.length, passed: results.length - failed, failed,
    results,
  };
  console.log('\n=== D3-C7 RESULT ===\n' + JSON.stringify(out, null, 2));
  const ev = process.env.HDK_EVIDENCE;
  if (ev) {
    mkdirSync(join(ev, 'D3-C7'), { recursive: true });
    writeFileSync(join(ev, 'D3-C7', 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
  }
  process.exit(failed === 0 ? 0 : 1);
}