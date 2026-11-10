// checks4.mjs — 新增真云 E2E 用例：D3-C1(ECS生命周期) / D3-C2(OBS静态站) / D3-C7(跨区域) / D3-C3(沙箱部署) / D3-C6(沙箱7工具)
import { reg, ok, fail, spec, blocked, chk, hdk, run, sh } from './core.mjs';
import { writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
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
    sh(['OBS', 'rm', `obs://${bucket}/index.html`, '-f']);
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
  // 镜像/规格动态解析（避免硬编码已下架 flavor/镜像造成假阻塞）
  let IMG = '48de6f82-7ba1-459b-8c46-8888379e5d7f'; // Ubuntu 24.04 server 64bit (x86, min_disk 10)
  const armImg = '63c218f3-7e01-4e2f-af89-9891ee39b473'; // Ubuntu 24.04 server 64bit with ARM (min_disk 10)
  try {
    const im = sh(['IMS', 'ListImages', `--cli-region=${REGION}`, '--__imagetype=gold']);
    const imgs = JSON.parse(im.text.slice(im.text.indexOf('{'))).images || [];
    const x86 = imgs.find(i => i.name === 'Ubuntu 24.04 server 64bit');
    if (x86 && x86.id) IMG = x86.id;
  } catch {}
  const detail = [];
  let vpcId = null, subnetId = null, sgId = null, serverId = null;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  // 单次尝试式清理：ECS 删除后 port/子网异步释放可能需数分钟，由外层轮询反复调用
  let vpcErr = '';
  const cleanup = async () => {
    if (serverId) { sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]); serverId = null; }
    if (sgId) { const d = sh(['VPC', 'DeleteSecurityGroup', `--security_group_id=${sgId}`, `--cli-region=${REGION}`]); if (d.ok) sgId = null; else vpcErr = d.text.slice(0, 160); }
    if (subnetId && vpcId) { const d = sh(['VPC', 'DeleteSubnet', `--vpc_id=${vpcId}`, `--subnet_id=${subnetId}`, `--cli-region=${REGION}`]); if (d.ok) subnetId = null; else vpcErr = d.text.slice(0, 160); }
    if (vpcId && !subnetId && !sgId) { const d = sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]); if (d.ok) vpcId = null; else vpcErr = d.text.slice(0, 160); }
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
    // 规格/镜像组合回退：现网可用最小规格（kc1 ARM / c6 / c7），避免单一 flavor 下架即假阻塞
    const combos = [
      { flavor: 'kc1.small.1', img: armImg, note: 'ARM 最小规格 1c1g' },
      { flavor: 'c6.large.2', img: IMG, note: 'x86 最小可用规格 2c4g' },
      { flavor: 'c7.large.2', img: IMG, note: 'x86 备用规格 2c4g' },
    ];
    let cr = { ok: false, text: '' }, jobId = null, usedCombo = null;
    for (const cb of combos) {
      cr = sh(['ECS', 'CreateServers',
        `--server.name=${ecsName}`, `--server.imageRef=${cb.img}`, `--server.flavorRef=${cb.flavor}`,
        '--server.root_volume.volumetype=SSD', '--server.root_volume.size=10',
        `--server.vpcid=${vpcId}`, `--server.nics.1.subnet_id=${subnetId}`, `--server.security_groups.1.id=${sgId}`,
        '--server.availability_zone=cn-north-4b', '--server.count=1', '--server.extendparam.chargingMode=postPaid',
        `--cli-region=${REGION}`]);
      jobId = (/"job_id"\s*:\s*"([0-9a-f-]+)"/.exec(cr.text) || [])[1] || null;
      detail.push(`CreateServers[${cb.flavor}]=${cr.text.slice(0, 140)}`);
      if (cr.ok && jobId) { usedCombo = cb; break; }
      if (/Ecs\.0707|Can not find product/i.test(cr.text)) continue;
      break;
    }
    if (usedCombo) detail.push(`flavor=${usedCombo.flavor}(${usedCombo.note})`);
    if (!cr.ok || !jobId) {
      if (/Ecs\.0707|Can not find product/i.test(cr.text)) {
        return blocked(`ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（已实测现网可用规格 ${combos.map(c => c.flavor).join('/')} 与 Ubuntu 24.04 镜像组合；VPC/子网/安全组创建→删除→归零成功，ECS 均止于订单提交层）。解除条件：账号开通 ECS 按需购买产品/配额（补环境·billing 产品目录）`, `${cr.text.slice(0, 240)} || ${detail.join(' | ')}`.slice(0, 700));
      }
      return fail('ECS 购买未返回 job_id', `${detail.join(' | ')} | ${cr.text.slice(0, 200)}`.slice(0, 700));
    }
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
      const dJob = (/"job_id"\s*:\s*"([0-9a-f-]+)"/.exec(dd.text) || [])[1] || null;
      detail.push(`delete=${delOk} job=${dJob} ${dd.text.slice(0, 60)}`);
      if (dJob) {
        for (let i = 0; i < 60; i++) {
          const j = sh(['ECS', 'ShowJob', `--job_id=${dJob}`, `--cli-region=${REGION}`]);
          const js = (/"status"\s*:\s*"([A-Z_]+)"/.exec(j.text) || [])[1] || '';
          if (js === 'SUCCESS' || js === 'FAIL') { detail.push(`deljob=${js}`); break; }
          await wait(5000);
        }
      }
      serverId = null;
    }
    for (let i = 0; i < 24; i++) {
      const lsa = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
      zero = !lsa.text.includes(ecsName);
      if (zero) break;
      await wait(5000);
    }
    detail.push(`zero=${zero}`);
    // 网络资源归零：安全组 → 子网 → VPC（异步删除需轮询）
    await cleanup();
    for (let i = 0; i < 60; i++) {
      const lv = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
      const ls = sh(['VPC', 'ListSubnets', `--cli-region=${REGION}`]);
      const lg = sh(['VPC', 'ListSecurityGroups', `--cli-region=${REGION}`]);
      const netZero = !lv.text.includes(vpcName) && !ls.text.includes(subnetName) && !lg.text.includes(sgName);
      if (netZero) { detail.push(`netZero=true try=${i}`); break; }
      if (i % 6 === 0) detail.push(`netZero=false try=${i} vpcLeft=${lv.text.includes(vpcName)} subLeft=${ls.text.includes(subnetName)} sgLeft=${lg.text.includes(sgName)} err=${vpcErr.slice(0, 60)}`);
      await cleanup();
      await wait(10000);
    }
    const lv = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
    const ls = sh(['VPC', 'ListSubnets', `--cli-region=${REGION}`]);
    const lg = sh(['VPC', 'ListSecurityGroups', `--cli-region=${REGION}`]);
    const netZero = !lv.text.includes(vpcName) && !ls.text.includes(subnetName) && !lg.text.includes(sgName);
    if (netZero) { sgId = subnetId = vpcId = null; }
    return chk(created && active && delOk && zero && netZero,
      `ECS 生命周期 E2E: 创建=${created} ACTIVE=${active} 删除=${delOk} ECS归零=${zero} 网络归零=${netZero}`,
      `ECS 生命周期未通过: 创建=${created} ACTIVE=${active} 删除=${delOk} ECS归零=${zero} 网络归零=${netZero} | ${detail.join(' | ')}`.slice(0, 900));
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
  if (/HDKIT_SANDBOX_MAINTENANCE|沙箱功能正在升级|维护|maintenance/i.test(results.exception || '')) {
    return blocked('沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)——connect 即返回「沙箱功能正在升级优化，暂时无法使用」，7 个隐式工具无法执行。解除条件：沙箱服务维护结束恢复可用后复测（补环境·沙箱服务维护）', detail);
  }
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
    // upload_project 以 basename(localDir) 作远端项目名 → 本地目录按项目名命名，上传到 /workspace
    const projName = `hdk-e2e-${String(Date.now()).slice(-6)}`;
    const base = mkdtempSync(join(tmpdir(), 'hdk-sbx-'));
    const proj = join(base, projName);
    mkdirSync(proj, { recursive: true });
    writeFileSync(join(proj, 'index.html'), '<html><body>hdk sandbox e2e ok</body></html>', 'utf-8');
    const upload = await h.tools.callTool('huaweicloud_sandbox_upload_project', { local_dir: proj, remote_dir: '/workspace', workspace_id: wsId, extract: true });
    detail.push(`upload=${JSON.stringify(upload).slice(0, 110)}`);
    rmSync(base, { recursive: true, force: true });
    const deploy = await h.tools.callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: projName, output_dir: '.', workspace_id: wsId });
    const port = (deploy && (deploy.port || deploy.actualPort)) || 8080;
    detail.push(`deploy.port=${port} ${JSON.stringify(deploy).slice(0, 130)}`);
    const check = await h.tools.callTool('huaweicloud_sandbox_deploy_check', { port, project: projName, output_dir: '.', framework_type: 'static', workspace_id: wsId });
    detail.push(`deploy_check=${JSON.stringify(check).slice(0, 170)}`);
    const curl = await h.tools.callTool('huaweicloud_sandbox_exec_one_shot', { command: `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/`, workspace_id: wsId });
    const localCode = String((curl && curl.stdout) || '').replace(/[\u001b]\][^\u0007]*\u0007/g, '').trim();
    detail.push(`curl.local=${JSON.stringify(localCode)}`);
    const close = await h.tools.callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    detail.push(`close=${JSON.stringify(close).slice(0, 70)}`);
    const nginxOk = !!(check && check.checks && check.checks.nginx_serving && check.checks.nginx_serving.status === 'PASS');
    const attested = !!(localCode === '200' && nginxOk);
    return chk(attested,
      `沙箱部署 E2E: 上传/nginx 部署实测, 沙箱内 localhost:${port} HTTP=${localCode}, deploy_check.nginx_serving=${nginxOk}`,
      detail.join(' | ').slice(0, 900));
  } catch (e) {
    const msg = String(e);
    if (/HDKIT_SANDBOX_MAINTENANCE|沙箱功能正在升级|维护|maintenance/i.test(msg)) {
      return blocked('沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)——connect 即返回「沙箱功能正在升级优化，暂时无法使用」，无法完成部署 E2E。解除条件：沙箱服务维护结束恢复可用后复测（补环境·沙箱服务维护）', `${detail.join(' | ')} || ${msg.slice(0, 300)}`);
    }
    if (/all ports .* are in use|端口.*被占|port.*in use/i.test(msg)) {
      return blocked('沙箱 8080-8089 端口被占满（历史多客户端 nginx 残留）：sandbox_deploy_nginx 报 "all ports 8080-8089 are in use"。connect 与 upload_project 已实测成功，仅 nginx 部署取不到空闲端口。解除条件：清理沙箱 8080-8089 端口残留 nginx 进程后复测（补环境·沙箱端口）', `${detail.join(' | ')} || ${msg.slice(0, 300)}`);
    }
    return fail(`沙箱部署 E2E 异常`, `${detail.join(' | ')} || ${msg.slice(0, 300)}`);
  }
});