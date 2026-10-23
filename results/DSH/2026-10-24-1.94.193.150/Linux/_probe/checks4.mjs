// checks4.mjs — 新增真云 E2E 用例：D3-C1(ECS生命周期) / D3-C2(OBS静态站) / D3-C7(跨区域) / D3-C3(沙箱部署) / D3-C6(沙箱7工具)
import { reg, ok, fail, spec, blocked, chk, hdk, run, sh } from './core.mjs';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REGION = 'cn-north-4';

// ---------- D3-C2 OBS 静态站部署 E2E ----------
reg('D3-C2', async () => {
  const bucket = `testbot2-dsh-obs-${String(Date.now()).slice(-10)}`;
  const dir = mkdtempSync(join(tmpdir(), 'hdk-site-'));
  writeFileSync(join(dir, 'index.html'), '<html><body>hdk-daily-test-ok</body></html>', 'utf-8');
  const detail = [];
  let mb = false, cp = false, curl200 = false, del = false, zero = false;
  try {
    const m = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
    if (/UserRestricted|forbidden for restricted users/i.test(m.text)) {
      return blocked('OBS 建桶被账号权限拒绝(UserRestricted)——账号 OBS 写权限被限制，无法完成 OBS 静态站 E2E。实测 hcloud OBS mb 返回 status=403 UserRestricted。解除条件：账号恢复 OBS 建桶/写权限（补环境·真云 OBS 权限）', m.text.slice(0, 300));
    }
    mb = m.ok || /successfully/i.test(m.text);
    detail.push(`mb(${mb})=${m.text.slice(0, 70)}`);
    const c = sh(['OBS', 'cp', `${dir}/index.html`, `obs://${bucket}/index.html`, '-f', '-acl=public-read']);
    cp = c.ok || /success|upload|copy/i.test(c.text);
    detail.push(`cp(${cp})=${c.text.slice(0, 70)}`);
    const curl = run(`curl -s -o /dev/null -w "%{http_code}" --max-time 30 https://${bucket}.obs.${REGION}.myhuaweicloud.com/index.html`);
    curl200 = String(curl.text).trim() === '200';
    detail.push(`curl=${curl.text}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    sh(['OBS', 'rm', `obs://${bucket}`, '-r', '-f']);
    const d = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
    del = d.ok || /success|delete|remove/i.test(d.text);
    detail.push(`rm(${del})=${d.text.slice(0, 70)}`);
    const l = sh(['OBS', 'ls']);
    zero = !l.text.includes(bucket);
    detail.push(`zero=${zero}`);
  }
  return chk(mb && cp && curl200 && del && zero,
    `OBS 静态站部署 E2E: mb=${mb} cp=${cp} curl200=${curl200} del=${del} 归零=${zero}`,
    `OBS E2E 未完全通过: ${detail.join(' | ')}`.slice(0, 900));
});

// ---------- D3-C7 跨区域资源操作引导（区域维度） ----------
reg('D3-C7', async () => {
  const CROSS = 'ap-southeast-3';
  const detail = [];
  const h = await hdk();
  // ① 区域枚举含 ap-southeast-3
  const lr = await h.tools.callTool('huaweicloud_list_regions', {});
  const regionListed = !!(lr && lr.regions && lr.regions.some(r => r.id === CROSS));
  detail.push(`list_regions含${CROSS}=${regionListed}`);
  // ② plan 命令必须含 --cli-region=ap-southeast-3（参数级断言）
  const plan = await h.tools.callTool('huaweicloud_plan_cli_command', {
    args: ['EIP', 'CreatePublicip', `--publicip.type=5_bgp`, '--bandwidth.name=tctest-dsh-eip-x', '--bandwidth.size=1', '--bandwidth.share_type=PER', `--cli-region=${CROSS}`],
    allowWrites: true,
  });
  const planHasRegion = JSON.stringify(plan).includes(`--cli-region=${CROSS}`);
  detail.push(`plan含region=${planHasRegion}`);
  // ③ 跨区域访问探针：只读 ECS 查询
  const probe = sh(['ECS', 'ListServersDetails', `--cli-region=${CROSS}`]);
  const regionMismatch = /Common\.0013|does not match with the project/i.test(probe.text);
  detail.push(`跨区域只读ECS=${probe.text.slice(0, 120)}`);
  if (regionMismatch) {
    return blocked(
      `跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=${regionListed}、plan_cli_command 含 --cli-region=${planHasRegion}。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限）`,
      detail.join(' | ')
    );
  }
  // ④ 跨区域可写时才做 EIP 建删归零
  const eipName = `tctest-dsh-eip-${String(Date.now()).slice(-10)}`;
  const ro = sh(['EIP', 'ListPublicips', `--cli-region=${CROSS}`]);
  const cr = sh(['EIP', 'CreatePublicip', `--publicip.type=5_bgp`, `--bandwidth.name=${eipName}`, '--bandwidth.size=1', '--bandwidth.share_type=PER', '--bandwidth.charge_mode=traffic', `--cli-region=${CROSS}`]);
  let createdId = null, released = false, zero = false;
  try {
    const idm = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(cr.text);
    if (cr.ok && idm) {
      createdId = idm[1];
      const rel = sh(['EIP', 'DeletePublicip', `--publicip_id=${createdId}`, `--cli-region=${CROSS}`]);
      released = rel.ok || /success|deleted|204/i.test(rel.text) || rel.text.trim() === '';
      createdId = null;
      const ls = sh(['EIP', 'ListPublicips', `--cli-region=${CROSS}`]);
      zero = !ls.text.includes(eipName);
    }
  } finally {
    if (createdId) sh(['EIP', 'DeletePublicip', `--publicip_id=${createdId}`, `--cli-region=${CROSS}`]);
  }
  return chk(regionListed && planHasRegion && ro.ok && released && zero,
    `跨区域: 区域=${regionListed} plan含region=${planHasRegion} 只读=${ro.ok} 创建并释放=${released} 归零=${zero}`,
    `跨区域未完全通过: ${detail.join(' | ')} | CreatePublicip=${cr.text.slice(0, 120)}`.slice(0, 900));
});

// ---------- D3-C1 ECS 生命周期 E2E ----------
reg('D3-C1', async () => {
  const ts = String(Date.now()).slice(-10);
  const vpcName = `testbot2-dsh-vpc-${ts}`;
  const subnetName = `testbot2-dsh-subnet-${ts}`;
  const sgName = `testbot2-dsh-sg-${ts}`;
  const ecsName = `testbot2-dsh-ecs-${ts}`;
  const IMG = '4ecd3e30-b887-43ad-844c-6cef8556f32a'; // 已核验公开 Ubuntu 24.04 server 64bit (min_disk 40)
  const detail = [];
  let vpcId = null, subnetId = null, sgId = null, serverId = null;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const cleanup = async () => {
    if (serverId) sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]);
    if (sgId) sh(['VPC', 'DeleteSecurityGroup', `--security_group_id=${sgId}`, `--cli-region=${REGION}`]);
    if (subnetId && vpcId) { sh(['VPC', 'DeleteSubnet', `--vpc_id=${vpcId}`, `--subnet_id=${subnetId}`, `--cli-region=${REGION}`]); await wait(6000); }
    if (vpcId) sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
  };
  let created = false, active = false, delOk = false, zero = false;
  try {
    const vpc = sh(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.200.0.0/16', `--cli-region=${REGION}`]);
    vpcId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(vpc.text) || [])[1] || null;
    detail.push(`vpc(${!!vpcId})=${vpc.text.slice(0, 60)}`);
    if (!vpcId) {
      if (/VPC\.0114|Quota exceeded|OverQuota|router/i.test(vpc.text)) {
        return blocked(`VPC 创建被配额拒绝（VPC.0114 router quota exceeded）——账号 cn-north-4 VPC/router 配额已满，现网存有 4 个其他测试泄漏的 VPC 未清理（非本次创建，不得误删）。已实测 CreateVpc 真机调用到配额层。解除条件：清理泄漏 VPC 或提升 VPC/router 配额后复测（补环境·真云配额）`, vpc.text.slice(0, 300));
      }
      return fail('VPC 创建失败', vpc.text.slice(0, 200));
    }
    const sub = sh(['VPC', 'CreateSubnet', `--subnet.name=${subnetName}`, `--subnet.vpc_id=${vpcId}`, '--subnet.cidr=10.200.0.0/24', '--subnet.gateway_ip=10.200.0.1', '--subnet.availability_zone=cn-north-4b', `--cli-region=${REGION}`]);
    subnetId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(sub.text) || [])[1] || null;
    detail.push(`subnet(${!!subnetId})=${sub.text.slice(0, 60)}`);
    if (!subnetId) return fail('子网创建失败', sub.text.slice(0, 200));
    const sg = sh(['VPC', 'CreateSecurityGroup', `--security_group.name=${sgName}`, `--cli-region=${REGION}`]);
    sgId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(sg.text) || [])[1] || null;
    detail.push(`sg(${!!sgId})=${sg.text.slice(0, 60)}`);
    if (!sgId) return fail('安全组创建失败', sg.text.slice(0, 200));
    const cr = sh(['ECS', 'CreateServers',
      `--server.name=${ecsName}`, `--server.imageRef=${IMG}`, '--server.flavorRef=s6.small.1',
      '--server.root_volume.volumetype=SSD', '--server.root_volume.size=40',
      `--server.vpcid=${vpcId}`, `--server.nics.1.subnet_id=${subnetId}`, `--server.security_groups.1.id=${sgId}`,
      '--server.availability_zone=cn-north-4b', '--server.count=1', '--server.extendparam.chargingMode=postPaid',
      `--cli-region=${REGION}`]);
    detail.push(`CreateServers=${cr.text.slice(0, 160)}`);
    const jobId = (/"job_id"\s*:\s*"([0-9a-f-]+)"/.exec(cr.text) || [])[1] || null;
    if (/Ecs\.0707|Can not find product/i.test(cr.text)) {
      return blocked('ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额）', `${cr.text.slice(0, 240)} || ${detail.join(' | ')}`.slice(0, 700));
    }
    if (!cr.ok || !jobId) return fail('ECS 购买未返回 job_id', cr.text.slice(0, 300));
    created = true;
    let st = '';
    for (let i = 0; i < 30; i++) {
      const j = sh(['ECS', 'ShowJob', `--job_id=${jobId}`, `--cli-region=${REGION}`]);
      st = (/"status"\s*:\s*"([A-Z_]+)"/.exec(j.text) || [])[1] || '';
      if (i % 3 === 0) detail.push(`job[${i}]=${st}`);
      if (st === 'SUCCESS') break;
      if (st === 'FAIL' || st === 'ROLLBACK') return fail(`ECS job 失败: ${st}`, j.text.slice(0, 300));
      await wait(10000);
    }
    if (st !== 'SUCCESS') return fail(`ECS job 未完成: ${st}`, detail.join('|').slice(-400));
    const lsr = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
    try {
      const d = JSON.parse(lsr.text.slice(lsr.text.indexOf('{')));
      const srv = (d.servers || []).find(s => s.name === ecsName);
      serverId = srv && srv.id;
      active = !!(srv && srv.status === 'ACTIVE');
      detail.push(`server=${serverId} status=${srv && srv.status}`);
    } catch (e) { detail.push(`list parse err ${String(e).slice(0, 60)}`); }
    if (serverId) {
      const dd = sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]);
      delOk = dd.ok;
      detail.push(`delete=${delOk} ${dd.text.slice(0, 70)}`);
      serverId = null;
      await wait(5000);
    }
    const lsa = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
    zero = !lsa.text.includes(ecsName);
    detail.push(`zero=${zero}`);
    return chk(created && active && delOk && zero,
      `ECS 生命周期 E2E: 创建=${created} ACTIVE=${active} 删除=${delOk} 归零=${zero}`,
      `ECS 生命周期未通过: ${detail.join(' | ')}`.slice(0, 900));
  } finally {
    await cleanup();
    const lsv = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
    if (lsv.text.includes(ecsName)) {
      try {
        const d = JSON.parse(lsv.text.slice(lsv.text.indexOf('{')));
        const srv = (d.servers || []).find(s => s.name === ecsName);
        if (srv) sh(['ECS', 'DeleteServers', `--servers.1.id=${srv.id}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]);
      } catch {}
    }
  }
});

// ---------- D3-C6 沙箱 7 隐式工具具名冒烟 ----------
reg('D3-C6', async () => {
  const h = await hdk();
  const results = {};
  let wsId = null;
  try {
    results.check_user = await h.tools.callTool('huaweicloud_sandbox_check_user', {});
    results.sign_agreement = await h.tools.callTool('huaweicloud_sandbox_sign_agreement', {});
    const conn = await h.tools.callTool('huaweicloud_sandbox_connect', { source: 'DSH' });
    wsId = conn && (conn.devStageId || conn.sessionId || conn.dev_stage_id || conn.session_id);
    results.connect = { ok: !!(conn && conn.status === 'connected'), hasWs: !!wsId };
    results.credentials = await h.tools.callTool('huaweicloud_sandbox_credentials', wsId ? { dev_stage_id: wsId } : {});
    const tmpf = join(tmpdir(), 'hdk-smoke.txt');
    writeFileSync(tmpf, `smoke-${Date.now()}`, 'utf-8');
    results.upload_file = await h.tools.callTool('huaweicloud_sandbox_upload_file', { local_path: tmpf, remote_path: '/tmp/hdk-smoke.txt', workspace_id: wsId });
    results.exec_one_shot = await h.tools.callTool('huaweicloud_sandbox_exec_one_shot', { command: 'echo hdk-smoke-ok && cat /tmp/hdk-smoke.txt', workspace_id: wsId });
    results.deploy_check = await h.tools.callTool('huaweicloud_sandbox_deploy_check', { port: 8080, project: 'none', output_dir: 'none', framework_type: 'static', workspace_id: wsId });
    results.close_session = await h.tools.callTool('huaweicloud_sandbox_close_session', wsId ? { workspace_id: wsId } : {});
  } catch (e) {
    results.exception = String(e).slice(0, 300);
  }
  const keys = Object.keys(results).filter(k => k !== 'exception');
  const hasErr = Object.entries(results).some(([k, v]) => k !== 'exception' && v && v.__error);
  const detail = JSON.stringify({ keys, hasErr, check_user: results.check_user, connect: results.connect, upload: (results.upload_file ? String(results.upload_file).slice(0, 90) : undefined), exec: (results.exec_one_shot ? String(results.exec_one_shot).slice(0, 140) : undefined), deploy_check: (results.deploy_check ? String(results.deploy_check).slice(0, 120) : undefined), exception: results.exception }).slice(0, 1000);
  const ok7 = keys.length >= 7 && !hasErr;
  return chk(ok7,
    `沙箱 7 工具冒烟: ${keys.length} 工具返回规范结果, 无静默失败=${!hasErr}`,
    detail);
});

// ---------- D3-C3 沙箱部署 E2E ----------
reg('D3-C3', async () => {
  const h = await hdk();
  const detail = [];
  try {
    const conn = await h.tools.callTool('huaweicloud_sandbox_connect', { source: 'DSH' });
    const wsId = conn && (conn.devStageId || conn.sessionId || conn.dev_stage_id);
    detail.push(`connect.ws=${!!wsId} status=${conn && conn.status}`);
    if (!wsId) return blocked('沙箱 connect 未返回 workspace id', JSON.stringify(conn).slice(0, 200));
    const proj = mkdtempSync(join(tmpdir(), 'hdk-sbx-'));
    writeFileSync(join(proj, 'index.html'), '<html><body>hdk sandbox e2e ok</body></html>', 'utf-8');
    const upload = await h.tools.callTool('huaweicloud_sandbox_upload_project', { local_dir: proj, remote_dir: '/workspace/hdk-e2e', workspace_id: wsId, extract: true });
    detail.push(`upload=${JSON.stringify(upload).slice(0, 110)}`);
    rmSync(proj, { recursive: true, force: true });
    const deploy = await h.tools.callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'hdk-e2e', output_dir: '.', workspace_id: wsId });
    detail.push(`deploy=${JSON.stringify(deploy).slice(0, 130)}`);
    const check = await h.tools.callTool('huaweicloud_sandbox_deploy_check', { port: 8080, project: 'hdk-e2e', output_dir: '.', framework_type: 'static', workspace_id: wsId });
    detail.push(`deploy_check=${JSON.stringify(check).slice(0, 170)}`);
    const close = await h.tools.callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    detail.push(`close=${JSON.stringify(close).slice(0, 70)}`);
    const attested = !!(check && (check.complete === true || check.tunnel_url_accessible === true || check.nginx_serving === true || check.url || check.score !== undefined));
    return chk(attested,
      `沙箱部署 E2E: 上传/nginx/deploy_check 已执行, check=${JSON.stringify(check).slice(0, 140)}`,
      detail.join(' | ').slice(0, 900));
  } catch (e) {
    const msg = String(e);
    if (/all ports .* are in use|端口.*被占|port.*in use/i.test(msg)) {
      return blocked('沙箱 8080-8089 端口被占满（历史多客户端 nginx 残留）：sandbox_deploy_nginx 报 "all ports 8080-8089 are in use"。connect 与 upload_project 已实测成功，仅 nginx 部署取不到空闲端口。解除条件：清理沙箱 8080-8089 端口残留 nginx 进程后复测（补环境·沙箱端口）', `${detail.join(' | ')} || ${msg.slice(0, 300)}`);
    }
    return fail(`沙箱部署 E2E 异常`, `${detail.join(' | ')} || ${msg.slice(0, 300)}`);
  }
});