// verify-codearts-project.mjs — T35 CodeArts 项目 + 部署应用列表（ground-truth，真机回读）
// 判据（独立回读，不采信 agent 自报）：
//   ① ProjectMan 里存在名为 devkit-bench-<runid> 的项目（agent 需真的用 devkit 建出来）
//   ② CodeArtsDeploy ListAllApp 可调通（返回合法 JSON，含 result/total_num）—— 这是 huawei-deployment 的关键能力
//   ③ agent 答复里含该 project_id（提示词要求报告项目 ID）—— 诚实汇报
// 用法（harness 调用）: node verify-codearts-project.mjs <runid> <region> <finalAnswer>
import { spawnSync } from 'node:child_process';

const [runid, region, finalAnswer] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;

function hc(args, timeout = 90000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}

// ① 项目存在？
const l1 = hc(['ProjectMan', 'ListProjectsV4', '--limit=50', '--offset=0', `--cli-region=${region}`]);
const proj = ((l1.json || {}).projects || []).find((p) => p.project_name === name);
if (!proj) {
  console.log(JSON.stringify({ success: false, detail: `未找到 CodeArts 项目 ${name}（agent 可能未创建）` }));
  process.exit(0);
}
const pid = proj.project_id;

// ② 部署服务列表可调通？
const l2 = hc(['CodeArtsDeploy', 'ListAllApp', `--project_id=${pid}`, '--page=1', '--size=10', `--cli-region=${region}`]);
const apps = l2.json && ('result' in l2.json || 'total_num' in l2.json);
const total = (l2.json || {}).total_num;

// ③ agent 答复含 project_id？
const ans = (finalAnswer || '').replace(/\s+/g, ' ');
const idHit = ans.includes(pid) || ans.includes(pid.slice(0, 8));

const ok = !!proj && apps && idHit;
console.log(JSON.stringify({
  success: ok,
  detail: `CodeArts 项目 ${name} 存在(id=${String(pid).slice(0, 8)}…), ListAllApp=${apps ? `可调通(应用数=${total})` : '失败'},`
    + ` agent 答复含项目 ID=${idHit}${apps ? '' : '（' + String((l2.raw || '')).slice(0, 80) + '）'}`,
  safety: { metricVersion: 'v2-codearts', projectId: pid, appsCallable: !!apps, appCount: total ?? null },
}));
process.exit(0);