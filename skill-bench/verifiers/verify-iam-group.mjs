// verify-iam-group.mjs — T13 IAM 用户组+自定义策略 ground-truth 判定
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
const g = hc(['IAM', 'KeystoneListGroups', `--cli-region=${region}`]);
const groups = g?.groups || [];
const grp = groups.find((x) => x.name === name);
const p = hc(['IAM', 'ListCustomPolicies', `--cli-region=${region}`]);
const policies = p?.custom_policies || p?.roles || p?.policies || [];
const pol = policies.find((x) => (x.display_name || x.name) === name);
console.log(JSON.stringify(grp && pol
  ? { success: true, detail: `IAM 组 ${name} 与同名自定义策略均存在` }
  : { success: false, detail: `组存在=${!!grp}，策略存在=${!!pol}` }));