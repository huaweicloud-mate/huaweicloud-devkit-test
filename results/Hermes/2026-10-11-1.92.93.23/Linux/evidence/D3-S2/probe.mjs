// D3-S2 场景-删VPC先确认 — 修正版 (全量 ListVpcs 校验 stillThere, 不用 --name 过滤)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const { callTool } = await import(`file://${HDK}/src/tools.mjs`);

function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 90000 }); return (r.stdout || '') + (r.stderr || ''); }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json)?.[1]; }

const out = [];
out.push('=== D3-S2 场景-删VPC先确认 (修正: 全量 ListVpcs 校验未确认前 VPC 仍在) ===');
const vpcName = `hdk1-s2-${TS}`;
let vpcId = null;
const cat = await callTool('huaweicloud_service_catalog', { intent: '删除一个 VPC' });
out.push(`[1] serviceCatalog("删除一个 VPC") -> services=${JSON.stringify(cat?.recommendedServices)} skills=${JSON.stringify(cat?.recommendedSkills)}`);
const cv = sh(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=192.168.210.0/24', `--cli-region=${REGION}`]);
vpcId = idOf(cv);
out.push(`[2] 创建 VPC ${vpcName} -> ${vpcId || cv.slice(0, 160)}`);

if (vpcId) {
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`] });
  out.push(`[3] plan_cli_command(DeleteVpc) -> decision=${plan?.classification?.decision} risk=${plan?.classification?.risk} (期望 deny, 未自执行)`);
  const hk = await callTool('huaweicloud_hook_check_command', { command: `hcloud VPC DeleteVpc --vpc_id=${vpcId}` });
  out.push(`[4] hook_check_command(DeleteVpc) -> decision=${hk?.decision} findings=${(hk?.findings || []).length}`);
  const before = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
  const stillThere = before.includes(vpcId);
  out.push(`[5] 未确认前全量 ListVpcs 仍含本 VPC=${stillThere} (零执行断言: plan 返回 deny 但未删除)`);
  const del = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`], approvalToken: plan?.approvalToken, approvedByUser: true });
  out.push(`[6] run_approved(DeleteVpc) -> ok=${del?.ok} exitCode=${del?.exitCode}`);
  const after = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
  const gone = !after.includes(vpcId);
  out.push(`[7] 确认删除后全量 ListVpcs 不再含本 VPC=${gone} (归零)`);
  out.push('');
  const ok = stillThere && gone;
  out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'} (未确认前仍在 + 确认后归零)`);
  console.log(`D3-S2 ${ok ? 'PASS' : 'FAIL'} stillThere=${stillThere} zero=${gone}`);
} else {
  out.push('创建 VPC 失败，无法继续');
  out.push('RESULT: BLOCKED');
  console.log('D3-S2 BLOCKED (CreateVpc failed)');
}
const d = join(EVID, 'D3-S2');
mkdirSync(d, { recursive: true });
writeFileSync(join(d, 'stdout.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));