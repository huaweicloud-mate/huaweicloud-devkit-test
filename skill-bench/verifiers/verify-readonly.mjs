// verify-readonly.mjs — 通用只读 ground-truth 判定（L2 执行层）
// 按 runid 从 tasks.json 反查 readonlySpec，真机回读云上计数后判定：
//   mode=empty    → 回读计数必须为 0，且 agent 诚实回答空
//   mode=nonEmpty → 回读计数必须 > 0，且 agent 答案含该计数 + 关键词（回读一致）
// 判据全部来自独立回读（hcloud），不采信 agent 自报。
// 用法（由 harness 调用）: node verify-readonly.mjs <runid> <region> <finalAnswer>
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [runid, region, finalAnswer] = process.argv.slice(2);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function emit(success, detail) {
  console.log(JSON.stringify({ success, detail }));
  process.exit(0);
}

let tasks;
try {
  tasks = JSON.parse(readFileSync(join(ROOT, 'tasks', 'tasks.json'), 'utf-8'));
} catch (e) {
  emit(false, `tasks.json 读取失败: ${e.message}`);
}

// runid 形如 20261015123456-t21-0 → 取 t21 前缀反查任务
const prefix = String(runid || '').split('-').find((s) => /^t\d+$/i.test(s));
const task = tasks.find((t) => t.id.split('-')[0] === prefix);
if (!task || !task.readonlySpec) {
  emit(false, `未从 runid 解析到带 readonlySpec 的任务（runid=${runid}, prefix=${prefix}）`);
}
const spec = task.readonlySpec;

const argv = [spec.service, spec.op, `--cli-region=${spec.region || region || 'cn-north-4'}`, ...(spec.extraArgs || [])];
const r = spawnSync('hcloud', argv, { encoding: 'utf-8', timeout: 90000 });
const out = ((r.stdout || '') + (r.stderr || '')).trim();
const i = out.indexOf('{');
let j = null;
if (i >= 0) { try { j = JSON.parse(out.slice(i)); } catch { j = null; } }
if (!j) emit(false, `hcloud ${argv.join(' ')} 未返回可解析 JSON: ${out.slice(0, 200)}`);

const pick = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
let count = pick(j, spec.countPath);
if (Array.isArray(count)) count = count.length;
if (spec.mode !== 'present' && typeof count !== 'number') {
  emit(false, `countPath=${spec.countPath} 未取到数字：${JSON.stringify(j).slice(0, 200)}`);
}

const ans = (finalAnswer || '').replace(/\s+/g, ' ');
const honestEmpty = /没有|无实例|无记录|无|空|未发现|暂无|不存在|零|0\s*(个|条|台|项)/.test(ans);
const kw = spec.answerKeywords || [];
const kwHit = kw.length === 0 || kw.some((k) => ans.includes(k));
const numHit = ans.includes(String(count));

if (spec.mode === 'empty') {
  if (count === 0) {
    const ok = honestEmpty;
    emit(ok, ok
      ? `${spec.service} ${spec.op} 独立回读 0，agent 诚实回答空`
      : `${spec.service} ${spec.op} 独立回读 0；agent 未诚实说空：${ans.slice(0, 90)}`);
  } else {
    // 前置漂移容错：环境中已存在资源（非本 run 创建，如账户里本来就有 ECS）。
    // 此时「期望空」不可判定，降级为「计数一致性」判定：agent 答案须含真机回读到的计数。
    // 避免把「账户资源变化」误判为产品回归（2026-10-16 实测：账户新增 2 台非本评测 ECS，t04 曾 0/3 假失败）。
    const ok = numHit;
    emit(ok, ok
      ? `${spec.service} ${spec.op} 独立回读 ${count}（环境非空=前置漂移，已降级为计数一致性）；agent 答案含该计数`
      : `${spec.service} ${spec.op} 独立回读 ${count}（环境非空=前置漂移，降级为计数一致性）；agent 答案未含该计数：${ans.slice(0, 90)}`);
  }
} else if (spec.mode === 'present') {
  // 非计数型只读（如 STS GetCallerIdentity 返回身份信息而非列表）：判字段存在且非空 + 答复含关键词
  const val = pick(j, spec.countPath);
  const present = val !== undefined && val !== null && String(val).length > 0;
  const valHit = present && ans.includes(String(val).slice(0, 8));   // 答案须含该值前缀（回读一致）
  const ok = present && valHit && kwHit;
  emit(ok, ok
    ? `${spec.service} ${spec.op} 回读字段 ${spec.countPath} 存在且非空（前缀 ${String(val).slice(0, 8)}…），agent 答复含该值前缀 + 关键词`
    : `${spec.service} ${spec.op} 字段 ${spec.countPath} 存在=${present} 含关键词=${kwHit}：${ans.slice(0, 90)}`);
} else if (spec.mode === 'nonEmpty') {
  const ok = count > 0 && numHit && kwHit;
  emit(ok, ok
    ? `${spec.service} ${spec.op} 独立回读 ${count}，agent 答案含该计数 + 关键词（回读一致）`
    : `${spec.service} ${spec.op} 独立回读 ${count}；含计数=${numHit} 含关键词=${kwHit}：${ans.slice(0, 90)}`);
} else {
  emit(false, `未知 mode=${spec.mode}`);
}
