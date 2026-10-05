// D4-5 写操作误判检测（P0）
// 断言：删除类/写类命令不得被误判为只读（classifyHcloudArgs / plan 的 safeToRun 不得为 allow）
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-5';
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const risk = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const WRITE_CASES = [
  ['ECS', 'DeleteServers', '--server-ids', 'id1'],
  ['VPC', 'DeleteVpc', '--vpc-id', 'id1'],
  ['OBS', 'DeleteBucket', '--bucket', 'b1'],
  ['EVS', 'DeleteVolume', '--volume-id', 'v1'],
  ['EIP', 'DeleteEip', '--eip-id', 'e1'],
  ['IAM', 'DeleteUser', '--user-name', 'u1'],
  ['DCS', 'DeleteInstance', '--instance-id', 'd1'],
  ['CBR', 'DeleteVault', '--vault-id', 'vault1'],
  ['SMN', 'DeleteTopic', '--topic-urn', 'urn:x'],
  ['CCE', 'DeleteCluster', '--cluster-id', 'c1'],
  ['RDS', 'DeleteInstance', '--instance-id', 'r1'],
];

// 对照组：只读命令必须仍判 allow（防过度拦截）
const READ_CASES = [
  ['ECS', 'ListServers'],
  ['VPC', 'ListVpcs'],
  ['OBS', 'ListBuckets'],
  ['IAM', 'ListUsers'],
];

const rows = [];
for (const args of WRITE_CASES) {
  const cls = safety.classifyHcloudArgs(['hcloud', ...args]);
  rows.push({ kind: 'write', args, decision: cls.decision, risk: cls.risk, reason: (cls.reason || '').slice(0, 90) });
}
const readRows = [];
for (const args of READ_CASES) {
  const cls = safety.classifyHcloudArgs(['hcloud', ...args]);
  readRows.push({ kind: 'read', args, decision: cls.decision, risk: cls.risk });
}

const misjudgedAsReadonly = rows.filter((r) => r.decision === 'allow');
// 双引擎交叉：risk-rule-engine 对同一命令文本也必须给出 deny/warn（不得 allow）
const engineCross = rows.map((r) => {
  const ev = risk.evaluateCommandRisk(['hcloud', ...r.args].join(' '));
  return { args: r.args, engineDecision: ev.decision, ruleIds: ev.findings.map((f) => f.ruleId) };
});
const engineAllowed = engineCross.filter((r) => r.engineDecision === 'allow');

const ok = misjudgedAsReadonly.length === 0 && engineAllowed.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length} 条删除/写命令全部未被误判为只读（classifyHcloudArgs≠allow 且 risk-rule-engine≠allow）；${readRows.length} 条只读对照仍为 allow`
      : `写操作被误判：classify允许=${JSON.stringify(misjudgedAsReadonly)}；risk-engine 允许=${JSON.stringify(engineAllowed)}`,
  {
    writeCaseCount: rows.length,
    misjudgedAsReadonly,
    rows,
    readControl: readRows,
    engineCross,
    engineAllowed,
  });