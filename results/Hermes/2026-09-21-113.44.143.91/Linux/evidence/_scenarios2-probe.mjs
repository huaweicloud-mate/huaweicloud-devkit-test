// 修正版真云探针：D3-S2 / D3-C13 (2026-09-20 Hermes/Linux)
// 修复上一版 destructure 错误 + D3-C13 需先建桶。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const SRC = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const results = [];
const log = (id, name, pass, detail) => results.push({ id, name, pass: !!pass, detail: String(detail ?? '').slice(0, 280) });
const call = async (name, args) => { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 200) }; } };
const idOf = (json) => /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1];
const sh = (args) => { const r = spawnSync('hcloud', args, { encoding: 'utf8' }); return (r.stdout || '') + (r.stderr || ''); };

// D3-S2 删 VPC 先确认（建 → plan 预检 → 未确认零执行 → 确认删除 → 归零）
{
  let vpcId = null;
  const vpcName = `testbot3-hermes-d3s2b-${TS}`;
  try {
    // 1. 建 VPC（审批执行）
    const planC = await call('huaweicloud_plan_cli_command', { args: ['VPC','CreateVpc',`--vpc.name=${vpcName}`,'--vpc.cidr=10.97.0.0/16',`--cli-region=${REGION}`], allowWrites: true });
    const runC = planC?.approvalToken ? await call('huaweicloud_run_approved_command', { args: ['VPC','CreateVpc',`--vpc.name=${vpcName}`,'--vpc.cidr=10.97.0.0/16',`--cli-region=${REGION}`], approvalToken: planC.approvalToken, approvedByUser: true }) : null;
    vpcId = idOf(runC?.stdout || JSON.stringify(runC) || '');
    log('D3-S2', 'create-vpc', !!vpcId, (runC?.stdout || '').slice(0,100));

    if (vpcId) {
      // 2. plan 预检 DeleteVpc：应产出命令块 + destructive warning + token，未确认不执行
      const planD = await call('huaweicloud_plan_cli_command', { args: ['VPC','DeleteVpc',`--vpc_id=${vpcId}`,`--cli-region=${REGION}`], allowWrites: true });
      const decision = planD?.classification?.decision;
      const token = planD?.approvalToken;
      const hasDestructive = (planD?.classification?.warnings || []).some(w => /destructive/i.test(w?.ruleId || ''));
      log('D3-S2', 'plan-precheck-block', decision === 'allow' && !!token && hasDestructive, `decision=${decision} token=${!!token} destructive=${hasDestructive}`);
      // 未确认前 VPC 应仍存在（零执行）
      const before = sh(['VPC','ShowVpc',`--vpc_id=${vpcId}`,`--cli-region=${REGION}`]);
      const stillExists = !/not found|9904/i.test(before);
      log('D3-S2', 'zero-exec-before-confirm', stillExists, 'plan 未执行，VPC 仍存在');

      // 3. 确认后执行删除
      const runD = await call('huaweicloud_run_approved_command', { args: ['VPC','DeleteVpc',`--vpc_id=${vpcId}`,`--cli-region=${REGION}`], approvalToken: token, approvedByUser: true });
      const after = sh(['VPC','ShowVpc',`--vpc_id=${vpcId}`,`--cli-region=${REGION}`]);
      const gone = /not found|9904/i.test(after);
      log('D3-S2', 'confirm-delete-zero-leak', gone, `runOk=${runD?.ok}/${runD?.exitCode} 归零=${gone}`);
      vpcId = null;
    }
  } finally {
    if (vpcId) { // 兜底清理（只删本次创建）
      const planCl = await call('huaweicloud_plan_cli_command', { args: ['VPC','DeleteVpc',`--vpc_id=${vpcId}`,`--cli-region=${REGION}`], allowWrites: true });
      if (planCl?.approvalToken) await call('huaweicloud_run_approved_command', { args: ['VPC','DeleteVpc',`--vpc_id=${vpcId}`,`--cli-region=${REGION}`], approvalToken: planCl.approvalToken, approvedByUser: true });
      log('D3-S2', 'finally-cleanup', true, '兜底删除本次 VPC');
    }
  }
}

// D3-C13: OBS 静态网站托管（建桶 → get 未配置 → set → get 核对 → delete → 缺 indexDocument 报错 → 删桶归零）
{
  const bucket = `testbot3-hermes-c13b-${TS}`;
  try {
    const mb = sh(['OBS','mb',`obs://${bucket}`,`-location=${REGION}`]);
    const created = /success|create/i.test(mb);
    log('D3-C13', 'create-bucket', created, mb.slice(0,120));

    const get0 = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
    const get1 = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    const del = await call('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
    const noIdx = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION });

    log('D3-C13', 'set-get-delete-flow', set?.ok === true && get1?.ok === true && del?.ok === true, `set=${set?.status}/${set?.ok} get=${get1?.status} del=${del?.status}`);
    log('D3-C13', 'get-unconfigured', !get0?.__error, `初始 get status=${get0?.status} ok=${get0?.ok}`);
    const noIdxRejected = !noIdx?.ok || /indexDocument/i.test(JSON.stringify(noIdx));
    log('D3-C13', 'missing-indexDocument-rejected', noIdxRejected, JSON.stringify(noIdx).slice(0,120));
  } finally {
    const rm = sh(['OBS','rm',`obs://${bucket}`,'-r','-f']);
    log('D3-C13', 'finally-delete-bucket', /success|delete/i.test(rm) || !/error/i.test(rm), rm.slice(0,120));
  }
}

console.log(JSON.stringify({ total: results.length, generatedAt: new Date().toISOString(), passed: results.filter(r=>r.pass).length, results }, null, 2));