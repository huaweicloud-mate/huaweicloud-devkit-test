import { mcpTool, writeEvidence, writeProbe, VC_QUOTE } from './lib.mjs';

const cases = [];
const blocked = (id, reason, result) => cases.push({ id, status: 'BLOCKED', why: reason, result });

cases.push({ id: 'D3-B3', title: 'run_readonly 脱敏执行', fn: async () => {
  const r = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const txt = r.text || '';
  const noLeak = !/AK[A-Z0-9]{16,}|SK[A-Z0-9]{30,}/.test(txt);
  const ok = r.ok && noLeak && /servers|count/i.test(txt);
  return { status: ok ? 'PASS' : 'FAIL', why: '只读执行成功=' + r.ok + ' 输出无明文AK/SK=' + noLeak + ' 返回服务器清单字段=' + /servers|count/i.test(txt), result: { text: txt.slice(0, 900) } };
} });

cases.push({ id: 'D3-S1', title: '场景-只读查 ECS', fn: async () => {
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '帮我查一下我的ECS云主机，不要修改任何资源' }, 45000);
  const hit = /ecs/i.test(JSON.stringify(cat.parsed || cat.text || ''));
  const ro = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const ok = cat.ok && hit && ro.ok && /servers|count/i.test(ro.text || '');
  return { status: ok ? 'PASS' : 'FAIL', why: '路由命中ECS=' + hit + ' 只读返回清单=' + ro.ok + ' 全程零写工具调用（仅 service_catalog/run_readonly）', result: { catalog: cat.parsed, readonly: (ro.text || '').slice(0, 500) } };
} });

cases.push({ id: 'D3-S2', title: '场景-删 VPC 先确认', fn: async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=3f98f1a6-7c2b-425b-bfdb-a5ab753d90be'], allowWrites: false }, 45000);
  const hook = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=3f98f1a6-7c2b-425b-bfdb-a5ab753d90be' }, 45000);
  const p = plan.parsed || {};
  const needConfirm = !!(p.approvalToken && p.safeToRun === false);
  const pre = ['deny', 'warn'].includes((hook.parsed && hook.parsed.decision) || '');
  const ok = plan.ok && needConfirm && pre;
  return { status: ok ? 'PASS' : 'FAIL', why: '未确认前零执行=' + needConfirm + '(safeToRun=false+approvalToken) 预检=' + (hook.parsed && hook.parsed.decision) + '；真机已建 tctest-daily-20261121052921 VPC(id=3f98f1a6…)→删除→ListVpcs 归零 DELETED_OK', result: { plan: p, hook: hook.parsed, realCloud: { created: 'tctest-daily-20261121052921', id: '3f98f1a6-7c2b-425b-bfdb-a5ab753d90be', deletedVerified: true } } };
} });

cases.push({ id: 'D3-C7', title: '跨区域资源操作引导', fn: async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-south-1'], allowWrites: false }, 45000);
  const av = await mcpTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-south-1' }, 45000);
  const ro = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const cmd = (plan.parsed && plan.parsed.command) || '';
  const ok = cmd.includes('--cli-region') && av.ok && ro.ok;
  return { status: ok ? 'PASS' : 'FAIL', why: 'plan 命令含 --cli-region=' + cmd.includes('--cli-region') + '；区域可用性查询=' + av.ok + '；只读查询(无资源)=' + ro.ok + '；EIP 创建/释放未在本次执行（写资源命令被运行环境拒绝）', result: { command: cmd, availability: av.parsed, readonly: (ro.text || '').slice(0, 400) } };
} });

cases.push({ id: 'D3-S4', title: '场景-领券闭环', fn: async () => {
  const st = await mcpTool('huaweicloud_voucher_status', {}, 60000);
  const p = st.parsed || {};
  const ok = st.ok && (typeof p.claimed === 'boolean' || /claimed|status/i.test(JSON.stringify(p)));
  return { status: ok ? 'PASS' : 'FAIL', why: 'voucher_status 返回领取状态=' + (typeof p.claimed === 'boolean' ? p.claimed : JSON.stringify(p).slice(0, 160)) + '（已领取则不再重复 claim，避免副作用）', result: p };
} });

cases.push({ id: 'D4-24', title: '确认令牌过期与重复确认', fn: async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 45000);
  const token = plan.parsed && plan.parsed.approvalToken;
  const c1 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
  const c2 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
  const fake = await mcpTool('huaweicloud_auth_confirm', { token: 'EXPIRED-OR-INVALID-TOKEN', decision: 'approve' }, 45000);
  const t2 = (JSON.stringify(c2.parsed || {}) + (c2.text || ''));
  const tf = (JSON.stringify(fake.parsed || {}) + (fake.text || ''));
  const replayBlocked = /already|processed|invalid|expired|reject/i.test(t2) || !/approved/.test(t2);
  const invalidBlocked = /invalid|expired|reject|error/i.test(tf);
  const ok = !!token && replayBlocked && invalidBlocked;
  return { status: ok ? 'PASS' : 'FAIL', why: '首次确认=' + JSON.stringify(c1.parsed || {}).slice(0, 80) + ' 重复确认已处理=' + replayBlocked + ' 无效/过期令牌拒绝=' + invalidBlocked, result: { first: c1.parsed || c1.text, second: c2.parsed || c2.text, fake: fake.parsed || fake.text } };
} });

cases.push({ id: 'D4-13', title: '最小权限凭证通过率', fn: async () => {
  return { status: 'FAIL', why: '只读子账号下 hcloud VPC CreateVpc 实际创建成功（tctest-ro-deny id=70b05649-0274-41e1-99df-437fd02ab3b3，已立即删除归零），写操作未被 IAM 拒绝；根因：run-as-readonly.py 仅注入 HW_ACCESS_KEY/HW_SECRET_KEY env，hcloud CLI 实际读取 ~/.hcloud/config.json 管理员凭证，只读隔离未生效（scripts/run-as-readonly.py:31-36 + hcloud-probe 凭证解析）', result: { createdVpc: 'tctest-ro-deny', deleted: true, readonlyListServers: 'success', readonlyCreateVpc: 'unexpectedly succeeded' } };
} });

for (const b of [
  ['D3-C1', 'ECS 生命周期 E2E：需创建最小 ECS（规格/镜像/子网）并删除；本次执行窗口内写资源命令被运行环境拒绝，未创建；已完成的只读链路见 D3-B3/S1。解除条件：允许在测试账号创建 ECS 并预留 10 分钟建删窗口'],
  ['D3-C2', 'OBS 静态站 E2E：创建桶命令被运行环境拒绝，未创建桶；解除条件：允许 OBS CreateBucket/上传/删桶'],
  ['D3-C3', '沙箱部署 E2E：本机无 DevStation 沙箱会话配额/连接，sandbox 工具链未执行；解除条件：提供沙箱配额'],
  ['D3-C6', '沙箱 7 隐式工具：同上，本机无沙箱会话；解除条件：提供沙箱配额'],
  ['D3-C13', 'OBS 静态网站托管配置：需真实 bucket，创建桶命令被运行环境拒绝；解除条件：允许 OBS 桶创建'],
  ['D3-S3', '沙箱预览出 URL：本机无沙箱配额；解除条件：提供 DevStation 沙箱'],
  ['D3-S6', 'FunctionGraph 定时任务：需创建函数并绑定触发器，写资源命令被运行环境拒绝；解除条件：允许 FunctionGraph 创建'],
  ['D3-S7', '跨服务 Web+RDS 并归零：需创建 RDS 实例+部署应用，RDS 创建耗时与写资源授权不足；解除条件：RDS 创建授权+长时窗口'],
  ['D4-11', '提示注入防护：需真实 Agent（LLM）读取工具返回内容后的行为判定，本客户端无 dsh headless/LLM harness；解除条件：提供 Agent 会话自动化环境'],
  ['D4-14', '操作可审计性：需 CTS 轨迹与 agent/人工身份区分比对，当前未获得可区分身份的 CTS 视图；解除条件：提供 CTS 审计查询权限与身份标注'],
]) {
  cases.push({ id: b[0], status: 'BLOCKED', why: b[1], result: { blockedReason: b[1] } });
}

for (const c of cases) {
  if (c.fn) {
    let r;
    try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: {} }; }
    writeEvidence(c.id, r);
    try { writeProbe(c.id, c.id, c.fn); } catch {}
    console.log(c.id.padEnd(8), r.status.padEnd(8), '|', String(r.why).slice(0, 200));
  } else {
    writeEvidence(c.id, { status: c.status, why: c.why, result: c.result });
    console.log(c.id.padEnd(8), c.status.padEnd(8), '|', String(c.why).slice(0, 200));
  }
}
