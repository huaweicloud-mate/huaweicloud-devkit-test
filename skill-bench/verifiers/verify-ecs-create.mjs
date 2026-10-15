// verify-ecs-create.mjs — T15 创建 ECS 实例 ground-truth 判定
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
const j = hc(['ECS', 'ListServersDetails', `--cli-region=${region}`]);
const servers = j?.servers || [];
const s = servers.find((x) => x.name === name);
if (!s) { console.log(JSON.stringify({ success: false, detail: `未找到 ECS 实例 ${name}` })); process.exit(0); }
console.log(JSON.stringify({ success: true, detail: `ECS 实例 ${name} 存在 (id=${s.id.slice(0, 12)}…, status=${s.status})` }));