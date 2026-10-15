// verify-vpc-egress.mjs — T11 VPC 出向规则 ground-truth 判定
import { spawnSync } from 'node:child_process';
const [runid, region, finalAnswer] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;
function hc(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return null;
  try { return JSON.parse(out.slice(i)); } catch { return null; }
}
// 找安全组 id
const sgs = hc(['VPC', 'ListSecurityGroups', `--cli-region=${region}`]);
const sgList = sgs?.security_groups || [];
const sg = sgList.find((s) => s.name === name);
if (!sg) { console.log(JSON.stringify({ success: false, detail: `安全组 ${name} 不存在` })); process.exit(0); }
// 回读规则
const rules = hc(['VPC', 'ListSecurityGroupRules', `--cli-region=${region}`, `--security_group_id.1=${sg.id}`]);
const ruleList = rules?.security_group_rules || [];
const egress = ruleList.filter((r) => r.direction === 'egress');
console.log(JSON.stringify(egress.length > 0
  ? { success: true, detail: `安全组 ${name} 共 ${ruleList.length} 条规则，出向(egress)规则 ${egress.length} 条` }
  : { success: false, detail: `安全组 ${name} 无出向规则（共 ${ruleList.length} 条）` }));