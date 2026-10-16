// cleanup-codearts-project.mjs — T35 归零：按名字前缀删 CodeArts 项目 + 终验（带**异步重试**）
// 坑 1：DeleteProjectV4 返回 `[OPENAPI_ERROR]文件下载失败:文件名称不存在`（噪声），项目实际已删 → 只看终验
// 坑 2：删除**有传播延迟**（实测：删后立即查仍可见 → 曾误报「仍有残留」，几秒后自查已消失）
//       → 终验必须重试（本脚本 6 次 × 3s），否则把异步窗口误判为泄漏
import { spawnSync } from 'node:child_process';

const [runid, region] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;
const RETRIES = 6;
const GAP_MS = 3000;

function hc(args, timeout = 90000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}
// 同步 sleep（无 async 上下文）：Atomics.wait 不烧 CPU
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const find = () => (((hc(['ProjectMan', 'ListProjectsV4', '--limit=50', '--offset=0', `--cli-region=${region}`]).json || {})
  .projects) || []).find((p) => p.project_name === name);

const first = find();
if (!first) {
  console.log(JSON.stringify({ success: true, detail: `CodeArts 项目 ${name} 不存在（无残留）` }));
  process.exit(0);
}
const del = hc(['ProjectMan', 'DeleteProjectV4', `--project_id=${first.project_id}`, `--cli-region=${region}`]);

let left = find();
let tries = 1;
while (left && tries < RETRIES) {
  sleep(GAP_MS);
  left = find();
  tries += 1;
}

console.log(JSON.stringify({
  success: !left,
  detail: !left
    ? `DeleteProjectV4 ${name} → 终验（重试 ${tries} 次）已无该项目（删除接口响应：${String(del.raw || '').slice(0, 60) || '(空)'}）`
    : `★终验（重试 ${tries} 次仍可见）仍有残留：项目 ${name}`,
}));
process.exit(0);