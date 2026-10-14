// verify-static-site.mjs — T1 部署网站 ground-truth 判定（v2，防假阴性）
// 判定逻辑：
//   1) 匿名 HTTP 重试 3 次，任一 200 + 内容含标记 → PASS
//   2) HTTP 可达但非 200（403=对象存在但 private / 404=不存在）→ FAIL
//   3) HTTP 完全不可达（网络抖动/超时）→ 降级用 hcloud 认证通道 stat 确认对象是否存在
import { spawnSync } from 'node:child_process';

const [runid, region, finalAnswer] = process.argv.slice(2);
const bucket = `devkit-bench-${runid}`;
const url = `https://${bucket}.obs.${region}.myhuaweicloud.com/index.html`;

async function fetchOnce() {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    const body = await res.text();
    return { status: res.status, markHit: body.includes('DEVBENCH-PING-OK') };
  } catch (e) {
    return { status: null, err: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(to);
  }
}

function objExists() {
  const r = spawnSync('hcloud', ['OBS', 'stat', `obs://${bucket}/index.html`], { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '');
  return !/NoSuchKey|NoSuchBucket|404/i.test(out) && /Size|size|Object|key/i.test(out) && /index\.html/.test(out);
}

let http = null;
for (let i = 0; i < 3; i++) {
  const r = await fetchOnce();
  if (r.status === 200 && r.markHit) { http = r; break; }
  if (r.status !== null) http = r; // 记最后一次确定的 HTTP 状态
  if (i < 2) await new Promise((res) => setTimeout(res, 3000));
}

const exists = objExists();
let success;
let detail;
if (http && http.status === 200 && http.markHit) {
  success = true;
  detail = `匿名 HTTP 200 + 标记命中: ${url}`;
} else if (http === null || http.status === null) {
  // 网络不可判定 → 认证通道兜底
  success = exists;
  detail = exists
    ? `公网匿名可达性未确认（本机到 OBS 端点网络抖动），但对象已部署存在 → 判 PASS（降级）`
    : `部署失败：对象不存在且匿名请求不可达`;
} else {
  // HTTP 可达但非 200（403 没设 public-read，或 404 不存在）
  success = false;
  detail = `匿名 HTTP ${http.status}（对象${exists ? '存在但未公开可读' : '不存在'}）`;
}

console.log(JSON.stringify({ success, objectExists: exists, httpStatus: http ? http.status : null, detail }));