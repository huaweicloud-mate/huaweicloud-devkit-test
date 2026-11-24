// Real probe for D3-C1: ECS生命周期E2E(真机建删)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
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
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
