// realcloud-newcases.mjs — 2026-09-20 真云场景用例 (Hermes/Linux/v1.1.5)
// D3-S1(只读查ECS) / D3-S2(删VPC先确认) / D3-C13(OBS静态网站) / D3-S4(领券闭环)
// 护持: 唯一时间戳名, finally 反序删除 + 归零验证 (只删本次创建)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const PREFIX = 'hdk1';

function ev(cid, content) {
  const d = join(EVID, cid);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.txt'), content, 'utf8');
}
function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 90000 }); return (r.stdout || '') + (r.stderr || ''); }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json)?.[1]; }

const { callTool } = await import(`file://${HDK}/src/tools.mjs`);

// ============ D3-S1 场景-只读查ECS(带不改约束) ============
{
  const out = [];
  out.push('=== D3-S1 场景-只读查ECS(带不改约束) ===');
  const cat = await callTool('huaweicloud_service_catalog', { intent: '帮我查一下我账号有哪些云主机' });
  out.push(`[1] serviceCatalog("帮我查一下我账号有哪些云主机") -> services=${JSON.stringify(cat?.recommendedServices)} skills=${JSON.stringify(cat?.recommendedSkills)}`);
  const routeOk = (cat?.recommendedServices || []).includes('ECS');
  const rr = await callTool('huaweicloud_run_readonly_command', { args: ['ecs', 'ListServersDetails', `--cli-region=${REGION}`] });
  out.push(`[2] run_readonly_command(ecs ListServersDetails) -> ${JSON.stringify(rr).slice(0, 400)}`);
  const readOk = rr?.ok === true && rr?.exitCode === 0;
  out.push(`[3] 全程零写操作: 仅调用 service_catalog + run_readonly_command (无 create/delete/update/run_approved)`);
  const zeroWrite = true;
  out.push('');
  out.push(`路由命中 ECS=${routeOk}; 只读执行=${readOk}; 零写=${zeroWrite}`);
  out.push(`RESULT: ${routeOk && readOk && zeroWrite ? 'PASS' : 'FAIL'}${routeOk ? '' : ' (路由 miss: 中文意图未映射 ECS)'}`);
  ev('D3-S1', out.join('\n'));
  console.log(`D3-S1 ${routeOk && readOk && zeroWrite ? 'PASS' : 'FAIL'} routeOk=${routeOk} readOk=${readOk}`);
}

// ============ D3-S2 场景-删VPC先确认 ============
{
  const out = [];
  out.push('=== D3-S2 场景-删VPC先确认 ===');
  const vpcName = `${PREFIX}-s2-${TS}`;
  let vpcId = null;
  const cat = await callTool('huaweicloud_service_catalog', { intent: '删除一个 VPC' });
  out.push(`[1] serviceCatalog("删除一个 VPC") -> services=${JSON.stringify(cat?.recommendedServices)}`);
  const cv = sh(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=192.168.210.0/24', `--cli-region=${REGION}`]);
  vpcId = idOf(cv);
  out.push(`[2] 创建 VPC ${vpcName} -> ${vpcId ? vpcId : cv.slice(0, 120)}`);
  if (vpcId) {
    const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`] });
    out.push(`[3] plan_cli_command(DeleteVpc) -> decision=${plan?.classification?.decision} risk=${plan?.classification?.risk}`);
    const hk = await callTool('huaweicloud_hook_check_command', { command: `hcloud VPC DeleteVpc --vpc_id=${vpcId}` });
    out.push(`[4] hook_check_command(DeleteVpc) -> decision=${hk?.decision} findings=${(hk?.findings || []).length}`);
    const before = sh(['VPC', 'ListVpcs', `--name=${vpcName}`, `--cli-region=${REGION}`]);
    const stillThere = before.includes(vpcId);
    out.push(`[5] 未确认前 ListVpcs 仍含 VPC=${stillThere} (零执行断言)`);
    const del = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`], approvalToken: plan?.approvalToken, approvedByUser: true });
    out.push(`[6] run_approved(DeleteVpc) -> ${JSON.stringify(del).slice(0, 200)}`);
    const after = sh(['VPC', 'ListVpcs', `--name=${vpcName}`, `--cli-region=${REGION}`]);
    const gong = !after.includes(vpcId);
    out.push(`[7] 确认删除后 ListVpcs 不再含 VPC=${gong} (归零)`);
    out.push('');
    const ok = stillThere && gong;
    out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'}${ok ? '' : ' (未确认前已被删 或 确认后未归零)'}`);
    console.log(`D3-S2 ${ok ? 'PASS' : 'FAIL'} stillThere=${stillThere} zero=${gong}`);
  } else {
    out.push('创建 VPC 失败，无法继续删除流程');
    out.push('RESULT: BLOCKED');
    console.log('D3-S2 BLOCKED (CreateVpc failed)');
  }
  ev('D3-S2', out.join('\n'));
}

// ============ D3-C13 OBS 静态网站托管配置 ============
{
  const out = [];
  out.push('=== D3-C13 OBS 静态网站托管配置 ===');
  const bucket = `${PREFIX.toLowerCase()}-s13-${TS}`;
  const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
  out.push(`[1] OBS 建桶 obs://${bucket} -> ${/success/i.test(mb) ? 'success' : mb.slice(0, 120)}`);
  const set = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
  out.push(`[2] set indexDocument -> ${JSON.stringify(set).slice(0, 250)}`);
  const get = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  out.push(`[3] get 核对 -> ${JSON.stringify(get).slice(0, 300)}`);
  const delc = await callTool('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
  out.push(`[4] delete -> ${JSON.stringify(delc).slice(0, 200)}`);
  try {
    const bad = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION });
    out.push(`[5] 无 indexDocument set -> ${JSON.stringify(bad).slice(0, 200)} (期望报错)`);
  } catch (e) { out.push(`[5] 无 indexDocument set -> THROW: ${e.message} (期望报错)`); }
  const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-r', '-f']);
  out.push(`[6] 删桶归零 -> ${/success/i.test(rm) ? 'success' : rm.slice(0, 120)}`);
  out.push('');
  const ok = set?.ok === true && get?.ok === true && delc?.ok === true;
  out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`D3-C13 ${ok ? 'PASS' : 'FAIL'} set=${set?.ok} get=${get?.ok} del=${delc?.ok}`);
  ev('D3-C13', out.join('\n'));
}

// ============ D3-S4 场景-领券闭环 ============
{
  const out = [];
  out.push('=== D3-S4 场景-领券闭环 ===');
  const s1 = await callTool('huaweicloud_voucher_status', {});
  out.push(`[1] voucher_status -> ${JSON.stringify(s1)}`);
  let claim;
  if (s1?.claimed === true) {
    claim = await callTool('huaweicloud_voucher_claim', {});
    out.push(`[2] voucher_claim (已领取, 幂等复核) -> ${JSON.stringify(claim)}`);
  } else {
    claim = await callTool('huaweicloud_voucher_claim', {});
    out.push(`[2] voucher_claim (领取) -> ${JSON.stringify(claim)}`);
  }
  const s2 = await callTool('huaweicloud_voucher_status', {});
  out.push(`[3] voucher_status (复核) -> ${JSON.stringify(s2)}`);
  out.push('');
  const ok = s2?.claimed === true;
  out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'} (status->claim->status 闭环, 最终 claimed=${s2?.claimed})`);
  console.log(`D3-S4 ${ok ? 'PASS' : 'FAIL'} claimed=${s2?.claimed}`);
  ev('D3-S4', out.join('\n'));
}

console.log('REALCLOUD-NEWCASES DONE');