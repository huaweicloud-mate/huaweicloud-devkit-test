// cleanup-ecs.mjs — T15 ECS 实例归零：DeleteServers（连带删 EIP 和系统盘）
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
const j = hc(['ECS', 'ListServersDetails', `--cli-region=${region}`]);
const servers = j.json?.servers || [];
const s = servers.find((x) => x.name === name);
if (!s) { console.log(JSON.stringify({ success: true, detail: `ECS 实例 ${name} 不存在（无残留）` })); process.exit(0); }
const d = hc(['ECS', 'DeleteServers', `--cli-region=${region}`,
  `--servers.1.id=${s.id}`, '--delete_publicip=true', '--delete_volume=true']);
console.log(JSON.stringify({ success: !d.json || !/error/i.test(d.raw), detail: `DeleteServers ${name} → ${d.raw.slice(0, 120) || '(空)'}` }));