// Real probe for D4-13: 最小权限凭证通过率
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const roCred = JSON.parse(readFileSync('C:/Users/Administrator/.config/huaweicloud/credentials.readonly.json', 'utf8'));
  const roList = spawnSync('hcloud', ['ECS', 'ListServersDetails', '--cli-profile=rotest'], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  const roOk = roList.status === 0 && /servers|count/i.test(roList.stdout);
  const roWriteName = 'tctest-ro-' + Date.now().toString().slice(-8);
  const roWrite = spawnSync('hcloud', ['VPC', 'CreateVpc', '--vpc.name=' + roWriteName, '--vpc.cidr=10.99.0.0/16', '--cli-profile=rotest'], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  const wo = (roWrite.stdout || '') + (roWrite.stderr || '');
  const denied = /PolicyNotAuthorized|VPC\.0010|权限不足|disallowed by policy|403/i.test(wo);
  let leaked = null;
  try { const j = JSON.parse(roWrite.stdout || '{}'); leaked = j && j.vpc && j.vpc.id; } catch {}
  let cleaned = true;
  if (leaked) { hc(['VPC', 'DeleteVpc', '--vpc_id=' + leaked]); const l = hc(['VPC', 'ListVpcs']); cleaned = !((l.parsed && l.parsed.vpcs) || []).some((v) => v.id === leaked); }
  const ok = roOk && denied && cleaned;
  return { status: ok ? 'PASS' : 'FAIL', why: '只读子账号(' + roCred.ak.slice(0, 6) + '...): 只读清单成功=' + roOk + '；写 VPC 被 IAM 拒绝=' + denied + '；误建资源=' + (leaked || '无') + ' 清理归零=' + cleaned, result: { roStatus: roList.status, roOut: roList.stdout.slice(0, 200), writeStatus: roWrite.status, writeOut: wo.slice(0, 500), leaked, cleaned } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
