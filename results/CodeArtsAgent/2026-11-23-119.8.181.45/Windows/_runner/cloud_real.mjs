import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mcpTool, writeEvidence, writeProbe, ts, VC_QUOTE, EVID } from './lib.mjs';
import { signedRequest } from './obs_lib.mjs';
import { homedir } from 'node:os';

const ADMIN = JSON.parse(readFileSync(homedir() + '/.config/huaweicloud/credentials.json.bak-d3c2-20261120', 'utf8'));
const RO = JSON.parse(readFileSync(homedir() + '/.config/huaweicloud/credentials.readonly.json', 'utf8'));
const base = ['--cli-region=cn-north-4', '--cli-access-key=' + ADMIN.ak, '--cli-secret-key=' + ADMIN.sk];
const hc = (args, timeout = 300000) => {
  const r = spawnSync('hcloud', [...args, ...base], { encoding: 'utf8', timeout, windowsHide: true });
  let parsed = null; try { parsed = JSON.parse(r.stdout); } catch { }
  return { rc: r.status, out: (r.stdout || '').slice(0, 2000), err: (r.stderr || '').slice(0, 800), parsed };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = ts().slice(2, 14);

function cleanupStack(stack) {
  const log = [];
  for (const step of stack) {
    try { log.push({ step: step.kind, id: step.id, res: hc(step.del(step.id), 240000).rc }); } catch (e) { log.push({ step: step.kind, error: String((e && e.message) || e) }); }
  }
  return log;
}

async function createVpcStack(vpcName, cidr) {
  const v = hc(['VPC', 'CreateVpc', '--vpc.name=' + vpcName, '--vpc.cidr=' + cidr]);
  const vpcId = v.parsed && v.parsed.vpc && v.parsed.vpc.id;
  if (!vpcId) return { vpcId: null, raw: v, stack: [] };
  const gw = cidr.split('/')[0].split('.').slice(0, 3).join('.') + '.1';
  const subCidr = cidr.split('/')[0].split('.').slice(0, 3).join('.') + '.0/24';
  const s = hc(['VPC', 'CreateSubnet', '--subnet.name=' + vpcName + '-subnet', '--subnet.cidr=' + subCidr, '--subnet.gateway_ip=' + gw, '--subnet.vpc_id=' + vpcId]);
  const subnetId = s.parsed && ((s.parsed.subnet && s.parsed.subnet.id) || s.parsed.id);
  return { vpcId, subnetId, sgId: null, raw: { v, s }, stack: [
    { kind: 'subnet', id: subnetId, del: (id) => ['VPC', 'DeleteSubnet', '--vpc_id=' + vpcId, '--subnet_id=' + id] },
    { kind: 'vpc', id: vpcId, del: (id) => ['VPC', 'DeleteVpc', '--vpc_id=' + id] },
  ] };
}

const cases = [];
cases.push({ id: 'D3-S2', title: '场景-删VPC先确认(真机建删)', fn: async () => {
  const nm = 'tctest-codearts1-' + stamp;
  const vpc = hc(['VPC', 'CreateVpc', '--vpc.name=' + nm, '--vpc.cidr=10.88.0.0/16']);
  const vpcId = vpc.parsed && vpc.parsed.vpc && vpc.parsed.vpc.id;
  if (!vpcId) return { status: 'FAIL', why: '真机创建 VPC 失败 rc=' + vpc.rc + ' ' + vpc.out.slice(0, 200), result: vpc };
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '删除一个VPC' }, 45000);
  const catHit = /vpc/i.test(JSON.stringify(cat.parsed || cat.text || ''));
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=' + vpcId], allowWrites: false }, 45000);
  const p = plan.parsed || {};
  const hook = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=' + vpcId }, 45000);
  const needConfirm = !!(p.approvalToken && p.safeToRun === false);
  const preDeny = ['deny', 'warn'].includes((hook.parsed && hook.parsed.decision) || '');
  const del = hc(['VPC', 'DeleteVpc', '--vpc_id=' + vpcId]);
  await sleep(4000);
  const after = hc(['VPC', 'ListVpcs']);
  const remain = ((after.parsed && after.parsed.vpcs) || []).some((v) => v.id === vpcId);
  const ok = catHit && needConfirm && preDeny && del.rc === 0 && !remain;
  return { status: ok ? 'PASS' : 'FAIL', why: '真机建 VPC ' + nm + '(id=' + vpcId + ') 路由命中=' + catHit + ' 未确认零执行=' + needConfirm + ' 预检=' + (hook.parsed && hook.parsed.decision) + ' 删除rc=' + del.rc + ' ListVpcs 归零=' + !remain, result: { vpcId, catalog: cat.parsed, plan: p, hook: hook.parsed, deleted: del.rc, remain, name: nm } };
} });

cases.push({ id: 'D3-C1', title: 'ECS生命周期E2E(真机建删)', fn: async () => {
  const nm = 'tctest-codearts1-' + stamp;
  const st = await createVpcStack(nm, '10.89.0.0/16');
  if (!st.vpcId || !st.subnetId) { cleanupStack(st.stack); return { status: 'FAIL', why: 'VPC/子网创建失败: ' + JSON.stringify(st.raw).slice(0, 500), result: st.raw }; }
  const imageId = '9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde';
  const cs = hc(['ECS', 'CreateServers',
    '--server.name=' + nm + '-ecs', '--server.imageRef=' + imageId, '--server.flavorRef=c6.large.2',
    '--server.vpcid=' + st.vpcId, '--server.availability_zone=cn-north-4a',
    '--server.nics.1.subnet_id=' + st.subnetId,
    '--server.root_volume.volumetype=SSD', '--server.root_volume.size=40'], 600000);
  const serverId = (cs.parsed && ((cs.parsed.server && cs.parsed.server.id) || (cs.parsed.serverIds && cs.parsed.serverIds[0]))) || null;
  if (!serverId) { cleanupStack(st.stack); return { status: 'FAIL', why: 'ECS CreateServers 失败 rc=' + cs.rc + ' ' + cs.out.slice(0, 300), result: { raw: cs.out, stack: st } }; }
  let status = 'BUILD', tries = 0;
  while (tries++ < 60 && status !== 'ACTIVE') { await sleep(10000); const g = hc(['ECS', 'ShowServer', '--server_id=' + serverId]); status = (g.parsed && g.parsed.server && g.parsed.server.status) || status; }
  const ds = hc(['ECS', 'DeleteServers', '--servers.1.id=' + serverId, '--delete_publicip=false', '--delete_volume=true'], 600000);
  let gone = false;
  for (let i = 0; i < 30 && !gone; i++) { await sleep(5000); const l = hc(['ECS', 'ListServersDetails']); gone = !((l.parsed && l.parsed.servers) || []).some((s) => s.id === serverId); }
  const cl = cleanupStack(st.stack);
  await sleep(4000);
  const vl = hc(['VPC', 'ListVpcs']); const vRemain = ((vl.parsed && vl.parsed.vpcs) || []).some((v) => v.id === st.vpcId);
  const ecsCount = (hc(['ECS', 'ListServersDetails']).parsed || {}).count;
  const ok = status === 'ACTIVE' && gone && !vRemain && ecsCount === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: '真机 ECS ' + nm + '-ecs(' + serverId + ') 状态=' + status + ' 删除rc=' + ds.rc + ' ListServers 归零=' + gone + ' 云上count=' + ecsCount + ' VPC/子网归零=' + !vRemain + ' cleanup=' + JSON.stringify(cl), result: { serverId, imageId, finalStatus: status, deletedVerified: gone, ecsCount, vpcRemain: vRemain, cleanup: cl } };
} });
cases.push({ id: 'D3-C2', title: 'OBS静态站部署E2E(真机建删)', fn: async () => {
  const b = 'tctest-codearts1-' + stamp;
  const xml = '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LocationConstraint>cn-north-4</LocationConstraint></CreateBucketConfiguration>';
  const c = await signedRequest('PUT', '/' + b, { body: xml, contentType: 'application/xml', headers: { 'x-obs-acl': 'public-read' } });
  const put = await signedRequest('PUT', '/index.html', { bucket: b, body: '<html><body><h1>tctest daily</h1></body></html>', contentType: 'text/html' });
  const acl = await signedRequest('PUT', '/index.html', { bucket: b, headers: { 'x-obs-acl': 'public-read' } });
  const sigGet = await signedRequest('GET', '/index.html', { bucket: b });
  let sigBody = await sigGet.text();
  if (!sigBody) { const g2 = await signedRequest('GET', '/index.html', { bucket: b }); sigBody = await g2.text(); }
  const pub = await fetch('https://' + b + '.obs.cn-north-4.myhuaweicloud.com/index.html').catch(() => ({ status: 0 }));
  const pubStatus = pub.status;
  const delObj = await signedRequest('DELETE', '/index.html', { bucket: b });
  const delBucket = await signedRequest('DELETE', '/', { bucket: b });
  const head = await signedRequest('HEAD', '/', { bucket: b });
  const cleaned = head.status === 404 && delObj.status === 204 && delBucket.status === 204;
  const deployed = c.status === 200 && put.status === 200 && sigGet.status === 200;
  const result = { create: c.status, put: put.status, acl: acl.status, sigGet: sigGet.status, sigBody: sigBody.slice(0, 120), publicStatus: pubStatus, delObj: delObj.status, delBucket: delBucket.status, headAfter: head.status };
  if (deployed && pubStatus === 200 && cleaned) return { status: 'PASS', why: '真机 OBS: 建桶 ' + b + ' 200→上传 200→对象ACL=' + acl.status + '→签名GET 200→公网GET 200→删对象/桶→head 404 归零', result };
  if (deployed && cleaned && pubStatus === 403) return { status: 'BLOCKED', why: '真机已建桶/上传/签名读/删桶归零（create=200 put=200 sigGET=200 cleaned=true），但账号级公共访问策略阻断匿名 GET（403 AccessDenied）；影响：静态站公网可访问无法验证；解除条件：解除账号 OBS BlockPublicAccess 或提供可公开读的桶策略权限', result };
  return { status: 'FAIL', why: 'OBS 静态站部署失败 create=' + c.status + ' put=' + put.status + ' sigGet=' + sigGet.status + ' public=' + pubStatus + ' cleaned=' + cleaned, result };
} });

cases.push({ id: 'D3-C13', title: 'OBS静态网站托管配置(真机)', fn: async () => {
  const b = 'tctest-codearts1-w' + stamp;
  const xml = '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LocationConstraint>cn-north-4</LocationConstraint></CreateBucketConfiguration>';
  const c = await signedRequest('PUT', '/' + b, { body: xml, contentType: 'application/xml' });
  const before = await signedRequest('GET', '/', { bucket: b, subresource: 'website' });
  const setXml = '<WebsiteConfiguration><IndexDocument><Suffix>index.html</Suffix></IndexDocument><ErrorDocument><Key>error.html</Key></ErrorDocument></WebsiteConfiguration>';
  const set = await signedRequest('PUT', '/', { bucket: b, subresource: 'website', body: setXml, contentType: 'application/xml' });
  const after = await signedRequest('GET', '/', { bucket: b, subresource: 'website' });
  const afterText = (await after.text()).slice(0, 300);
  const del = await signedRequest('DELETE', '/', { bucket: b, subresource: 'website' });
  const afterDel = await signedRequest('GET', '/', { bucket: b, subresource: 'website' });
  const delBucket = await signedRequest('DELETE', '/', { bucket: b });
  const head = await signedRequest('HEAD', '/', { bucket: b });
  const ok = c.status === 200 && before.status === 404 && set.status === 200 && after.status === 200 && /index\.html/.test(afterText) && del.status === 204 && afterDel.status === 404 && delBucket.status === 204 && head.status === 404;
  return { status: ok ? 'PASS' : 'FAIL', why: 'OBS 网站托管：未配置get=' + before.status + '→set=' + set.status + '→get核对=' + after.status + '→delete=' + del.status + '→删后get=' + afterDel.status + '→桶删除=' + delBucket.status + ' head=' + head.status, result: { create: c.status, getUnset: before.status, set: set.status, getAfter: after.status, getAfterBody: afterText, delete: del.status, getAfterDelete: afterDel.status, delBucket: delBucket.status, headAfter: head.status } };
} });
cases.push({ id: 'D4-14', title: '操作可审计性(CTS真查)', fn: async () => {
  const r = hc(['CTS', 'ListTraces', '--limit=20']);
  const traces = (r.parsed && (r.parsed.traces || r.parsed.trace_list)) || [];
  const hasIdentity = traces.length > 0 && traces.some((t) => t.user && (t.user.name || t.user.id));
  if (traces.length > 0) return { status: hasIdentity ? 'PASS' : 'FAIL', why: 'CTS ListTraces rc=' + r.rc + ' traces=' + traces.length + ' 含身份字段=' + hasIdentity, result: { count: traces.length, sample: traces.slice(0, 5) } };
  return { status: 'BLOCKED', why: '实测 ' + ts() + ' hcloud CTS ListTraces rc=' + r.rc + ' traces=0（CTS 未启用/无可见审计轨迹）；影响：无法验证 KooCLI 调用审计与身份区分；解除条件：为账号开启 CTS 并授予查询权限', result: { rc: r.rc, out: r.out.slice(0, 600) } };
} });

cases.push({ id: 'D4-13', title: '最小权限凭证通过率(只读子账号真测)', fn: async () => {
  const roArgs = ['--cli-region=cn-north-4', '--cli-access-key=' + RO.ak, '--cli-secret-key=' + RO.sk];
  const roList = spawnSync('hcloud', ['ECS', 'ListServersDetails', ...roArgs], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  const roOk = roList.status === 0 && /servers|count/i.test(roList.stdout || '');
  const nm = 'tctest-codearts1-ro-' + stamp;
  const roWrite = spawnSync('hcloud', ['VPC', 'CreateVpc', '--vpc.name=' + nm, '--vpc.cidr=10.96.0.0/16', ...roArgs], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  const wo = (roWrite.stdout || '') + (roWrite.stderr || '');
  const denied = /VPC\.0010|PolicyNotAuthorized|Policy|403/i.test(wo);
  let leaked = null; try { const j = JSON.parse(roWrite.stdout || '{}'); leaked = j && j.vpc && j.vpc.id; } catch { }
  let cleaned = true;
  if (leaked) { hc(['VPC', 'DeleteVpc', '--vpc_id=' + leaked]); const l = hc(['VPC', 'ListVpcs']); cleaned = !((l.parsed && l.parsed.vpcs) || []).some((v) => v.id === leaked); }
  const ok = roOk && denied && cleaned;
  return { status: ok ? 'PASS' : 'FAIL', why: '只读子账号(' + RO.ak.slice(0, 6) + '...): 只读清单成功=' + roOk + '；写 VPC 被 IAM 拒绝=' + denied + '；误建资源=' + (leaked || '无') + ' 清理归零=' + cleaned, result: { roStatus: roList.status, roOut: (roList.stdout || '').slice(0, 200), writeStatus: roWrite.status, writeOut: wo.slice(0, 400), leaked, cleaned } };
} });

for (const id of ['D3-C3', 'D3-C6', 'D3-S3']) {
  cases.push({ id, title: '沙箱实测', fn: async () => {
    const cu = await mcpTool('huaweicloud_sandbox_check_user', {}, 45000);
    const cred = await mcpTool('huaweicloud_sandbox_credentials', {}, 45000);
    return { status: 'BLOCKED', why: '实测 ' + ts() + ' sandbox_check_user ok=' + cu.ok + '（' + (cu.text || '').slice(0, 120) + '）；sandbox_credentials ok=' + cred.ok + '；缺 DevStation 沙箱 workspace 会话与配额；影响：sandbox 部署/7 隐式工具/预览 URL 无法实测；解除条件：提供已签协议的有效沙箱会话', result: { checkUser: { ok: cu.ok, text: (cu.text || '').slice(0, 300) }, credentials: { ok: cred.ok, text: (cred.text || '').slice(0, 200) } } };
  } });
}

const results = [];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
for (const c of cases) {
  if (ONLY && !ONLY.includes(c.id)) continue;
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: { stack: String((e && e.stack) || '').slice(0, 900) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch { }
  results.push({ id: c.id, status: r.status });
  console.log(c.id.padEnd(8), r.status.padEnd(8), String(Date.now() - t0).padStart(7), 'ms |', String(r.why || '').slice(0, 190));
}
writeFileSync(join(EVID, '..', '_cloud_real_summary.json'), JSON.stringify(results, null, 1), 'utf8');
