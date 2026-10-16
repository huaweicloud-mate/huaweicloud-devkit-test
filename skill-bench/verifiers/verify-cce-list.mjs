// verify-cce-list.mjs — T8 查 CCE 集群列表 ground-truth 判定（只读）
import { spawnSync } from 'node:child_process';
const [runid, region, finalAnswer] = process.argv.slice(2);
function hc(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return null;
  try { return JSON.parse(out.slice(i)); } catch { return null; }
}
const j = hc(['CCE', 'ListClusters', `--cli-region=${region}`]);
const count = Array.isArray(j?.items) ? j.items.length : null;
const ans = (finalAnswer || '').replace(/\s+/g, ' ');
const emptyHit = /没有|无集群|空|0\s*(个|台)|未发现|暂无|不存在|暂无集群/.test(ans);
const numHit = typeof count === 'number' && ans.includes(String(count));
const okEmpty = count === 0 && emptyHit;
const okDrift = typeof count === 'number' && count > 0 && numHit;  // 前置漂移：环境非空 → 降级为计数一致性
const detail = okEmpty
  ? `CCE 回读 ${count} 个集群，agent 诚实回答空`
  : (okDrift
      ? `CCE 回读 ${count} 个集群（环境非空=前置漂移，已降级为计数一致性），agent 答案含该计数`
      : `CCE 回读 ${count ?? 'NA'} 个集群；agent${emptyHit ? '诚实' : '未含该计数'}：${ans.slice(0, 100)}`);
console.log(JSON.stringify({ success: okEmpty || okDrift, detail }));