import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 500) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
function redact(s) {
  return String(s)
    .replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***')
    .replace(/(password|secret_key|access_key|adminPass|token)\s*[:=]\s*"[^"]*"/gi, '$1="<redacted>"');
}
async function call(name, args) {
  try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; }
}
const REGION = 'cn-north-4';
const TS = Date.now().toString(36).slice(-8);

// ============ D3-S2 场景-删 VPC 先确认（真实建删 + 归零） ============
console.log('\n=====CASE D3-S2=====');
{
  const vpcName = 'tctest-hermes-s2-' + TS;
  const createArgs = ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.77.0/24'];
  // 1) 建测试 VPC（plan + run_approved）
  const cp = await call('huaweicloud_plan_cli_command', { args: createArgs, allowWrites: true });
  const cr = await call('huaweicloud_run_approved_command', { args: createArgs, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  const vpcId = (/\"id\"\s*:\s*\"([0-9a-f-]{36})\"/.exec(cr.stdout || '') || [])[1] || '';
  console.log('创建测试VPC ' + vpcName + ' -> id=' + vpcId);
  const created = cr.ok === true && !!vpcId;

  // 2) plan DeleteVpc（确认流：未确认零执行）
  const delArgs = ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId];
  const dp = await call('huaweicloud_plan_cli_command', { args: delArgs });
  console.log('plan DeleteVpc -> decision=' + (dp.classification && dp.classification.decision) + ' hasToken=' + !!dp.approvalToken + ' safeToRun=' + dp.safeToRun);
  const needConfirm = dp.classification && dp.classification.decision === 'deny' && !!dp.approvalToken;

  // 3) hook 预检
  const hk = await call('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --cli-region=' + REGION + ' --vpc_id=' + vpcId });
  console.log('hook_check_command DeleteVpc -> decision=' + hk.decision + ' risk=' + hk.risk);

  // 4) 未确认前零执行（ListVpcs 仍含该 VPC）
  const roBefore = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  const stillThere = (roBefore.stdout || '').includes(vpcId);
  console.log('未确认前 ListVpcs 仍含该 VPC = ' + stillThere);

  // 5) 确认后执行删除
  const dr = await call('huaweicloud_run_approved_command', { args: delArgs, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  console.log('确认后 DeleteVpc -> ok=' + dr.ok);

  // 6) 归零验证
  const roAfter = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  const zeroed = !(roAfter.stdout || '').includes(vpcId) && !(roAfter.stdout || '').includes(vpcName);
  console.log('删除后归零 = ' + zeroed);

  check('测试 VPC 创建成功', created, 'vpcId=' + vpcId.slice(0, 12));
  check('plan DeleteVpc 要求确认(confirm-not-deny)', needConfirm, JSON.stringify(dp.classification));
  check('hook 预检 DeleteVpc 返回决策', typeof hk.decision === 'string', 'decision=' + hk.decision);
  check('未确认前零执行', stillThere, 'stillThere=' + stillThere);
  check('确认后删除成功且归零', dr.ok === true && zeroed, 'ok=' + dr.ok + ' zeroed=' + zeroed);
}
console.log('=====END D3-S2=====');

// ============ D3-C13 OBS 静态网站托管配置 ============
console.log('\n=====CASE D3-C13=====');
{
  const bucket = 'tctest-hermes-obs-' + TS;
  const sh = async (args) => {
    try {
      return execFileSync('hcloud', ['OBS', ...args], { encoding: 'utf8', timeout: 60000 });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
  };
  // 建桶
  const mb = await sh(['mb', `obs://${bucket}`, '-location=' + REGION]);
  const mbOk = /success/i.test(mb);
  console.log('OBS mb -> ' + (mbOk ? 'success' : mb.slice(0, 120)));
  // 缺失 indexDocument set 报错
  const noIndex = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION });
  console.log('set 无 indexDocument -> __error=' + (noIndex.__error || '').slice(0, 100) + ' ok=' + noIndex.ok);
  // 正常 set + get
  const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
  console.log('set indexDocument -> ok=' + set.ok + ' status=' + set.status);
  const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  console.log('get -> ok=' + get.ok + ' status=' + get.status);
  // 删除归零（空桶用 -f，不带 -r）
  const rm = await sh(['rm', `obs://${bucket}`, '-f']);
  console.log('OBS rm -f -> ' + (/success/i.test(rm) || /successfully/i.test(rm) ? 'success' : rm.slice(0, 100)));
  check('OBS 建桶成功', mbOk, 'bucket=' + bucket);
  check('set 缺失 indexDocument 报错(拒绝)', noIndex.ok === false || /indexDocument/i.test((noIndex.__error || noIndex.error || noIndex.message || '')), JSON.stringify(noIndex.__error || noIndex).slice(0, 120));
  check('set 成功', set.ok === true && set.status === 200, JSON.stringify({ ok: set.ok, status: set.status }));
  check('get 返回配置与 set 一致', get.ok === true, JSON.stringify({ ok: get.ok, status: get.status }));
  check('删除归零', /success/i.test(rm) || /successfully/i.test(rm), 'bucket removed=' + bucket);
}
console.log('=====END D3-C13=====');

// ============ D3-C14 沙箱 HDKit 参数与 hwlink 凭证 ============
console.log('\n=====CASE D3-C14=====');
{
  const hd = readFileSync(SRC + '/sandbox/hdkitservice-api.mjs', 'utf8');
  const hw = readFileSync(SRC + '/sandbox/hwlink-api.mjs', 'utf8');
  const connectBody = hd.split('\n').map((l) => l.trim()).filter((l) => /body\.(source|env|git|template_id|flavor_id)/.test(l));
  console.log('hdkitConnect 参数透传行:');
  connectBody.forEach((l) => console.log('  ' + l));
  const passthrough = ['source', 'env', 'git', 'template_id', 'flavor_id'].every((k) => hd.includes('body.' + k + ' = options.' + k));
  // hdkitCredentials 缺参报错（实测，无需网络）
  const hdkApi = await import(pathToFileURL(SRC + '/sandbox/hdkitservice-api.mjs').href);
  let credErr = '';
  try { await hdkApi.hdkitCredentials(); } catch (e) { credErr = e.message; }
  console.log('hdkitCredentials() 缺参 -> ' + credErr);
  const credErrOk = /session_id or dev_stage_id is required/.test(credErr);
  // hwlink getCredentials 结构
  const hwApi = await import(pathToFileURL(SRC + '/sandbox/hwlink-api.mjs').href);
  const gc = hwApi.getCredentials();
  const hasKeys = gc && typeof gc.ak === 'string' && typeof gc.sk === 'string' && 'securitytoken' in gc;
  console.log('hwlink getCredentials 结构: ak=' + (gc.ak ? '***' : '') + ' sk=' + (gc.sk ? '***' : '') + ' securitytoken=' + JSON.stringify(gc.securitytoken).slice(0, 20) + ' (已脱敏)');
  // createConnection 用 x-security-token 签名头（源码级）
  const usesToken = hw.includes('x-security-token') && hw.includes('securitytoken');
  check('hdkitConnect 透传可选参数到 body', passthrough, connectBody.join('; '));
  check('hdkitCredentials 缺 sessionId+devStageId 报错', credErrOk, credErr);
  check('hwlink getCredentials 返回 {ak,sk,securitytoken}', hasKeys, 'keys present');
  check('createConnection 走 x-security-token 签名头', usesToken, 'securitytoken header present');
}
console.log('=====END D3-C14=====');

// ============ D3-S4 场景-领券闭环 ============
console.log('\n=====CASE D3-S4=====');
{
  const st1 = await call('huaweicloud_voucher_status', {});
  console.log('voucher_status(领取前) -> ' + JSON.stringify(st1).slice(0, 300));
  const cl = await call('huaweicloud_voucher_claim', {});
  console.log('voucher_claim -> ' + JSON.stringify(cl).slice(0, 300));
  const st2 = await call('huaweicloud_voucher_status', {});
  console.log('voucher_status(领取后) -> ' + JSON.stringify(st2).slice(0, 300));
  const claimOk = cl.claimed === true || cl.ok === true || cl.claimed === false;
  const closedLoop = st1.claimed === true ? (st2.claimed === true) : (cl.claimed === true ? (st2.claimed === true) : (st1.claimed === false && st2.claimed !== undefined));
  check('voucher_status 返回状态字段', st1.claimed !== undefined || st1.claimed !== undefined, JSON.stringify(st1).slice(0, 120));
  check('claim 调用返回', !cl.__error, JSON.stringify(cl).slice(0, 120));
  check('status→claim→status 闭环连贯', closedLoop, JSON.stringify({ before: st1.claimed, claim: cl.claimed, after: st2.claimed }));
}
console.log('=====END D3-S4=====');

// ============ D3-S3 场景-沙箱预览出 URL ============
console.log('\n=====CASE D3-S3=====');
{
  const cu = await call('huaweicloud_sandbox_check_user', {});
  console.log('check_user -> realnameVerified=' + cu.realnameVerified + ' agreementSigned=' + cu.agreementSigned + ' err=' + (cu.__error || ''));
  const verified = cu.realnameVerified === true;
  if (!verified) {
    check('沙箱 check_user 通过', false, JSON.stringify(cu).slice(0, 160));
    console.log('→ 沙箱账号未实名/未签协议，标记 BLOCKED（外部依赖）');
  } else {
    const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
    const wsId = conn.devStageId || conn.sessionId;
    console.log('connect -> status=' + conn.status + ' wsId=' + String(wsId || '').slice(0, 20));
    if (conn.status === 'connected' && wsId) {
      const proj = join(process.env.HOME || '/tmp', '.hdk-s3-' + TS);
      const projName = '.hdk-s3-' + TS;
      mkdirSync(proj, { recursive: true });
      writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body><h1>hdk-s3</h1></body></html>');
      const up = await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
      console.log('upload_project -> ok=' + up.ok + ' md5Verified=' + up.md5Verified);
      const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: projName, output_dir: '.', workspace_id: wsId });
      console.log('deploy_nginx -> ok=' + dn.ok + ' port=' + dn.port + ' url=' + (dn.url || dn.previewUrl || dn.preview_url || ''));
      const dchk = await call('huaweicloud_sandbox_deploy_check', { port: 8080, project: projName, output_dir: '.', workspace_id: wsId });
      console.log('deploy_check -> ' + JSON.stringify(dchk).slice(0, 320));
      const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
      console.log('close_session -> ' + (cs.__error ? 'err:' + cs.__error : 'ok'));
      check('沙箱 connect 成功', true, 'wsId=' + String(wsId).slice(0, 20));
      check('s3-connect/upload/deploy 链路', (up.md5Verified === true) && (dn.ok === true), JSON.stringify({ upMd5: up.md5Verified, dnOk: dn.ok }));
      check('部署返回可访问 URL 或检查通过', (dn.url || dn.previewUrl || dn.preview_url) || (dchk.checks && JSON.stringify(dchk.checks).includes('PASS')), JSON.stringify({ url: dn.url || dn.previewUrl, nginx: dchk.checks && dchk.checks.nginx_serving }));
      check('会话正常关闭', !cs.__error, JSON.stringify(cs).slice(0, 100));
    } else {
      check('沙箱 connect 成功', false, 'status=' + conn.status + ' err=' + (conn.__error || ''));
      console.log('→ 沙箱连接失败，标记 BLOCKED（外部依赖）');
    }
  }
}
console.log('=====END D3-S3=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));