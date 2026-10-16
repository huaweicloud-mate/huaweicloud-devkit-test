// cleanup-sweep.mjs — 通用残留清扫器：按名字前缀 devkit-bench-<runid> 扫全类型并删除
// 用途：任务自带 cleanup 只清「主资源」（如 CCE 集群），失败/超轮的 run 会留下**中间产物**
//   实测泄漏：① 裸侧 t18（撞轮数上限）留下中间子网 → 原 cleanup-cce 只管集群
//             ② 70 轮实验的 Autopilot 型集群 —— **只扫 ListClusters 会漏掉 autopilot**（本文件已补）
//             ③ 残留安全组被 CCE 控制面占用，集群异步删除释放后才可删 → 终验必须重试
// 设计：作为 harness 的**兜底第二步**（任务 cleanup 之后再跑一遍），保证创建-销毁归零
// 用法（由 harness 调用）: node cleanup-sweep.mjs <runid> <region>
import { spawnSync } from 'node:child_process';

const [runid, region] = process.argv.slice(2);
const prefix = `devkit-bench-${runid}`;

function hc(args, timeout = 120000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}

const hit = (name) => String(name || '').startsWith(prefix);
const acted = [];
const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// 1) 计算/数据类（先删，避免占用子网/安全组）
const ecs = hc(['ECS', 'ListServersDetails', `--cli-region=${region}`]).json?.servers || [];
for (const s of ecs.filter((x) => hit(x.name))) {
  hc(['ECS', 'DeleteServers', `--servers.1.id=${s.id}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${region}`]);
  acted.push(`ECS:${s.name}`);
}
const rds = hc(['RDS', 'ListInstances', `--cli-region=${region}`]).json?.instances || [];
for (const s of rds.filter((x) => hit(x.name))) {
  hc(['RDS', 'DeleteInstance', `--instance_id=${s.id}`, `--cli-region=${region}`]);
  acted.push(`RDS:${s.name}`);
}
const fg = hc(['FunctionGraph', 'ListFunctions', `--cli-region=${region}`]).json?.functions || [];
for (const s of fg.filter((x) => hit(x.func_name))) {
  hc(['FunctionGraph', 'DeleteFunction', `--function_urn=${s.func_urn}`, `--cli-region=${region}`]);
  acted.push(`FG:${s.func_name}`);
}
const cce = hc(['CCE', 'ListClusters', `--cli-region=${region}`]).json?.items || [];
for (const s of cce.filter((x) => hit(x.metadata?.name || x.name))) {
  hc(['CCE', 'DeleteCluster', `--cluster_id=${s.id || s.metadata?.uid}`, `--cli-region=${region}`]);
  acted.push(`CCE:${s.metadata?.name || s.name}`);
}
// 1b) Autopilot 型集群（漏扫会留下集群 + 其 control 安全组/子网 —— 实测泄漏根因）
const cceA = hc(['CCE', 'ListAutopilotClusters', `--cli-region=${region}`]).json?.items || [];
for (const s of cceA.filter((x) => hit(x.metadata?.name || x.name))) {
  // Autopilot 型必须用 DeleteAutopilotCluster（用 DeleteCluster 会**静默无效** → 实测泄漏根因）
  hc(['CCE', 'DeleteAutopilotCluster', `--cluster_id=${s.id || s.metadata?.uid}`, `--cli-region=${region}`]);
  acted.push(`CCE-AUTOPILOT:${s.metadata?.name || s.name}`);
}
const smn = hc(['SMN', 'ListTopics', `--cli-region=${region}`]).json?.topics || [];
for (const s of smn.filter((x) => hit(x.name))) {
  hc(['SMN', 'DeleteTopic', `--topic_urn=${s.topic_urn}`, `--cli-region=${region}`]);
  acted.push(`SMN:${s.name}`);
}
// 1c) CodeArts 项目（ProjectMan）
const projs = hc(['ProjectMan', 'ListProjectsV4', '--limit=50', '--offset=0', `--cli-region=${region}`]).json?.projects || [];
for (const s of projs.filter((x) => hit(x.project_name))) {
  hc(['ProjectMan', 'DeleteProjectV4', `--project_id=${s.project_id}`, `--cli-region=${region}`]);
  acted.push(`CODEARTS:${s.project_name}`);
}

// 2) 网络（安全组 → 子网 → VPC）
const sgs = hc(['VPC', 'ListSecurityGroups', `--cli-region=${region}`]).json?.security_groups || [];
for (const s of sgs.filter((x) => hit(x.name))) {
  hc(['VPC', 'DeleteSecurityGroup', `--security_group_id=${s.id}`, `--cli-region=${region}`]);
  acted.push(`SG:${s.name}`);
}
const subnets = hc(['VPC', 'ListSubnets', `--cli-region=${region}`]).json?.subnets || [];
for (const s of subnets.filter((x) => hit(x.name))) {
  hc(['VPC', 'DeleteSubnet', `--subnet_id=${s.id}`, `--vpc_id=${s.vpc_id}`, `--cli-region=${region}`]);
  acted.push(`SUBNET:${s.name}`);
}
const vpcs = hc(['VPC', 'ListVpcs', `--cli-region=${region}`]).json?.vpcs || [];
for (const s of vpcs.filter((x) => hit(x.name))) {
  hc(['VPC', 'DeleteVpc', `--vpc_id=${s.id}`, `--cli-region=${region}`]);
  acted.push(`VPC:${s.name}`);
}

// 3) IAM（策略 → 组 → 委托）
const pol = hc(['IAM', 'KeystoneListPolicies']).json?.policies || [];
for (const s of pol.filter((x) => hit(x.name))) {
  hc(['IAM', 'KeystoneDeletePolicy', `--policy_id=${s.id}`]);
  acted.push(`POLICY:${s.name}`);
}
const grp = hc(['IAM', 'KeystoneListGroups']).json?.groups || [];
for (const s of grp.filter((x) => hit(x.name))) {
  hc(['IAM', 'KeystoneDeleteGroup', `--group_id=${s.id}`]);
  acted.push(`GROUP:${s.name}`);
}
const agc = hc(['IAM', 'KeystoneListAgencies']).json?.agencies || [];
for (const s of agc.filter((x) => hit(x.name))) {
  hc(['IAM', 'KeystoneDeleteAgency', `--agency_id=${s.id}`]);
  acted.push(`AGENCY:${s.name}`);
}

// 4) 终验（**带重试**：CCE 集群/CodeArts 项目等删除是异步的，立即查会误判为「残留」）
const left = [];
const scan = () => {
  left.length = 0;
  const check = (arr, nameOf) => { for (const x of arr) if (hit(nameOf(x))) left.push(nameOf(x)); };
  check(hc(['ECS', 'ListServersDetails', `--cli-region=${region}`]).json?.servers || [], (x) => x.name);
  check(hc(['RDS', 'ListInstances', `--cli-region=${region}`]).json?.instances || [], (x) => x.name);
  check(hc(['FunctionGraph', 'ListFunctions', `--cli-region=${region}`]).json?.functions || [], (x) => x.func_name);
  check(hc(['CCE', 'ListClusters', `--cli-region=${region}`]).json?.items || [], (x) => x.metadata?.name || x.name);
  check(hc(['CCE', 'ListAutopilotClusters', `--cli-region=${region}`]).json?.items || [], (x) => x.metadata?.name || x.name);
  check(hc(['VPC', 'ListSecurityGroups', `--cli-region=${region}`]).json?.security_groups || [], (x) => x.name);
  check(hc(['VPC', 'ListSubnets', `--cli-region=${region}`]).json?.subnets || [], (x) => x.name);
  check(hc(['VPC', 'ListVpcs', `--cli-region=${region}`]).json?.vpcs || [], (x) => x.name);
  check(hc(['SMN', 'ListTopics', `--cli-region=${region}`]).json?.topics || [], (x) => x.name);
  check(hc(['IAM', 'KeystoneListGroups']).json?.groups || [], (x) => x.name);
  check(hc(['IAM', 'KeystoneListPolicies']).json?.policies || [], (x) => x.name);
  check(hc(['IAM', 'KeystoneListAgencies']).json?.agencies || [], (x) => x.name);
  check(hc(['ProjectMan', 'ListProjectsV4', '--limit=50', '--offset=0', `--cli-region=${region}`]).json?.projects || [],
        (x) => x.project_name);
};

let attempts = 0;
for (let i = 1; i <= 6; i++) {
  attempts = i;
  scan();
  // 二次删除（有些类型首轮被依赖占用，释放后第二轮才能删掉）
  if (left.length && i > 1) {
    for (const s of (hc(['VPC', 'ListSecurityGroups', `--cli-region=${region}`]).json?.security_groups || []).filter((x) => hit(x.name))) {
      hc(['VPC', 'DeleteSecurityGroup', `--security_group_id=${s.id}`, `--cli-region=${region}`]);
    }
    for (const s of (hc(['VPC', 'ListSubnets', `--cli-region=${region}`]).json?.subnets || []).filter((x) => hit(x.name))) {
      hc(['VPC', 'DeleteSubnet', `--subnet_id=${s.id}`, `--vpc_id=${s.vpc_id}`, `--cli-region=${region}`]);
    }
    scan();
  }
  if (left.length === 0) break;
  if (i < 6) sleepMs(7000);
}

console.log(JSON.stringify({
  success: left.length === 0,
  detail: left.length === 0
    ? `清扫完成，无残留（本轮删除 ${acted.length} 项${acted.length ? '：' + acted.join(', ') : ''}；终验 ${attempts} 轮）`
    : `★仍有残留 ${left.length} 项：${left.join(', ')}（终验重试 ${attempts} 轮仍可见；已尝试删除 ${acted.join(', ') || '无'}）`,
  acted,
  residue: left,
  verifyAttempts: attempts,
}));
process.exit(0);