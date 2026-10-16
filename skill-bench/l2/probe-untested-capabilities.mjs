// probe-untested-capabilities.mjs — 「未测能力清单」只读探针（零创建、零归零负担）
// 目标：把 P1 #7 的 5 类未测能力从「没测」变成「可测/不可测 + 精确操作名」，为加用例提供依据。
// 用法: node l2/probe-untested-capabilities.mjs
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = process.env.BENCH_REGION || 'cn-north-4';

function hc(args, timeout = 90000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  let j = null;
  if (i >= 0) { try { j = JSON.parse(out.slice(i)); } catch { j = null; } }
  return { rc: r.status ?? -1, json: j, raw: out.slice(0, 160) };
}

// [能力, 候选操作, countPath（判空字段）]
const CANDIDATES = [
  ['OBS 版本控制/生命周期/CORS', ['OBS', 'ListBuckets'], 'buckets'],
  ['ECS 弹性伸缩（AS）', ['AS', 'ListScalingGroups', `--cli-region=${R}`], 'scaling_groups'],
  ['RDS 备份', ['RDS', 'ListBackups', `--cli-region=${R}`], 'backups'],
  ['RDS 可恢复时间段', ['RDS', 'ListRestoreTimes', `--cli-region=${R}`, '--instance_id=00000000-0000-0000-0000-000000000000'], ''],
  ['IAM STS 临时凭证（GetCallerIdentity）', ['STS', 'GetCallerIdentity', `--cli-region=${R}`], ''],
  ['VPC 对等连接', ['VPC', 'ListVpcPeerings', `--cli-region=${R}`], 'peerings'],
  ['VPC 对等连接（备选名）', ['VPC', 'ListPeerings', `--cli-region=${R}`], 'peerings'],
  ['EVS 快照', ['EVS', 'ListSnapshots', `--cli-region=${R}`], 'snapshots'],
  ['CES 告警规则（读取）', ['CES', 'ListAlarmHistories', `--cli-region=${R}`], 'alarm_histories'],
];

const pick = (o, p) => (p ? p.split('.').reduce((a, k) => (a == null ? a : a[k]), o) : undefined);
const results = [];
console.log('=== 未测能力只读探针（零创建）===');
for (const [cap, args, countPath] of CANDIDATES) {
  const r = hc(args);
  const cnt = pick(r.json, countPath);
  const ok = r.rc === 0 && !!r.json;
  const empty = Array.isArray(cnt) ? cnt.length === 0 : (typeof cnt === 'number' ? cnt === 0 : null);
  results.push({ capability: cap, op: args.join(' '), ok, countPath, count: cnt ?? null, raw: ok ? null : r.raw });
  const mark = ok ? (empty === null ? 'OK（可调通）' : `OK（回读 ${Array.isArray(cnt) ? cnt.length : cnt}）`) : '✗ 不可用';
  console.log(`  ${cap.padEnd(30)} ${mark}   ← hcloud ${args.slice(0, 2).join(' ')}`);
}

const okList = results.filter((x) => x.ok);
console.log(`\n可调通 = ${okList.length}/${results.length}；可直接做只读用例的候选 = ${okList.length} 个`);
const outDir = join(__dirname, 'results');
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync(join(outDir, `untested-capabilities-${ts}.json`),
  JSON.stringify({ meta: { ts, mode: 'readonly-probe', region: R, okCount: okList.length, total: results.length }, results }, null, 2), 'utf-8');
console.log(`结果落盘: l2/results/untested-capabilities-${ts}.json`);