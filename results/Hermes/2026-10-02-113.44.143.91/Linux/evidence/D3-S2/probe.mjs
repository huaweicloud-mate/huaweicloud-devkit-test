// D3-S2 场景-删VPC先确认 聚焦探针 — Hermes/Linux/2026-10-01 (v1.1.8-next.1 ffd7b474)
// 修正: 「未确认前仍存在」用全量 ListVpcs 校验（名称过滤有最终一致性 lag，会误报 stillThere=false）
const { writeFileSync, mkdirSync } = await import('node:fs');
const { join } = await import('node:path');
const { spawnSync } = await import('node:child_process');

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const PREFIX = 'hdk1';

const { callTool } = await import(`file://${HDK}/src/tools.mjs`);

function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 120000 }); return (r.stdout || '') + (r.stderr || ''); }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json)?.[1]; }

const out = [];
out.push('=== D3-S2 场景-删VPC先确认 (全量 ListVpcs 校验) ===');
const vpcName = `${PREFIX}-s2-${TS}`;
let vpcId = null;
try {
  const cat = await callTool('huaweicloud_service_catalog', { intent: '删除一个 VPC' });
  out.push(`[1] serviceCatalog("删除一个 VPC") -> services=${JSON.stringify(cat?.recommendedServices)}`);

  const cv = sh(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=192.168.210.0/24', `--cli-region=${REGION}`]);
  vpcId = idOf(cv);
  out.push(`[2] 创建 VPC ${vpcName} -> ${vpcId ? vpcId : cv.slice(0, 120)}`);

  if (vpcId) {
    const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`] });
    out.push(`[3] plan_cli_command(DeleteVpc) -> decision=${plan?.classification?.decision} risk=${plan?.classification?.risk} (期望 deny|write)`);
    const planOk = plan?.classification?.decision === 'deny' && plan?.classification?.risk === 'write';

    const hk = await callTool('huaweicloud_hook_check_command', { command: `hcloud VPC DeleteVpc --vpc_id=${vpcId}` });
    out.push(`[4] hook_check_command(DeleteVpc) -> decision=${hk?.decision} findings=${(hk?.findings || []).length} (期望 warn)`);
    const hookOk = hk?.decision === 'warn';

    // 全量校验（避免名称过滤最终一致性 lag）
    const before = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
    const stillThere = before.includes(vpcId);
    out.push(`[5] 未确认前全量 ListVpcs 仍含 VPC=${stillThere} (零执行断言)`);

    const del = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`], approvalToken: plan?.approvalToken, approvedByUser: true });
    out.push(`[6] run_approved(DeleteVpc) -> ok=${del?.ok} exitCode=${del?.exitCode}`);

    const after = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
    const zero = !after.includes(vpcId);
    out.push(`[7] 确认删除后全量 ListVpcs 不再含 VPC=${zero} (归零)`);

    const ok = planOk && hookOk && stillThere && zero;
    out.push('');
    out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'} (plan=deny/write + hook=warn + 未确认前仍在 + 确认后归零)`);
    const status = ok ? 'PASS' : 'FAIL';
    const why = ok ? '' : `planOk=${planOk} hookOk=${hookOk} stillThere=${stillThere} zero=${zero}`;
    const result = { status, why, executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14), detail: out.join('\n') };
    const d = join(EVID, 'D3-S2'); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
    writeFileSync(join(d, 'stdout.txt'), out.join('\n'), 'utf8');
    console.log(`D3-S2 ${status} planOk=${planOk} hookOk=${hookOk} stillThere=${stillThere} zero=${zero}`);
  } else {
    out.push('创建 VPC 失败');
    out.push('RESULT: BLOCKED');
    const d = join(EVID, 'D3-S2'); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status: 'BLOCKED', why: 'CreateVpc failed', executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14) }), 'utf8');
    console.log('D3-S2 BLOCKED');
  }
} catch (e) {
  out.push(`异常: ${e.message}`);
  out.push('RESULT: FAIL');
  const d = join(EVID, 'D3-S2'); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status: 'FAIL', why: 'exception: ' + e.message }), 'utf8');
  writeFileSync(join(d, 'stdout.txt'), out.join('\n'), 'utf8');
  console.log('D3-S2 FAIL (exception)');
}