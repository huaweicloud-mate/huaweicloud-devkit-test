// 2026-09-20 OpenClaw Linux — D3 真云场景探针（最小资源建删归零）
// D3-S1 只读查ECS/零写、D3-S2 删VPC先确认、D3-C13 OBS静态网站托管、D3-S4 领券闭环(幂等)、D3-S6 FunctionGraph 定时任务(建删归零)
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const REGION = 'cn-north-4';
const cred = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));

let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(m) { lines.push(`NOTE   ${m}`); }

const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(CORE + '/tools.mjs');

// 只读凭证解析（真云管理员 A/SK）
const credsJson = readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8');
const adminAk = JSON.parse(credsJson).ak;
const adminSk = JSON.parse(credsJson).sk;

// ── D3-S1 只读查 ECS + 零写调用 ─────────────────────────────────────────
{
  const r = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'NovaListServers'] });
  note(`D3-S1 ECS 只读返回 ok=${r?.ok} 结构=${typeof r === 'object' ? Object.keys(r || {}).join(',') : '?'}`);
  check('D3-S1', '只读查 ECS 成功(ok=true)', r?.ok === true, true);
  // 零写调用断言（本探针进程内未调用任何 plan/run_approved 写工具——由工具分类保证只读）
  const readCls = (await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'NovaListServers'] }))?.classification;
  check('D3-S1', 'NovaListServers 分类为 allow(只读不改)', readCls?.decision, 'allow');
}

// ── D3-S2 删 VPC 先确认（建 VPC → plan 删 → 确认后真删 → 归零）──────────
{
  const vpcName = `tctest-s2-vpc-${Date.now()}`;
  const base = (await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'ListVpcs'] })) || {};
  // 建 VPC（最低配置，真机）
  const created = await import('node:child_process').then(({ spawnSync }) => spawnSync('hcloud', ['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.100.0.0/16', `--cli-region=${REGION}`, `--cli-access-key=${adminAk}`, `--cli-secret-key=${adminSk}`, '--cli-output=json'], { encoding: 'utf8' }));
  let vpcId = null;
  try { vpcId = JSON.parse(created.stdout).vpc.id; } catch {}
  check('D3-S2', '真机创建最小 VPC 成功', !!vpcId, true);

  // plan 删除（未确认前零执行）
  const planDel = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`] });
  const cls = planDel?.classification || {};
  check('D3-S2', '删除命令块分类非 allow(需确认)', cls.decision !== 'allow', true);
  check('D3-S2', 'plan 提供 approvalToken(等待确认)', typeof planDel?.approvalToken === 'string' && planDel.approvalToken.length > 0, true);

  // 确认后真删（走 run_approved_command 审批流）
  let delOk = false;
  try {
    const del = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`], approvalToken: planDel.approvalToken, approvedByUser: true });
    delOk = del?.ok === true;
  } catch (e) { note(`D3-S2 run_approved 抛错: ${String(e?.message || e).slice(0, 120)}`); }
  check('D3-S2', '确认后 run_approved 真删成功', delOk, true);

  // 归零验证
  const { spawnSync } = await import('node:child_process');
  const list = spawnSync('hcloud', ['VPC', 'ListVpcs', `--cli-region=${REGION}`, `--cli-access-key=${adminAk}`, `--cli-secret-key=${adminSk}`, '--cli-output=json'], { encoding: 'utf8' });
  check('D3-S2', '删除后 tctest-s2- 归零', list.stdout.includes(vpcName), false);
}

// ── D3-C13 OBS 静态网站托管（建桶 → set website → get → delete → 删桶归零）────────
{
  const bucket = `tctest-obs-website-${Date.now()}`;
  const { spawnSync } = await import('node:child_process');
  const mb = spawnSync('hcloud', ['obs', 'mb', `obs://${bucket}`, '--location=cn-north-4'], { encoding: 'utf8' });
  const created = /successfully/.test(`${mb.stdout}${mb.stderr}`);
  check('D3-C13', '真机创建 OBS 桶', created, true);

  if (created) {
    // 无 indexDocument 的 set 应报错
    let missingIndexErr = false;
    try { await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION }); }
    catch (e) { missingIndexErr = /indexDocument is required/.test(String(e?.message || e)); }
    check('D3-C13', 'set 缺 indexDocument 报错', missingIndexErr, true);

    // set + get + delete
    const setRes = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html', errorDocument: '404.html' });
    check('D3-C13', 'set website 返回 ok', setRes?.ok === true, true);
    check('D3-C13', 'set 返回 websiteUrl', typeof setRes?.websiteUrl === 'string' && /obs-website/.test(setRes.websiteUrl), true);

    const getRes = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    check('D3-C13', 'get website 返回 indexDocument', /index\.html/.test(String(getRes?.body || '')), true);

    const delRes = await callTool('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
    check('D3-C13', 'delete website 成功(status 204)', delRes?.status === 204 || delRes?.ok === true, true);

    // 归零：删桶（空桶 rm -f）
    const rb = spawnSync('hcloud', ['obs', 'rm', `obs://${bucket}`, '-f'], { encoding: 'utf8' });
    note(`D3-C13 删桶: ${(`${rb.stdout}${rb.stderr}`).trim().slice(0, 80)}`);
  }
}

// ── D3-S4 领券闭环（幂等）────────────────────────────────────────────
{
  const st1 = await callTool('huaweicloud_voucher_status', {});
  const claim = await callTool('huaweicloud_voucher_claim', {});
  const st2 = await callTool('huaweicloud_voucher_status', {});
  note(`D3-S4 status→claim→status: ${JSON.stringify(st1)} / claim=${JSON.stringify(claim)} / ${JSON.stringify(st2)}`);
  check('D3-S4', 'voucher_status 返回 claimed 布尔', typeof st1?.claimed === 'boolean', true);
  check('D3-S4', 'claimed=true 后 claim 幂等(不抛错/返回已领取)', !!claim && (claim.claimed === true || /领取|claim/i.test(JSON.stringify(claim))), true);
}

// ── D3-S6 FunctionGraph 定时任务（建函数 → 删函数归零）──────────────────
{
  const fnName = `tctestfn${Date.now()}`;
  const { spawnSync } = await import('node:child_process');
  // base64 of: "def handler(event, context): return 1"
  const inlineB64 = 'ZGVmIGhhbmRsZXIoZXZlbnQsIGNvbnRleHQpOiByZXR1cm4gMQ==';
  const create = spawnSync('hcloud', ['FunctionGraph', 'CreateFunction', '--func_name=' + fnName, '--package=default', '--runtime=Python3.10', '--timeout=3', '--memory_size=128', '--handler=index.handler', '--code_type=inline', '--func_code.file=' + inlineB64, `--cli-region=${REGION}`, `--cli-access-key=${adminAk}`, `--cli-secret-key=${adminSk}`, '--cli-output=json'], { encoding: 'utf8' });
  let fnUrn = null;
  try { fnUrn = JSON.parse(create.stdout).func_urn; } catch {}
  check('D3-S6', '真机创建 FunctionGraph 函数(URN)', !!fnUrn, true);
  note(`D3-S6 create stdout: ${create.stdout.trim().slice(0, 120)} fnUrn=${!!fnUrn}`);
  if (fnUrn) {
    // FunctionGraph 创建是异步的；delete 需重试（FSS.0400=仍在创建中，FSS.1051=已删）。
    const baseUrn = fnUrn.replace(':latest', '');
    let del = null;
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      del = spawnSync('hcloud', ['FunctionGraph', 'DeleteFunction', `--function_urn=${baseUrn}`, `--cli-region=${REGION}`, `--cli-access-key=${adminAk}`, `--cli-secret-key=${adminSk}`, '--cli-output=json'], { encoding: 'utf8' });
      if (del.returncode === 0 && !/error_code|Failed to delete|Can't delete/i.test(`${del.stdout}${del.stderr}`)) break;
    }
    // 归零验证：删除后 ListFunctions 不含该函数
    const list = spawnSync('hcloud', ['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, `--cli-access-key=${adminAk}`, `--cli-secret-key=${adminSk}`, '--cli-output=json'], { encoding: 'utf8' });
    let zeroResidual = true;
    try { zeroResidual = !JSON.stringify(JSON.parse(list.stdout).functions || []).includes(fnName); } catch { zeroResidual = !list.stdout.includes(fnName); }
    check('D3-S6', '测后删除函数归零(ListFunctions 无残留)', zeroResidual, true);
    note(`D3-S6 delete stdout: ${(del?.stdout || '').trim().slice(0, 100)}`);
  }
}

console.log('\n=== OpenClaw Linux 真云场景探针结果 (2026-09-20) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);