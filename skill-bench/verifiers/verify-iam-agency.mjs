// verify-iam-agency.mjs — T19 IAM 委托 ground-truth 判定
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
const j = hc(['IAM', 'ListAgencies', `--cli-region=${region}`, '--domain_id=842591186fa245929e1b5c186a4cf784']);
const agencies = j?.agencies || [];
const a = agencies.find((x) => x.name === name);
console.log(JSON.stringify(a
  ? { success: true, detail: `IAM 委托 ${name} 存在 (id=${a.id.slice(0, 12)}…)` }
  : { success: false, detail: `未找到 IAM 委托 ${name}` }));