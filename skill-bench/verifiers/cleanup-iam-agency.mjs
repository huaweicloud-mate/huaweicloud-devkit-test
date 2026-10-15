// cleanup-iam-agency.mjs — T19 IAM 委托归零
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
const j = hc(['IAM', 'ListAgencies', `--cli-region=${region}`, '--domain_id=842591186fa245929e1b5c186a4cf784']);
const a = (j.json?.agencies || []).find((x) => x.name === name);
if (!a) { console.log(JSON.stringify({ success: true, detail: `IAM 委托 ${name} 不存在（无残留）` })); process.exit(0); }
const d = hc(['IAM', 'DeleteAgency', `--cli-region=${region}`, `--agency_id=${a.id}`]);
console.log(JSON.stringify({ success: !d.json || !/error/i.test(d.raw), detail: `DeleteAgency ${name} → ${d.raw.slice(0, 120) || '(空)'}` }));