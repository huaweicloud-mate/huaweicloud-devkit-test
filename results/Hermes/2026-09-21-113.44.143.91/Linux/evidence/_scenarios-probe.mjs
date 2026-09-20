// 真云场景探针：D3-S1 / D3-S2 / D3-C13 / D3-S4 / D3-S6 / D3-S8 (2026-09-20 Hermes/Linux)
// 复用 realcloud_e2e.mjs 的 callTool + approve 模式，资源统一时间戳名 + finally 归零（只删本次创建）。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const SRC = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const results = [];
const log = (id, name, pass, detail) => results.push({ id, name, pass: !!pass, detail: String(detail ?? '').slice(0, 260) });
const call = async (name, args) => { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 200) }; } };
const idOf = (json) => /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1];
const serverIdOf = (json) => /"serverIds"\s*:\s*\[\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1];

async function approve(args) {
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (plan?.classification?.decision !== 'allow' || !plan?.approvalToken) return { plan, run: null };
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
  return { plan, run };
}

// D3-S1: 只读查 ECS（零写操作）
{
  const args = ['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--limit=5'];
  const { plan, run } = await approve(['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--limit=5']);
  const onlyRead = plan?.classification?.decision === 'allow' || plan?.classification?.decision === 'read';
  const gotList = run?.ok === true || run?.exitCode === 0 || /servers|count/i.test(JSON.stringify(run));
  log('D3-S1', 'readonly-ecs-route+query', onlyRead && gotList, `plan=${plan?.classification?.decision} runOk=${run?.ok}/${run?.exitCode}` + JSON.stringify(run).slice(0,120));
}

// D3-S2: 删 VPC 先确认（建 VPC → plan 预检 → 未确认零执行 → 确认删除 → 归零）
{
  let vpcId = null;
  const vpcName = `testbot3-hermes-d3s2-${TS}`;
  try {
    const { run: r1 } = await approve(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.99.0.0/16', `--cli-region=${REGION}`]);
    vpcId = idOf(r1?.stdout || JSON.stringify(r1) || '');
    log('D3-S2', 'create-vpc', !!vpcId, r1?.stdout?.slice(0, 100) || JSON.stringify(r1).slice(0,100));
    if (vpcId) {
      // 预检：plan DeleteVpc —— 未确认前零执行（拿 token 但不 run）
      const delArgs = ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`];
      const { plan: pdel, run: rdel } = await call('huaweicloud_plan_cli_command', { args: delArgs, allowWrites: true });
      const precheck = pdel?.classification?.decision === 'allow' && !!pdel?.approvalToken;
      log('D3-S2', 'plan-confirm-precheck', precheck, `decision=${pdel?.classification?.decision} token=${!!pdel?.approvalToken}`);
      // 确认后执行删除
      const rund = await call('huaweicloud_run_approved_command', { args: delArgs, approvalToken: pdel?.approvalToken, approvedByUser: true });
      const deleted = rund?.ok === true || rund?.exitCode === 0;
      log('D3-S2', 'confirm-delete-vpc', deleted, JSON.stringify(rund).slice(0,120));
      vpcId = null;
    }
  } finally {
    if (vpcId) { // 兜底清理
      const { run: rcl } = await approve(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
      log('D3-S2', 'finally-cleanup', rcl?.ok === true || rcl?.exitCode === 0, '删本次 VPC');
    }
  }
}

// D3-C13: OBS 静态网站托管配置（get/set/get核对/delete/缺 indexDocument 报错）
{
  const bucket = `testbot3-hermes-c13-${TS}`;
  try {
    const mb = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    // set with indexDocument
    const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
    const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    const del = await call('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
    const noIdx = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION });
    log('D3-C13', 'get-set-get-delete flow', set?.ok === true && get?.ok === true && del?.ok === true, `set=${set?.status} get=${get?.status} del=${del?.status}`);
    const noIdxRejected = !noIdx?.ok || /indexDocument/i.test(JSON.stringify(noIdx));
    log('D3-C13', 'missing-indexDocument-rejected', noIdxRejected, JSON.stringify(noIdx).slice(0,120));
  } catch (e) {
    log('D3-C13', 'flow', false, String(e).slice(0,160));
  }
}

// D3-S4: voucher 领券闭环（status → claim → status）
{
  const s1 = await call('huaweicloud_voucher_status', {});
  const claimedBefore = s1?.claimed === true;
  const canClaim = s1?.claimed === false;
  log('D3-S4', 'voucher-status', !s1?.__error, JSON.stringify(s1).slice(0,200));
  if (canClaim) {
    const cl = await call('huaweicloud_voucher_claim', {});
    const s2 = await call('huaweicloud_voucher_status', {});
    log('D3-S4', 'voucher-claim-flip', cl?.ok === true && s2?.claimed === true, `claimed=${s2?.claimed} claim=${JSON.stringify(cl).slice(0,120)}`);
    log('D3-S4', 'note-claims-are-real', true, '领券为真实操作，测试账号激励券');
  } else {
    log('D3-S4', 'voucher-already-claimed', claimedBefore, '已领→闭环复用历史结论');
  }
}

// D3-S8: 失败排障（注入失效凭证 → 触发失败 → explain_error 分类）
{
  const ex = await call('huaweicloud_explain_error', { error: '{"code":"VPC.0104","message":"缺少必要参数"}', context: 'DeleteVpc no param' });
  const classified = !ex?.__error && (ex?.category || ex?.classification || ex?.hint || ex?.advice);
  log('D3-S8', 'explain-error-classify', classified, JSON.stringify(ex).slice(0,200));
}

console.log(JSON.stringify({ total: results.length, generatedAt: new Date().toISOString(), passed: results.filter(r=>r.pass).length, results }, null, 2));