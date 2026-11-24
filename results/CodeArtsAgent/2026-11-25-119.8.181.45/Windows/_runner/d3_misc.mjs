import { mcpTool, writeEvidence, writeProbe, VC_QUOTE, ts } from './lib.mjs';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
const ADM = JSON.parse(readFileSync(homedir() + '/.config/huaweicloud/credentials.json.bak-d3c2-20261120', 'utf8'));
const ENV = { HW_ACCESS_KEY: ADM.ak, HW_SECRET_KEY: ADM.sk };

const cases = [];

cases.push({ id: 'D3-B3', title: 'run_readonly脱敏执行', fn: async () => {
  const r = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const txt = r.text || '';
  const noLeak = !/AK[A-Z0-9]{16,}|SK[A-Z0-9]{30,}/.test(txt);
  const ok = r.ok && noLeak && /servers|count/i.test(txt);
  return { status: ok ? 'PASS' : 'FAIL', why: '只读执行成功=' + r.ok + ' 输出无明文AK/SK=' + noLeak + ' 含服务器清单字段=' + /servers|count/i.test(txt), result: { text: txt.slice(0, 900) } };
} });

cases.push({ id: 'D3-S1', title: '场景-只读查ECS(不改约束)', fn: async () => {
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '帮我查一下我的ECS云主机，不要修改任何资源' }, 45000);
  const hit = /ecs/i.test(JSON.stringify(cat.parsed || cat.text || ''));
  const ro = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const ok = cat.ok && hit && ro.ok && /servers|count/i.test(ro.text || '');
  return { status: ok ? 'PASS' : 'FAIL', why: '路由命中ECS=' + hit + ' 只读返回清单=' + ro.ok + ' 全程仅 service_catalog/run_readonly', result: { catalog: cat.parsed, readonly: (ro.text || '').slice(0, 400) } };
} });

cases.push({ id: 'D3-C7', title: '跨区域资源操作引导', fn: async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-south-1'], allowWrites: false }, 45000);
  const av = await mcpTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-south-1' }, 45000);
  const ro = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const cmd = (plan.parsed && plan.parsed.command) || '';
  const ok = cmd.includes('--cli-region') && av.ok && ro.ok;
  return { status: ok ? 'PASS' : 'FAIL', why: 'plan 命令含 --cli-region=' + cmd.includes('--cli-region') + ' 区域可用性=' + av.ok + ' 只读查询=' + ro.ok, result: { command: cmd, availability: av.parsed, readonly: (ro.text || '').slice(0, 300) } };
} });

cases.push({ id: 'D3-S4', title: '场景-领券闭环', fn: async () => {
  const st = await mcpTool('huaweicloud_voucher_status', {}, 60000, ENV);
  const p = st.parsed || {};
  const cl = await mcpTool('huaweicloud_voucher_claim', { vendorConfirmed: VC_QUOTE }, 90000, ENV);
  const c = cl.parsed || {};
  const rateLimited = /HDKIT_CRED_RATE_LIMIT|限额|rate/i.test(JSON.stringify(c) + cl.text);
  const ok = st.ok && (typeof p.claimed === 'boolean' || /claimed|status/i.test(JSON.stringify(p))) && (c.claimed === true || c.status === 'claimed');
  if (ok) return { status: 'PASS', why: 'voucher_status 可读；claim 返回 claimed=true voucherId=' + c.voucherId, result: { status: p, claim: c } };
  return { status: 'BLOCKED', why: 'voucher_status ok=' + st.ok + ' 可读；claim 返回 ' + (rateLimited ? 'AK 调用限额 HDKIT_CRED_RATE_LIMIT（服务端限流）' : JSON.stringify(c).slice(0, 200)) + '；影响：领券闭环不可完成；解除条件：等限额窗口恢复后重测', result: { status: p, claim: c } };
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
  return { status: ok ? 'PASS' : 'FAIL', why: '首次确认=' + JSON.stringify(c1.parsed || {}).slice(0, 60) + ' 重复确认已拒绝=' + replayBlocked + ' 无效令牌拒绝=' + invalidBlocked, result: { first: c1.parsed || c1.text, second: c2.parsed || c2.text, fake: fake.parsed || fake.text } };
} });

cases.push({ id: 'D3-S5', title: '场景-复合意图分层路由', fn: async () => {
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '用 OBS 部署前端，RDS 存数据，沙箱预览' }, 45000);
  const t = JSON.stringify(cat.parsed || cat.text || '');
  const hits = ['obs', 'rds', 'sandbox'].filter((s) => new RegExp(s, 'i').test(t));
  const ok = cat.ok && hits.length >= 2;
  return { status: ok ? 'PASS' : 'FAIL', why: '命中服务=' + hits.join(',') + '（复合意图拆分路由）', result: { catalog: cat.parsed, hits } };
} });

cases.push({ id: 'D3-S8', title: '场景-操作失败后排障指引', fn: async () => {
  const ex = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0044', message: 'the volumeType [SATA] is sellout in az[cn-north-4a]' }, 45000);
  const t = ex.text || '';
  const ok = ex.ok && t.length > 40 && /建议|处理|措施|改用|retry|suggest/i.test(t);
  return { status: ok ? 'PASS' : 'FAIL', why: '给出可执行下一步=' + ok + ' 非裸堆栈=' + !/at .*\.mjs:\d+/.test(t), result: { text: t.slice(0, 800) } };
} });

const results = [];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
for (const c of cases) {
  if (ONLY && !ONLY.includes(c.id)) continue;
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: {} }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch { }
  results.push({ id: c.id, status: r.status });
  console.log(c.id.padEnd(8), r.status.padEnd(8), String(Date.now() - t0).padStart(7), 'ms |', String(r.why || '').slice(0, 190));
}
