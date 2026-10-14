// verify-smn-topic.mjs — T10 SMN 主题 ground-truth 判定
// 判据：ListTopics 回读，存在 name=devkit-bench-<runid> 的主题
import { spawnSync } from 'node:child_process';

const [runid, region] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;

function runHcloud(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}

const l = runHcloud(['SMN', 'ListTopics', `--cli-region=${region}`]);
const topics = l.json ? (l.json.topics || []) : [];
const t = topics.find((x) => x.name === name || x.display_name === name);
console.log(JSON.stringify(t
  ? { success: true, detail: `SMN 主题 ${name} 存在 (topic_urn=${t.topic_urn.slice(0, 48)}…)` }
  : { success: false, detail: `未找到 SMN 主题 ${name}` }));