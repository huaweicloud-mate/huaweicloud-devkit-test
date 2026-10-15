// verify-smn-publish.mjs — T12 SMN 发布消息 ground-truth 判定
import { spawnSync } from 'node:child_process';
const [runid, region, finalAnswer] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;
function hc(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}
// 主题存在
const l = hc(['SMN', 'ListTopics', `--cli-region=${region}`]);
const topics = l.json?.topics || [];
const t = topics.find((x) => x.name === name || x.display_name === name);
const ans = (finalAnswer || '').replace(/\s+/g, ' ');
const published = /message_id|消息|已发布|发布成功|message id/i.test(ans);
console.log(JSON.stringify(t && published
  ? { success: true, detail: `SMN 主题 ${name} 存在，且 agent 已发布消息` }
  : { success: false, detail: `主题存在=${!!t}，发布=${published}；回答摘要=${ans.slice(0, 100)}` }));