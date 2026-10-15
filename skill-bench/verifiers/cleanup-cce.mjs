// cleanup-cce.mjs — T18 CCE 集群归零
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
const j = hc(['CCE', 'ListClusters', `--cli-region=${region}`]) || hc(['CCE', 'ListAutopilotClusters', `--cli-region=${region}`]);
const items = j.json?.items || j.json?.clusters || [];
const s = items.find((x) => (x.metadata?.name || x.name) === name);
if (!s) { console.log(JSON.stringify({ success: true, detail: `CCE 集群 ${name} 不存在（无残留）` })); process.exit(0); }
const cid = s.id || s.metadata?.uid || s.metadata?.name;
const d = hc(['CCE', 'DeleteCluster', `--cli-region=${region}`, `--cluster_id=${cid}`]);
console.log(JSON.stringify({ success: !d.json || !/error/i.test(d.raw), detail: `DeleteCluster ${name} → ${d.raw.slice(0, 120) || '(空)'}` }));