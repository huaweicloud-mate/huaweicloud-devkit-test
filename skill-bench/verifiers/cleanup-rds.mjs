// cleanup-rds.mjs — T17 RDS 实例归零
import { spawnSync } from 'node:child_process';
const [runid, region] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;
function hc(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 120000 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}
const j = hc(['RDS', 'ListInstances', `--cli-region=${region}`]);
const s = (j.json?.instances || []).find((x) => x.name === name);
if (!s) { console.log(JSON.stringify({ success: true, detail: `RDS 实例 ${name} 不存在（无残留）` })); process.exit(0); }
const d = hc(['RDS', 'DeleteInstance', `--cli-region=${region}`, `--instance_id=${s.id}`]);
console.log(JSON.stringify({ success: !d.json || !/error/i.test(d.raw), detail: `DeleteInstance ${name} → ${d.raw.slice(0, 120) || '(空)'}` }));