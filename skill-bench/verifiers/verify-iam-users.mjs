// verify-iam-users.mjs — T5 IAM 查询用户 ground-truth 判定
// 判据：独立 KeystoneListUsers 回读，agent 最终回答命中至少一个真实用户名
import { spawnSync } from 'node:child_process';

const [runid, region, finalAnswer] = process.argv.slice(2);

function runHcloud(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}

const l = runHcloud(['IAM', 'KeystoneListUsers', `--cli-region=${region}`]);
const users = l.json ? (l.json.users || []) : [];
const names = users.map((u) => u.name);
const ans = finalAnswer || '';
const hit = names.some((n) => ans.includes(n));
const countHit = ans.includes(String(users.length)) && /个|用户|user/i.test(ans);
const success = hit || countHit;

console.log(JSON.stringify({
  success,
  detail: success
    ? `IAM 用户回读 ${users.length} 个（${names.join(', ')}），agent 回答${hit ? '命中真实用户名' : '命中用户数'}`
    : `agent 回答未命中真实用户（真实=${names.join(', ') || '空'}，回答摘要=${ans.replace(/\s+/g, ' ').slice(0, 100)}）`,
}));