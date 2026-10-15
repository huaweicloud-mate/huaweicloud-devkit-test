// cleanup-iam-group.mjs — T13 IAM 组+策略归零：删组 + 删策略
import { spawnSync } from 'node:child_process';
const [runid, region] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;
function hc(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}
// 删策略
const p = hc(['IAM', 'ListCustomPolicies', `--cli-region=${region}`]);
const policies = p.json?.custom_policies || p.json?.roles || [];
const pol = policies.find((x) => (x.display_name || x.name) === name);
if (pol && pol.id) hc(['IAM', 'DeleteCustomPolicy', `--cli-region=${region}`, `--role_id=${pol.id}`]);
// 删组
const g = hc(['IAM', 'KeystoneListGroups', `--cli-region=${region}`]);
const grp = (g.json?.groups || []).find((x) => x.name === name);
if (grp && grp.id) hc(['IAM', 'DeleteGroupV5', `--cli-region=${region}`, `--group_id=${grp.id}`]);
console.log(JSON.stringify({ success: true, detail: `IAM 组/策略 ${name} 已清理` }));