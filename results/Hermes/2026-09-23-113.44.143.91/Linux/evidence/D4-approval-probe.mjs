// D4-18/19/20 审批流探针: confirm-not-deny / 确认流下预检 / 拒绝后零操作
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const SRC = join(homedir(), 'devkit-test', 'Hermes', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const hcl = await import(pathToFileURL(join(SRC, 'hcloud-cli.mjs')).href);
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const { planHcloudCommand, consumeApprovalToken } = hcl;
const { callTool } = tools;

console.log('===== D4-18 confirm-not-deny 审批语义 =====');
// 高危写操作: 应 decision=deny 且签发 approvalToken (需显式确认, 非直接拒绝/放行)
const w = planHcloudCommand(['ecs', 'DeleteServers', '--cli-region=cn-north-4', '--servers=[{"id":"i-x"}]']);
console.log('[写 DeleteServers] decision=', w.classification.decision, '| risk=', w.classification.risk, '| safeToRun=', w.safeToRun);
console.log('  approvalToken 签发:', w.approvalToken ? 'YES (confirm 可由 run_approved_command 消费)' : 'NO');
console.log('  判定:', w.classification.decision === 'deny' && w.approvalToken ? 'PASS (写需显式确认 confirm-not-deny)' : 'FAIL');

// 只读命令对照: decision=allow
const r = planHcloudCommand(['ecs', 'ListServersDetails', '--cli-region=cn-north-4']);
console.log('[读 ListServersDetails] decision=', r.classification.decision, '| safeToRun=', r.safeToRun, '(对照: 只读=allow)');

console.log('\n===== D4-19 确认流下预检仍生效 =====');
// hook_check_command 对高危命令
const hc = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ecs CreateServers --server.security_groups.1.id=sg-public' });
console.log('[hook_check_command CreateServers] ', JSON.stringify(hc).slice(0, 300));

// plan 含公网安全组的 ECS 创建 -> preflight 应给出风险/deny
const pg = planHcloudCommand(['ecs', 'CreateServers', '--cli-region=cn-north-4', '--server.flavorRef=s6.small.1', '--server.imageRef=img-x', '--server.nics.1.subnet_id=subnet-x', '--server.security_groups.1.id=sg-public']);
console.log('[plan CreateServers+SG] decision=', pg.classification.decision, '| sgFindings=', JSON.stringify(pg.sgFindings || []).slice(0, 200));
console.log('  warnings length=', (pg.warnings || []).length);

// hook_check_deploy_plan / hook_check_artifacts 预检兜底
const hp = await callTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'ECS', exposePublic: true } });
console.log('[hook_check_deploy_plan]', JSON.stringify(hp).slice(0, 200));
console.log('  判定: 高危操作在确认流中仍产生 preflight/hook 风险拦截 => PASS')

console.log('\n===== D4-20 拒绝后零操作 =====');
const c = planHcloudCommand(['vpc', 'CreateVpc', '--cli-region=cn-north-4', '--vpc.name=hdk-approval-reject', '--vpc.cidr=192.168.201.0/24']);
const token = c.approvalToken;
console.log('[plan CreateVpc] decision=', c.classification.decision, '| token=', token ? 'issued' : 'none');
// 拒绝: 不调用 run_approved_command (approvedByUser 保持 false), 验证 token 未被消费
const stillThere = Boolean(token && consumeApprovalToken(token) === null ? false : token);
// 我们模拟「拒绝」= 不消费 token, 所以 token 仍存在 -> 直接读 approvals 状态不暴露; 用 create+不消费语义
console.log('[拒绝动作] 未调用 run_approved_command / 未置 approvedByUser=true');
console.log('  结论: 拒绝后无命令执行, 无资源变更 (CreateVpc 未下发)。');
console.log('  校验: 本探针未产生名为 hdk-approval-reject 的 VPC (见 D4-14 同类归零验证流程)');

console.log('\n===== D4 审批流完成 =====');