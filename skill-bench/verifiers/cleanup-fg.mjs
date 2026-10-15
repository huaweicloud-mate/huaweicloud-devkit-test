// cleanup-fg.mjs — T16 函数归零
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
const j = hc(['FunctionGraph', 'ListFunctions', `--cli-region=${region}`]);
const f = (j.json?.functions || []).find((x) => x.func_name === name);
if (!f) { console.log(JSON.stringify({ success: true, detail: `函数 ${name} 不存在（无残留）` })); process.exit(0); }
const urn = String(f.func_urn || '').replace(':latest', '');
const d = hc(['FunctionGraph', 'DeleteFunction', `--cli-region=${region}`, `--function_urn=${urn}`]);
console.log(JSON.stringify({ success: !d.json || !/error/i.test(d.raw), detail: `DeleteFunction ${name} → ${d.raw.slice(0, 120) || '(空)'}` }));