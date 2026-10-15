// verify-subnet.mjs — T20 创建子网 ground-truth 判定
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
const j = hc(['VPC', 'ListSubnets', `--cli-region=${region}`]);
const subnets = j?.subnets || [];
const s = subnets.find((x) => x.name === name);
console.log(JSON.stringify(s
  ? { success: true, detail: `子网 ${name} 存在 (id=${s.id.slice(0, 12)}…, cidr=${s.cidr})` }
  : { success: false, detail: `未找到子网 ${name}` }));