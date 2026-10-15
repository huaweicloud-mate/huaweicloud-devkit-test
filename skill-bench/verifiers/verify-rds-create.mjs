// verify-rds-create.mjs — T17 创建 RDS 实例 ground-truth 判定
import { spawnSync } from 'node:child_process';
const [runid, region, finalAnswer] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;
function hc(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 90000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return null;
  try { return JSON.parse(out.slice(i)); } catch { return null; }
}
const j = hc(['RDS', 'ListInstances', `--cli-region=${region}`]);
const instances = j?.instances || [];
const s = instances.find((x) => x.name === name);
console.log(JSON.stringify(s
  ? { success: true, detail: `RDS 实例 ${name} 存在 (id=${s.id.slice(0, 12)}…, status=${s.status})` }
  : { success: false, detail: `未找到 RDS 实例 ${name}` }));