// cleanup-cce.mjs — T18 CCE（含 Autopilot）归零：按类型选正确 API → 轮询等释放 → 清中间产物 → 终验
// 实测三个坑：
//  ① Autopilot 型集群只在 `ListAutopilotClusters` 里，且删除要用 **`DeleteAutopilotCluster`**
//     —— 用 `DeleteCluster` 会**静默无效**（返回空、集群仍在）→ 这是残留泄漏的真正根因
//  ② 集群删除**异步且慢**（可达 10+ 分钟）→ 不等它释放，其 control 安全组/子网删不掉
//     （曾表现为「连删 8 次仍残留」的假泄漏）
//  ③ 中间产物（`<name>-cce-control-*` 安全组、`<name>-subnet`）由集群自动创建，必须显式清理
//  ④ **CCE 列表接口会滞后**（实测：集群实际已删、但 ListAutopilotClusters 仍返回数分钟）
//     → 本脚本的终验残留**可能是列表滞后**，判残留时请用 cleanup-sweep 复跑或稍后复核确认
import { spawnSync } from 'node:child_process';

const [runid, region] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;
const WAIT_ROUNDS = 24;          // ≤ 24 × 30s = 12 分钟
const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function hc(args, timeout = 120000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}

// 列出目标集群并标注类型（决定用哪个删除 API）
const targetClusters = () => {
  const std = (hc(['CCE', 'ListClusters', `--cli-region=${region}`]).json?.items || [])
    .map((x) => ({ ...x, __autopilot: false }));
  const auto = (hc(['CCE', 'ListAutopilotClusters', `--cli-region=${region}`]).json?.items || [])
    .map((x) => ({ ...x, __autopilot: true }));
  return [...std, ...auto].filter((x) => (x.metadata?.name || x.name) === name);
};
const delCluster = (c) => hc(['CCE', c.__autopilot ? 'DeleteAutopilotCluster' : 'DeleteCluster',
  `--cluster_id=${c.id || c.metadata?.uid}`, `--cli-region=${region}`]);
const sgs = () => (hc(['VPC', 'ListSecurityGroups', `--cli-region=${region}`]).json?.security_groups || [])
  .filter((x) => String(x.name || '').startsWith(name));
const subs = () => (hc(['VPC', 'ListSubnets', `--cli-region=${region}`]).json?.subnets || [])
  .filter((x) => String(x.name || '').startsWith(name));

const acted = [];
let cl = targetClusters();
if (cl.length) {
  for (const c of cl) {
    delCluster(c);
    acted.push(`DEL-${c.__autopilot ? 'AUTOPILOT' : 'CLUSTER'}:${name}`);
  }
  for (let i = 1; i <= WAIT_ROUNDS; i++) {
    sleepMs(30000);
    cl = targetClusters();
    if (!cl.length) { acted.push(`cluster-gone@${i * 30}s`); break; }
    if (i % 4 === 0) { for (const c of cl) delCluster(c); }   // 周期性重发删除（幂等）
  }
}

// 集群释放后清中间产物（安全组 → 子网）
for (const s of sgs()) { hc(['VPC', 'DeleteSecurityGroup', `--security_group_id=${s.id}`, `--cli-region=${region}`]); acted.push(`DEL-SG:${s.name}`); }
for (const s of subs()) { hc(['VPC', 'DeleteSubnet', `--subnet_id=${s.id}`, `--vpc_id=${s.vpc_id}`, `--cli-region=${region}`]); acted.push(`DEL-SUBNET:${s.name}`); }

// 终验（重试：网络资源删除亦有秒级窗口）
let left = [];
for (let i = 1; i <= 6; i++) {
  sleepMs(5000);
  left = [...targetClusters().map((x) => x.metadata?.name || x.name), ...sgs().map((x) => x.name), ...subs().map((x) => x.name)];
  if (!left.length) break;
  for (const s of sgs()) hc(['VPC', 'DeleteSecurityGroup', `--security_group_id=${s.id}`, `--cli-region=${region}`]);
  for (const s of subs()) hc(['VPC', 'DeleteSubnet', `--subnet_id=${s.id}`, `--vpc_id=${s.vpc_id}`, `--cli-region=${region}`]);
}

console.log(JSON.stringify({
  success: left.length === 0,
  detail: left.length === 0
    ? `CCE 归零完成（${acted.join(', ') || '无残留，无需操作'}）`
    : `★CCE 仍有残留：${left.join(', ')}（已尝试：${acted.join(', ')}）—— 集群删除慢，可用 cleanup-sweep 复跑兜底`,
}));
process.exit(0);