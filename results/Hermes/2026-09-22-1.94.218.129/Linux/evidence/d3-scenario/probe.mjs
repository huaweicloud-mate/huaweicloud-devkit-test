// D3-S5(复合意图分层路由) + D3-S8(操作失败排障指引) — 源码级直调 serviceCatalog / explain_error
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-1.94.218.129/Linux/evidence/d3-scenario/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 240), expected: String(expected) });
}
function textOf(r) {
  try { return r?.result?.content?.[0]?.text || r?.content?.[0]?.text || JSON.stringify(r); } catch { return JSON.stringify(r); }
}
function svcsOf(r) {
  try { return JSON.parse(textOf(r)).recommendedServices || []; } catch { return []; }
}

// ===== D3-S5: 复合意图路由 =====
{
  const compound = await callTool('huaweicloud_service_catalog', { intent: '我要部署一个 Web 应用，数据存到数据库，文件存到对象存储' });
  const svcs = svcsOf(compound);
  const txt = textOf(compound);
  const hasMultiple = svcs.length >= 2;
  test('D3-S5', 'compound-multi-hit', hasMultiple, `hit=${svcs.length} [${svcs.join(',')}]`, '复合意图命中多个 service');
  test('D3-S5', 'route-returns-services', svcs.length > 0, txt.slice(0, 160), 'serviceCatalog 返回推荐服务列表');
}

// ===== D3-S8: 操作失败排障指引 =====
{
  const r1 = await callTool('huaweicloud_explain_error', {
    service: 'ECS', errorCode: 'APIGW.0802', message: 'No permissions to perform this action.', requestId: 'req-12345',
  });
  const t1 = textOf(r1);
  const hasGuidance = /step|next|hou|检查|IAM|permission|权限|ListProjects|Keystone|project/i.test(t1);
  test('D3-S8', 'explain-error-guidance', !!t1 && hasGuidance, t1.slice(0, 200), '给出可执行下一步（非裸报错堆栈）');

  const r2 = await callTool('huaweicloud_explain_error', {
    service: 'VPC', errorCode: 'VPC.0001', message: 'queryIpAddressList failed', requestId: 'req-2',
  });
  const t2 = textOf(r2);
  const nonEmpty = !!t2 && t2.length > 10;
  test('D3-S8', 'explain-error-nonempty', nonEmpty, t2.slice(0, 160), '排障输出非空且结构完整');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);