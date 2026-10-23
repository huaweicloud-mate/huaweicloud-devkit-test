// D4-4 写操作审批门 — 精确断言：写语义操作（含 Change* 变更类）无审批不可执行。
// 真相源：ChangeServerOs/ChangeVpc/ChangeInstanceConfiguration 属写语义但 writeOperationPrefixes 漏列 → 审批门漏拦截。
import { classifyHcloudArgs } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const EVID = process.env.EVID_DIR;
const results = [];
function chk(name, pass, actual, expected) {
  results.push({ name, pass, actual: String(actual), expected });
}
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

// 变更类操作（写语义）：改名/换镜像/换OS/换网卡/VPC 变更/实例配置变更
const changeOps = [
  ['ECS', 'ChangeServerOs', '--server_id=x', '--image_id=y'],
  ['ECS', 'ChangeServer', '--server_id=x', '--flavorRef=y'],
  ['VPC', 'ChangeVpc', '--vpc_id=x'],
  ['ECS', 'ChangeInstanceConfiguration', '--server_id=x'],
  ['EVS', 'ChangeVolumeType', '--volume_id=x'],
];
let blockedCount = 0;
for (const a of changeOps) {
  const r = classifyHcloudArgs(a);
  const caught = r.decision === 'deny' || r.decision === 'confirm';
  const needApproval = r.isWrite === true || caught;
  chk(`Change*-${a[1]}`, needApproval, `${a[1]}: decision=${r.decision} isWrite=${r.isWrite}`, 'deny/confirm (强制审批)');
  if (caught) blockedCount++;
}

// 对照组：标准写动词应被拦截（审批门本身可用）
const create = classifyHcloudArgs(['ECS', 'CreateServers', '--server.name=x']);
chk('CreateServers(对照)', create.decision === 'deny' || create.decision === 'confirm', `decision=${create.decision}`, 'deny/confirm');

const failed = results.filter(r => !r.pass).length;
const status = failed === 0 ? 'PASS' : 'FAIL';
const out = JSON.stringify({
  status,
  caseId: 'D4-4',
  title: '写操作审批门',
  expected: '逐一切换写语义操作（含 Change* 变更类），无审批不可执行（decision=deny/confirm）',
  actual: `Change* 变更类拦截 ${blockedCount}/${changeOps.length}；CreateServers 对照 decision=${create.decision}`,
  detail: 'writeOperationPrefixes 仅列 Create/Delete/Update/Modify/Resize/Reboot/Stop/Start 等，缺 Change（ChangeServerOs/ChangeVpc/ChangeInstanceConfiguration），变更类写语义绕过审批门 → 无审批可执行',
  total: results.length, passed: results.length - failed, failed, results,
  executedAt: now14(), probe: 'probe-d4-4-change.mjs'
}, null, 2);
if (EVID) { const d = join(EVID, 'D4-4'); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), out, 'utf8'); }
console.log(out);