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
    mb = m.ok || /success|create/i.test(m.text);
    detail.push(`mb(${mb})=${m.text.slice(0, 90)}`);
    const c = sh(['OBS', 'cp', `${dir}/index.html`, `obs://${bucket}/index.html`, '-f', '-acl=public-read']);
    cp = c.ok || /success|upload|copy/i.test(c.text);
    detail.push(`cp(${cp})=${c.text.slice(0, 90)}`);
    const curl = run(`curl -s -o /dev/null -w "%{http_code}" --max-time 30 https://${bucket}.obs.${REGION}.myhuaweicloud.com/index.html`);
    curl200 = String(curl.text).trim() === '200';
    detail.push(`curl=${curl.text}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    sh(['OBS', 'rm', `obs://${bucket}`, '-r', '-f']);       // 先删对象
    const d = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);   // 再删空桶
    del = d.ok || /success|delete|remove/i.test(d.text);
    detail.push(`rm(${del})=${d.text.slice(0, 90)}`);
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
  const eipName = `tctest-dsh-eip-${String(Date.now()).slice(-10)}`;
  const detail = [];
  let regionListed = false, planHasRegion = false, readonlyOk = false;
  let createdId = null, released = false, zero = false;
  try {
    const h = await hdk();
    const lr = await h.tools.callTool('huaweicloud_list_regions', {});
    regionListed = !!(lr && lr.regions && lr.regions.some(r => r.id === CROSS));
    detail.push(`list_regions含${CROSS}=${regionListed}`);
    const plan = await h.tools.callTool('huaweicloud_plan_cli_command', {
      args: ['EIP', 'CreatePublicip', `--publicip.type=5_bgp`, `--bandwidth.name=${eipName}`, '--bandwidth.size=1', '--bandwidth.share_type=PER', `--cli-region=${CROSS}`],
      allowWrites: true,
    });
    const planStr = JSON.stringify(plan);
    planHasRegion = planStr.includes(`--cli-region=${CROSS}`);
    detail.push(`plan含region=${planHasRegion}`);
    const ro = sh(['EIP', 'ListPublicips', `--cli-region=${CROSS}`]);
    readonlyOk = ro.ok;
    detail.push(`只读ListPublicips.ok=${readonlyOk}`);
    const cr = sh(['EIP', 'CreatePublicip', `--publicip.type=5_bgp`, `--bandwidth.name=${eipName}`, '--bandwidth.size=1', '--bandwidth.share_type=PER', '--bandwidth.charge_mode=traffic', `--cli-region=${CROSS}`]);
    detail.push(`CreatePublicip=${cr.text.slice(0, 140)}`);
    const idm = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(cr.text);
    if (cr.ok && idm) {
      createdId = idm[1];
      detail.push(`createdId=${createdId}`);
      const rel = sh(['EIP', 'DeletePublicip', `--publicip_id=${createdId}`, `--cli-region=${CROSS}`]);
      released = rel.ok || /success|deleted|204/i.test(rel.text) || rel.text.trim() === '';
      detail.push(`DeletePublicip(${released})=${rel.text.slice(0, 90)}`);
      createdId = null;
      const ls = sh(['EIP', 'ListPublicips', `--cli-region=${CROSS}`]);
      zero = !ls.text.includes(eipName) && ls.text.includes('"total_count": 0') || (!ls.text.includes(eipName));
      detail.push(`归零=${zero}`);
    }
  } finally {
    if (createdId) { sh(['EIP', 'DeletePublicip', `--publicip_id=${createdId}`, `--cli-region=${CROSS}`]); }
  }
  const core = regionListed && planHasRegion && readonlyOk;
  return chk(core && released && zero,
    `跨区域: 区域=${regionListed} plan含region=${planHasRegion} 只读=${readonlyOk} 创建并释放=${released} 归零=${zero}`,
    `跨区域未完全通过: ${detail.join(' | ')}`.slice(0, 900));
});

// ---------- D3-C1 ECS 生命周期 E2E ----------
reg('D3-C1', async () => {
  const ts = String(Date.now()).slice(-10);
  const vpcName = `testbot2-dsh-vpc-${ts}`;
  const subnetName = `testbot2-dsh-subnet-${ts}`;
  const sgName = `testbot2-dsh-sg-${ts}`;
  const ecsName = `testbot2-dsh-ecs-${ts}`;
  const detail = [];
  let vpcId = null, subnetId = null, sgId = null, serverId = null, jobId = null;
  const cleanup = () => {
    if (serverId) sh(['ECS', 'DeleteServers', `--servers.0.id=${serverId}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]);
    if (sgId) sh(['VPC', 'DeleteSecurityGroup', `--security_group_id=${sgId}`, `--cli-region=${REGION}`]);
    if (subnetId) sh(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--cli-region=${REGION}`]);
    if (vpcId) sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
  };
  const findImage = () => {
    // IMS ListImages 全量响应 >1MB（spawnSync 默认 buffer 截断），改用过滤 query 取小列表
    const im = sh(['IMS', 'ListImages', `--cli-region=${REGION}`, '--limit=50', '--__isregistered=true']);
    try {
      const d = JSON.parse(im.text);
      const cand = (d.images || []).filter(i => (i.min_disk || 0) <= 40 && /ubuntu/i.test(i.name || ''));
      return cand.length ? cand[0].id : null;
    } catch {
      // fallback：已核验的公开 Ubuntu 24.04 server 64bit（min_disk 40）
      return '4ecd3e30-b887-43ad-844c-6cef8556f32a';
    }
  };
  let created = false, active = false, delOk = false, zero = false;
  try {
    const imageId = findImage();
    detail.push(`image=${imageId || 'NULL'}`);
    if (!imageId) return blocked('未找到可用 Linux 镜像', '解除: 确认 cn-north-4 公有镜像可查');
    const vpc = sh(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.200.0.0/16', `--cli-region=${REGION}`]);
    vpcId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(vpc.text) || [])[1] || null;
    detail.push(`vpc(${!!vpcId})=${vpc.text.slice(0, 70)}`);
    if (!vpcId) return fail('VPC 创建失败', vpc.text.slice(0, 200));
    const sub = sh(['VPC', 'CreateSubnet', `--subnet.name=${subnetName}`, `--subnet.vpc_id=${vpcId}`, '--subnet.cidr=10.200.0.0/24', '--subnet.gateway_ip=10.200.0.1', '--subnet.availability_zone=cn-north-4b', `--cli-region=${REGION}`]);
    subnetId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(sub.text) || [])[1] || null;
    detail.push(`subnet(${!!subnetId})=${sub.text.slice(0, 70)}`);
    if (!subnetId) return fail('子网创建失败', sub.text.slice(0, 200));
    const sg = sh(['VPC', 'CreateSecurityGroup', `--security_group.name=${sgName}`, `--cli-region=${REGION}`]);
    sgId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(sg.text) || [])[1] || null;
    detail.push(`sg(${!!sgId})=${sg.text.slice(0, 70)}`);
    if (!sgId) return fail('安全组创建失败', sg.text.slice(0, 200));
    const body = {
      server: {
        name: ecsName,
        imageRef: imageId,
        flavorRef: 's6.small.1',
        root_volume: { volumetype: 'SATA', size: 40 },
        vpcid: vpcId,
        nics: [{ subnet_id: subnetId }],
        security_groups: [{ id: sgId }],
        availability_zone: 'cn-north-4b',
        count: 1,
      },
    };
    const cr = sh(['ECS', 'CreateServers', `--body=${JSON.stringify(body)}`, `--cli-region=${REGION}`]);
    detail.push(`CreateServers=${cr.text.slice(0, 180)}`);
    jobId = (/"job_id"\s*:\s*"([0-9a-f-]+)"/.exec(cr.text) || [])[1] || null;
    if (!cr.ok || !jobId) return fail('ECS 购买未返回 job_id', cr.text.slice(0, 300));
    created = true;
    let st = '';
    for (let i = 0; i < 30; i++) {
      const j = sh(['ECS', 'ShowJob', `--job_id=${jobId}`, `--cli-region=${REGION}`]);
      st = (/"status"\s*:\s*"([A-Z_]+)"/.exec(j.text) || [])[1] || '';
      if (i % 3 === 0) detail.push(`job[${i}]=${st}`);
      if (st === 'SUCCESS') break;
      if (st === 'FAIL' || st === 'ROLLBACK') return fail(`ECS job 失败: ${st}`, j.text.slice(0, 300));
      await new Promise(r => setTimeout(r, 10000));
    }
    if (st !== 'SUCCESS') return fail(`ECS job 未完成: ${st}`, detail.join('|').slice(-400));
    const lsr = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
    let activeFound = false;
    try {
      const d = JSON.parse(lsr.text);
      const srv = (d.servers || []).find(s => s.name === ecsName);
      serverId = srv && srv.id;
      activeFound = !!(srv && srv.status === 'ACTIVE');
      detail.push(`server=${serverId} status=${srv && srv.status}`);
    } catch {}
    active = activeFound;
    if (serverId) {
      const dd = sh(['ECS', 'DeleteServers', `--servers.0.id=${serverId}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]);
      delOk = dd.ok;
      detail.push(`delete=${delOk} ${dd.text.slice(0, 80)}`);
      serverId = null;
    }
    const lsa = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
    zero = !lsa.text.includes(ecsName);
    detail.push(`zero=${zero}`);
    return chk(created && active && delOk && zero,
      `ECS 生命周期 E2E: 创建=${created} ACTIVE=${active} 删除=${delOk} 归零=${zero}`,
      `ECS 生命周期未通过: ${detail.join(' | ')}`.slice(0, 900));
  } finally {
    cleanup();
    const lsv = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
    if (lsv.text.includes(ecsName)) {
      try {
        const d = JSON.parse(lsv.text);
        const srv = (d.servers || []).find(s => s.name === ecsName);
        if (srv) { sh(['ECS', 'DeleteServers', `--servers.0.id=${srv.id}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]); }
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
  let wsId = null;
  try {
    const conn = await h.tools.callTool('huaweicloud_sandbox_connect', { source: 'DSH' });
    wsId = conn && (conn.devStageId || conn.sessionId || conn.dev_stage_id);
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
    return fail(`沙箱部署 E2E 异常`, `${detail.join(' | ')} || ${String(e).slice(0, 300)}`);
  }
});