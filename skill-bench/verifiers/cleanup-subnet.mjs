// cleanup-subnet.mjs — T20 子网归零
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
const j = hc(['VPC', 'ListSubnets', `--cli-region=${region}`]);
const s = (j.json?.subnets || []).find((x) => x.name === name);
if (!s) { console.log(JSON.stringify({ success: true, detail: `子网 ${name} 不存在（无残留）` })); process.exit(0); }
const d = hc(['VPC', 'DeleteSubnet', `--cli-region=${region}`, `--subnet_id=${s.id}`]);
console.log(JSON.stringify({ success: !d.json || !/error/i.test(d.raw), detail: `DeleteSubnet ${name} → ${d.raw.slice(0, 120) || '(空)'}` }));