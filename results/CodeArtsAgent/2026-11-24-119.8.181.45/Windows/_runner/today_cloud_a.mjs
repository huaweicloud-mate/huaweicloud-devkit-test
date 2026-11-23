import { mcpTool, runHcloud, writeEvidence, writeProbe, VC_QUOTE } from './lib.mjs';
const cases = [];
cases.push({ id: 'D3-B3', title: 'run_readonly 脱敏执行', fn: async () => {
  const r = await mcpTool('huaweicloud_run_readonly_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const txt = r.text || '';
  const noLeak = !/AK[A-Z0-9]{16,}|SK[A-Z0-9]{30,}/.test(txt);
  const hasFields = /servers|count/i.test(txt);
  const ok = r.ok && noLeak && hasFields;
  return { status: ok ? 'PASS' : 'FAIL', why: '只读执行成功=' + r.ok + ' 输出无明文AK/SK=' + noLeak + ' 含清单字段=' + hasFields + ' 输出=' + txt.slice(0, 160), result: { text: txt.slice(0, 900) } };
} });
cases.push({ id: 'D3-S1', title: '场景-只读查 ECS', fn: async () => {
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '帮我查一下我的ECS云主机，不要修改任何资源' }, 45000);
  const hit = /ecs/i.test(JSON.stringify(cat.parsed || cat.text || ''));
  const ro = await mcpTool('huaweicloud_run_readonly_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const ok = cat.ok && hit && ro.ok && /servers|count/i.test(ro.text || '');
  return { status: ok ? 'PASS' : 'FAIL', why: '路由命中ECS=' + hit + ' 只读返回清单=' + ro.ok + ' 全程零写调用', result: { catalog: cat.parsed, readonly: (ro.text || '').slice(0, 500) } };
} });
cases.push({ id: 'D3-C7', title: '跨区域资源操作引导', fn: async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-south-1'], allowWrites: false }, 45000);
  const av = await mcpTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-south-1' }, 45000);
  const ro = await mcpTool('huaweicloud_run_readonly_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const cmd = (plan.parsed && plan.parsed.command) || '';
  const ok = cmd.includes('--cli-region') && av.ok && ro.ok;
  return { status: ok ? 'PASS' : 'FAIL', why: 'plan 含 --cli-region=' + cmd.includes('--cli-region') + ' 区域可用性=' + av.ok + ' 只读查询=' + ro.ok, result: { command: cmd, availability: av.parsed, readonly: (ro.text || '').slice(0, 400) } };
} });
cases.push({ id: 'D4-14', title: '操作可审计性', fn: async () => {
  const r = runHcloud(['CTS', 'ListTraces', '--cli-region=cn-north-4', '--limit=10']);
  const traces = (r.parsed && r.parsed.traces) || [];
  const hasTime = traces.length === 0 ? false : traces.every((t) => t.time || t.request_time);
  const ok = r.status === 0 && traces.length > 0 && hasTime;
  return { status: ok ? 'PASS' : 'FAIL', why: 'CTS 查询 rc=' + r.status + ' 轨迹数=' + traces.length + ' 每条含时间=' + hasTime + (r.status !== 0 ? ' 错误=' + ((r.stderr || '') + (r.stdout || '')).slice(0, 200) : ''), result: { count: traces.length, sample: traces.slice(0, 3), raw: (r.stdout || '').slice(0, 400) } };
} });
for (const c of cases) {
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: {} }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch {}
  console.log(c.id.padEnd(8), r.status.padEnd(6), '|', String(r.why || '').slice(0, 220));
}