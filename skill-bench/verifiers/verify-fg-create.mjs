// verify-fg-create.mjs — T16 创建函数 ground-truth 判定
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
const j = hc(['FunctionGraph', 'ListFunctions', `--cli-region=${region}`]);
const fns = j?.functions || [];
const f = fns.find((x) => x.func_name === name);
console.log(JSON.stringify(f
  ? { success: true, detail: `函数 ${name} 存在 (urn=${(f.func_urn || '').slice(0, 30)}…)` }
  : { success: false, detail: `未找到函数 ${name}` }));