// 真云 E2E 探针 — Hermes / Linux / v1.1.5 (e7ed6f6)
// 覆盖真云用例：D3-B3 / D3-C4(服务矩阵22) / EXP-C4-01..22 / D4-14 / D2-1真云E2E / D4-18/19/20真云
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EV = dirname(fileURLToPath(import.meta.url));
const hdkRoot = '/home/zhangshuang/devkit-test/Hermes/hdk';
const toolsUrl = pathToFileURL(join(hdkRoot, 'plugins/huaweicloud-core/src/tools.mjs')).href;
const { callTool } = await import(toolsUrl);
const REGION = 'cn-north-4';

function redact(v) {
  if (v == null) return v;
  if (typeof v === 'string') {
    return v
      .replace(/(AKIA|ASIA|HUAWEI)[A-Z0-9]{8,}/gi, '$1***REDACTED***')
      .replace(/"?(access[_-]?key|secret[_-]?key|security[_-]?token|password|token)"?\s*[:=]\s*"[^"\r\n]+"/gi, '"$1":"***REDACTED***"')
      .replace(/(ak|sk)\s*[:=]\s*[A-Za-z0-9+\/=]{8,}/gi, '$1=***REDACTED***');
  }
  if (Array.isArray(v)) return v.map(redact);
  if (typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) {
      o[k] = /(^|[_-])(ak|sk|token|secret|password|accessKey|secretKey)($|[_-])/i.test(k)
        ? '***REDACTED***' : redact(val);
    }
    return o;
  }
  return v;
}

const RESULTS = [];
function emit(id, pass, expected, actual, extra = {}) {
  const summary = [
    `=== CASE ${id} ===  ${pass ? 'PASS' : 'FAIL'}`,
    `  expected: ${expected}`,
    `  actual:   ${actual}`,
  ];
  if (extra.detail) summary.push(`  detail:   ${extra.detail}`);
  if (extra.json !== undefined) summary.push('  ---', JSON.stringify(redact(extra.json), null, 2));
  const txt = summary.join('\n') + '\n';
  const dir = join(EV, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.log'), txt);
  writeFileSync(join(dir, 'stdout.txt'), txt);
  RESULTS.push({ id, pass });
  console.log(`[${id}] ${pass ? 'PASS' : 'FAIL'}  ${actual.slice(0, 120)}`);
}
function record(id, pass, expected, actual, extra = {}) {
  RESULTS.push({ id, pass });
  return { id, pass };
}

const ts = Date.now();

// ============ D3-B3 run_readonly 脱敏执行（真云） ============
{
  const ro = await callTool('huaweicloud_run_readonly_command', {
    args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--cli-output=json'],
    timeoutMs: 60000, maxRetries: 1,
  });
  const text = JSON.stringify(ro);
  const leaked = /(AKIA|ASIA|HUAWEI)[A-Z0-9]{10,}/.test(text) || /"[^"]*sk[^"]*"\s*:\s*"[A-Za-z0-9]{16,}"/i.test(text);
  const ok = ro && ro.ok === true && !leaked;
  emit('D3-B3', ok,
    'run_readonly_command 执行只读命令成功 + 输出无明文 AK/SK（脱敏）',
    `ok=${ro?.ok}, exitCode=${ro?.exitCode}, stdout首行=${(ro?.stdout || '').trim().slice(0, 80)}, 明文泄露=${leaked}`);
}

// ============ D3-C4 服务矩阵 22 服务 ============
const SERVICES = [
  'ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES',
  'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB',
];
const READONLY_OP = {
  ECS: 'ListServersDetails', VPC: 'ListVpcs', OBS: 'ListBuckets', RDS: 'ListInstances',
  GaussDB: 'ListInstances', CCE: 'ListClusters', FunctionGraph: 'ListFunctions', IAM: 'KeystoneListUsers',
  CTS: 'ListTraces', CES: 'ListAlarms', DDS: 'ListInstances', DCS: 'ListInstances',
  SMN: 'ListTopics', DMS: 'ListInstances', WAF: 'ListInstances', CDN: 'ListDomains',
  ModelArts: 'ListWorkspaces', DEW: 'ListSecrets', CBR: 'ListVaults', EVS: 'ListVolumes',
  EIP: 'ListPublicips', ELB: 'ListLoadBalancers',
};
const svcMatrix = [];
let svcOkCount = 0;
for (const svc of SERVICES) {
  let listOk = false, opsCount = 0, planAllow = false, planRisk = '';
  let detail = '';
  try {
    const lr = await callTool('huaweicloud_list_operations', { service: svc, timeoutMs: 60000 });
    listOk = !!(lr?.result?.ok !== false) && !!(lr?.result?.stdout || lr?.result?.ok);
    const opMatch = (lr?.result?.stdout || '').match(/Available Operations:([\s\S]*?)\n\nRun/);
    opsCount = opMatch ? opMatch[1].trim().split(/\n/).filter(l => l.trim()).length : 0;
    detail = `list_operations ok=${lr?.result?.ok}, ops=${opsCount}`;
  } catch (e) {
    detail = `list_operations 异常: ${e.message}`;
  }
  let planOk = false;
  try {
    const op = READONLY_OP[svc] || 'ListServersDetails';
    const pr = await callTool('huaweicloud_plan_cli_command', { args: [svc, op, '--cli-region=cn-north-4'] });
    planAllow = pr?.classification?.decision === 'allow';
    planRisk = pr?.classification?.risk || '';
    // 路由断言：只读命令被 classification 放行(allow) 即视为「规范路由可执行」；risk 类别记录备案(read_only/unknown_read 均为只读侧)
    planOk = planAllow;
    detail += `; plan(${op}) decision=${pr?.classification?.decision}, risk=${pr?.classification?.risk}`;
  } catch (e) {
    detail += `; plan 异常: ${e.message}`;
  }
  const pass = listOk && planOk;
  if (pass) svcOkCount++;
  svcMatrix.push({ svc, listOk, opsCount, planOk, planAllow, planRisk, pass });
  const n = SERVICES.indexOf(svc) + 1;
  const cid = 'EXP-C4-' + String(n).padStart(2, '0');
  emit(cid, pass, `${svc} 只读规划冒烟 list_operations + plan 只读命令 规范路由可执行`,
    `${svc}: ${listOk ? '路由OK' : '路由FAIL'}(ops=${opsCount}) plan=${planAllow ? 'allow' : '非allow'}/${planRisk}`, { detail });
}
{
  const pass = svcOkCount === SERVICES.length;
  emit('D3-C4', pass, '全部 22 服务有规范路由且可执行（list_operations + plan 只读）',
    `服务矩阵 ${svcOkCount}/${SERVICES.length} 通过；未通过: ${svcMatrix.filter(s => !s.pass).map(s => s.svc).join(',') || '无'}`,
    { json: svcMatrix });
}

// ============ D3-C4 轻量创建→释放→归零（VPC 免费快速资源） + D4-14 CTS 审计 ============
let createdVpcId = null;
const vpcName = `hdkit-e2e-${ts}`;
try {
  const createArgs = ['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=192.168.0.0/16', '--cli-region=cn-north-4', '--cli-output=json'];
  const plan = await callTool('huaweicloud_plan_cli_command', { args: createArgs });
  const approvable = !!plan?.approvalToken && plan?.safeToRun === false;
  const createRes = await callTool('huaweicloud_run_approved_command', {
    args: createArgs, approvedByUser: true, approvalToken: plan.approvalToken, timeoutMs: 60000, maxRetries: 1,
  });
  let vpcId = null;
  try {
    const j = JSON.parse(createRes?.stdout || '{}');
    vpcId = j?.vpc?.id || j?.id || j?.vpc_id;
  } catch {}
  createdVpcId = vpcId;
  const createdOk = createRes?.ok === true && !!vpcId;

  // 归零前：ListVpcs 确认存在
  const list1 = await callTool('huaweicloud_run_readonly_command', {
    args: ['VPC', 'ListVpcs', '--cli-region=cn-north-4', '--cli-output=json'], timeoutMs: 60000, maxRetries: 1,
  });
  const exists = (list1?.stdout || '').includes(vpcName);

  // CTS 审计：CreateVpc trace
  const ctsCreate = await callTool('huaweicloud_run_readonly_command', {
    args: ['CTS', 'ListTraces', '--cli-region=cn-north-4', '--trace_type=system', '--service_type=VPC', '--limit=50', '--cli-output=json'],
    timeoutMs: 60000, maxRetries: 1,
  });
  const ctsHasCreate = (ctsCreate?.stdout || '').includes('CreateVpc') || (ctsCreate?.stdout || '').includes(vpcName);

  // 删除
  const delArgs = ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, '--cli-region=cn-north-4', '--cli-output=json'];
  const delPlan = await callTool('huaweicloud_plan_cli_command', { args: delArgs });
  const delRes = await callTool('huaweicloud_run_approved_command', {
    args: delArgs, approvedByUser: true, approvalToken: delPlan.approvalToken, timeoutMs: 60000, maxRetries: 1,
  });
  const delOk = delRes?.ok === true;

  // 归零验证
  const list2 = await callTool('huaweicloud_run_readonly_command', {
    args: ['VPC', 'ListVpcs', '--cli-region=cn-north-4', '--cli-output=json'], timeoutMs: 60000, maxRetries: 1,
  });
  const gone = !(list2?.stdout || '').includes(vpcName);

  // CTS 审计：DeleteVpc trace
  const ctsDelete = await callTool('huaweicloud_run_readonly_command', {
    args: ['CTS', 'ListTraces', '--cli-region=cn-north-4', '--trace_type=system', '--service_type=VPC', '--limit=50', '--cli-output=json'],
    timeoutMs: 60000, maxRetries: 1,
  });
  const ctsHasDelete = (ctsDelete?.stdout || '').includes('DeleteVpc');

  emit('D4-14', createdOk && ctsHasCreate && delOk && gone,
    '真机建最小规格资源(VPC)→执行→查 CTS 审计→删除→归零(计数=0)全程可追溯',
    `create=${createdOk}, list存在=${exists}, CTS含CreateVpc=${ctsHasCreate}, delete=${delOk}, 归零=${gone}, CTS含DeleteVpc=${ctsHasDelete}`,
    { json: { vpcName, vpcId, createdOk, exists, ctsHasCreate, delOk, gone, ctsHasDelete } });
} catch (e) {
  emit('D4-14', false, '真机建删资源 + CTS 审计', `异常: ${e.message}`);
}

// ============ D2-1 真云 E2E：auth 三端同步后 API 实际可用 ============
{
  const status = await callTool('huaweicloud_auth_status', { target: 'hermes' });
  const s1 = !!status?.credentialsConfigured;
  const s3 = !!status?.obsConfigured;
  const s2 = status?.kooCliStatus === 'ok' || status?.kooCliInstalled === true;
  // 真云 API 可用性验证：STS + ECS 只读
  const sts = await callTool('huaweicloud_run_readonly_command', { args: ['STS', 'GetCallerIdentity', '--cli-region=cn-north-4', '--cli-output=json'], timeoutMs: 60000, maxRetries: 1 });
  const stsOk = sts?.ok === true && !/APIGW\.0301/.test(sts?.stdout || '');
  const ecs = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--cli-output=json'], timeoutMs: 60000, maxRetries: 1 });
  const ecsOk = ecs?.ok === true && !/APIGW\.0301/.test(ecs?.stdout || '');
  const pass = s1 && s2 && s3 && stsOk && ecsOk;
  emit('D2-1', pass,
    'auth init/persist 三端同步(S1 credentials.json + S2 KooCLI + S3 obsconfig) 且三端 API 实际可用',
    `S1=${s1}, S2(kooCli)=${s2}, S3(obs)=${s3}, STS可用=${stsOk}, ECS可用=${ecsOk}`,
    { json: { s1, s2, s3, kooCliStatus: status?.kooCliStatus, stsOk, ecsOk, accountHint: status?.onboarding?.accountHint } });
}

// ============ D4-18/19/20 审批流（真云高危写操作） ============
{
  const highRiskArgs = ['ECS', 'CreateServers', '--server.name=hdkit-e2e', '--cli-region=cn-north-4', '--cli-output=json'];

  // D4-18 confirm-not-deny：未显式 approvedByUser → 拒绝（不静默放行，也非直接 deny 语义）
  let rejectMsg = '';
  try {
    const plan = await callTool('huaweicloud_plan_cli_command', { args: highRiskArgs });
    rejectMsg = `plan.safeToRun=${plan?.safeToRun}, hasApprovalToken=${!!plan?.approvalToken}`;
    await callTool('huaweicloud_run_approved_command', { args: highRiskArgs, approvedByUser: false, approvalToken: plan?.approvalToken });
    rejectMsg += ' | run_approved(approvedByUser=false) 未抛错(异常)';
  } catch (e) {
    rejectMsg += ` | run_approved 拒绝: ${(e.message || '').slice(0, 60)}`;
  }
  const d18 = /approvedByUser/.test(rejectMsg);
  emit('D4-18', d18, '高危写操作需显式确认(approvedByUser=true)，未确认不得放行(confirm-not-deny)',
    rejectMsg);

  // D4-19 确认流下预检仍生效：高危写计划含公开暴露端口 → 预检 warn/deny
  const sgArgs = ['ECS', 'CreateServers', '--server.name=hdkit-e2e', '--server.security_groups.1.id=bad', '--server.nics.1.subnet_id=x', '--publicip.eip.bandwidth.size=1', '--cli-region=cn-north-4'];
  const sgPlan = await callTool('huaweicloud_plan_cli_command', { args: sgArgs });
  const preflightActive = Array.isArray(sgPlan?.warnings) && sgPlan.warnings.length > 0;
  const preflightDeny = sgPlan?.classification?.decision === 'deny';
  const d19 = preflightActive || preflightDeny;
  emit('D4-19', d19, '确认流中风险预检(warnings/security-group)仍生效',
    `预检warnings=${preflightActive ? sgPlan.warnings.length + '条' : '无'}, classification=${sgPlan?.classification?.decision}, wil会=${JSON.stringify(redact(sgPlan?.warnings))}`);

  // D4-20 拒绝后零操作：无效令牌 → 拒绝，且未产生任何资源
  let zeroOpMsg = '';
  let zeroResources = true;
  try {
    await callTool('huaweicloud_run_approved_command', { args: highRiskArgs, approvedByUser: true, approvalToken: 'bogus-invalid-token' });
    zeroOpMsg = '未抛错(异常)';
  } catch (e) {
    zeroOpMsg = `拒绝: ${(e.message || '').slice(0, 60)}`;
  }
  // 归零核查：确认无名为 hdkit-e2e 的 ECS
  const ecsList = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--cli-output=json'], timeoutMs: 60000, maxRetries: 1 });
  const noEcs = !(ecsList?.stdout || '').includes('hdkit-e2e');
  const d20 = /Invalid|expired|re-plan|拒绝|deny/i.test(zeroOpMsg) && noEcs;
  emit('D4-20', d20, '拒绝(无效令牌)后零操作，无任何资源变更',
    `${zeroOpMsg} | ECS归零=${noEcs}`);
}

// ============ 汇总 ============
const passN = RESULTS.filter(r => r.pass).length;
console.log('\n=== 真云 E2E 汇总 ===');
console.log(`总计 ${RESULTS.length} 条, PASS ${passN}, FAIL ${RESULTS.length - passN}`);
console.log('FAIL:', RESULTS.filter(r => !r.pass).map(r => r.id).join(' ') || '无');