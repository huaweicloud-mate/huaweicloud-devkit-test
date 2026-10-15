// verify-cce-create.mjs — T18 创建 CCE 集群 ground-truth 判定
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
// 兼容普通集群 ListClusters 与 Autopilot ListAutopilotClusters
const j = hc(['CCE', 'ListClusters', `--cli-region=${region}`]) || hc(['CCE', 'ListAutopilotClusters', `--cli-region=${region}`]);
const items = j?.items || j?.clusters || [];
const s = items.find((x) => (x.metadata?.name || x.name) === name);
console.log(JSON.stringify(s
  ? { success: true, detail: `CCE 集群 ${name} 存在 (status=${s.status?.phase || s.status || 'NA'})` }
  : { success: false, detail: `未找到 CCE 集群 ${name}` }));