// cleanup-smn-topic.mjs — T10 SMN 主题归零：DeleteTopic
import { spawnSync } from 'node:child_process';

const [runid, region] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;

function runHcloud(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}

const l = runHcloud(['SMN', 'ListTopics', `--cli-region=${region}`]);
const topics = l.json ? (l.json.topics || []) : [];
const t = topics.find((x) => x.name === name || x.display_name === name);
if (!t) {
  console.log(JSON.stringify({ success: true, detail: `SMN 主题 ${name} 不存在（无残留）` }));
  process.exit(0);
}
const d = runHcloud(['SMN', 'DeleteTopic', `--cli-region=${region}`, `--topic_urn=${t.topic_urn}`]);
console.log(JSON.stringify({ success: !d.json || !/error/i.test(d.raw), detail: `DeleteTopic ${name} → ${d.raw.slice(0, 120) || '(空)'}` }));