// Real probe for D4-13: 最小权限凭证通过率(只读子账号真测)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
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
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
