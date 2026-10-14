// cleanup-static-site.mjs — T1 归零（v3，先判存在性再删）
// obsutil 语义：`rm obs://<bucket> -r -f` 只删对象；删空桶需 `rm obs://<bucket> -f`
import { spawnSync } from 'node:child_process';

const [runid, region] = process.argv.slice(2);
const bucket = `devkit-bench-${runid}`;

function obs(args) {
  const r = spawnSync('hcloud', ['OBS', ...args], { encoding: 'utf-8', timeout: 60000 });
  return (r.stdout || '');
}

function obsErr(args) {
  const r = spawnSync('hcloud', ['OBS', ...args], { encoding: 'utf-8', timeout: 60000 });
  return (r.stderr || '') + (r.stdout || '');
}

// 1) 桶是否存在
const ls = obs(['ls']);
const exists = ls.toLowerCase().includes(bucket);
if (!exists) {
  console.log(JSON.stringify({ success: true, detail: `桶 ${bucket} 不存在（无残留）` }));
  process.exit(0);
}

// 2) 删全部对象 + 删空桶
obsErr(['rm', `obs://${bucket}`, '-r', '-f']);
obsErr(['rm', `obs://${bucket}`, '-f']);

// 3) 终验
const ls2 = obs(['ls']);
const left = ls2.toLowerCase().includes(bucket);
console.log(JSON.stringify({
  success: !left,
  detail: left ? `⚠ 仍残留 ${bucket}` : `已删除桶 ${bucket}`,
}));