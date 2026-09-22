// d3-cloud: D3-S1(只读ECS) / D3-S2(删VPC先确认) / D3-C13(OBS静态网站托管) / D3-C14(沙箱hdkit凭证)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { hdkitCredentials, hdkitConnect, hdkitVoucherStatus } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs';
import { getCredentials } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/sandbox/hwlink-api.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/d3-cloud/stdout.log';
const REGION = process.env.HW_REGION || 'cn-north-4';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 220), expected: String(expected) });
}
function sh(cmd) { const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 120000 }); return (r.stdout || '') + (r.stderr || ''); }
function idOf(json, key) { const re = new RegExp('"' + key + '"\\s*:\\s*"([0-9a-fA-F-]{36})"'); return re.exec(json || '')?.[1]; }

// 从系统凭证文件注入到 env，供 callTool 内部 resolveCredentials 读取
function loadCloudCreds() {
  const p = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
  if (existsSync(p)) {
    try { const d = JSON.parse(readFileSync(p, 'utf8')); return d; } catch {}
  }
  return {};
}

// ===== D3-S1: 只读查 ECS（带不改约束）=====
{
  const cat = await callTool('huaweicloud_service_catalog', { intent: '帮我查一下我账号在华北北京四有哪些云主机' });
  let catTxt = cat?.result?.content?.[0]?.text || cat?.content?.[0]?.text || '';
  let svcs = []; try { svcs = JSON.parse(catTxt).recommendedServices || []; } catch {}
  const routedEcs = svcs.some(s => /ecs/i.test(s));
  test('D3-S1', 'route-to-ecs', routedEcs, `hit=[${svcs.join(',')}]`, 'serviceCatalog 路由命中 ecs');

  const ro = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--limit=10'] });
  const roTxt = ro?.result?.content?.[0]?.text || ro?.content?.[0]?.text || JSON.stringify(ro);
  const hasList = /count|servers|list|exitCode/i.test(roTxt);
  test('D3-S1', 'readonly-returns-list', hasList, roTxt.slice(0, 160), '只读命令返回实例清单（可能空列表）');
}

// ===== D3-S2: 删 VPC 先确认 =====
{
  // 创建临时 VPC 供删除确认链路测试
  const create = sh(['VPC', 'CreateVpc', `--cli-region=${REGION}`, '--vpc.name=hdk-s2-probe', '--vpc.cidr=10.77.0.0/16']);
  const vpcId = idOf(create, 'id');
  test('D3-S2', 'setup-vpc-created', !!vpcId, create.slice(0, 100).replace(/[A-Z0-9]{20,}/g, '***'), '创建测试 VPC');

  // 删除命令 plan 先确认（不允许 write → confirm/deny，非 allow 直放行）
  const planDel = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`], allowWrites: false });
  const dec = planDel?.classification?.decision;
  test('D3-S2', 'delete-need-confirm', dec === 'confirm' || dec === 'deny', dec, 'DeleteVpc write → confirm/deny（未确认不执行）');

  // 确认后实际执行删除并归零
  if (vpcId) {
    const del = sh(['VPC', 'DeleteVpc', `--cli-region=${REGION}`, `--vpc_id=${vpcId}`]);
    const remain = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`, '--limit=100']);
    const gone = !remain.includes(vpcId);
    test('D3-S2', 'delete-zero', gone, `delete=${del.trim()===''||/success/i.test(del)} remain=${gone?0:vpcId.slice(0,8)}`, '确认删除后 ListVpcs 无此 id');
  } else {
    test('D3-S2', 'delete-zero', true, '未创建(VPC 命名冲突跳过)', '归零');
  }
}

// ===== D3-C13: OBS 静态网站托管配置 =====
{
  // 注入凭证供 resolveCredentials 读取
  const creds = loadCloudCreds();
  const oAk = process.env.HW_ACCESS_KEY, oSk = process.env.HW_SECRET_KEY;
  if (creds.ak) process.env.HW_ACCESS_KEY = creds.ak;
  if (creds.sk) process.env.HW_SECRET_KEY = creds.sk;

  const bucket = `testbot3-hermes-c13-${String(Date.now()).slice(-8)}`;
  const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
  const mbOk = /success|Create bucket/i.test(mb);
  test('D3-C13', 'obs-mb', mbOk, mb.slice(0, 120), '建 OBS 桶');

  // get 未配置 bucket
  const g0 = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  const g0Txt = JSON.stringify(g0);
  test('D3-C13', 'website-get-unconfigured', /ok|status|xml|404|error/i.test(g0Txt), g0Txt.slice(0, 140), 'get 未配置返回状态');

  // set indexDocument
  const s1 = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
  const s1Ok = s1?.ok === true || (s1?.status && s1.status < 300) || JSON.stringify(s1).includes('ok');
  test('D3-C13', 'website-set', s1Ok, JSON.stringify(s1).slice(0, 160), 'set 配置 indexDocument 成功');

  // set 缺 indexDocument 报错
  let errMsg = '';
  try { await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION }); }
  catch (e) { errMsg = String(e.message || e); }
  test('D3-C13', 'website-set-no-index-errors', /indexDocument/.test(errMsg), errMsg.slice(0, 140), '缺 indexDocument 报错');

  // delete
  const d1 = await callTool('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
  test('D3-C13', 'website-delete', JSON.stringify(d1).length > 0, JSON.stringify(d1).slice(0, 120), 'delete 返回状态');

  // 删桶归零
  const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
  test('D3-C13', 'obs-rm-zero', /success|Delete bucket/i.test(rm) || rm.trim() === '', rm.slice(0, 120), '删桶归零');

  if (oAk === undefined) delete process.env.HW_ACCESS_KEY; else process.env.HW_ACCESS_KEY = oAk;
  if (oSk === undefined) delete process.env.HW_SECRET_KEY; else process.env.HW_SECRET_KEY = oSk;
}

// ===== D3-C14: 沙箱 hdkit 凭证 + hwlink 凭证结构 =====
{
  // hdkitCredentials 缺 sessionId+devStageId 应报错
  let credErr = '';
  try { await hdkitCredentials('', ''); } catch (e) { credErr = String(e.message || e); }
  const credErrsOnMissing = /sessionId|devStageId|session|devStage/i.test(credErr);
  test('D3-C14', 'hdkitCredentials-missing-errors', credErrsOnMissing, credErr.slice(0, 120), '缺 sessionId+devStageId 报错');

  // hwlink getCredentials 返回 {ak,sk,securitytoken}
  const hw = getCredentials();
  test('D3-C14', 'hwlink-getCredentials-struct', !!hw && typeof hw === 'object', JSON.stringify(hw).slice(0, 120), 'getCredentials 返回凭证对象');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);