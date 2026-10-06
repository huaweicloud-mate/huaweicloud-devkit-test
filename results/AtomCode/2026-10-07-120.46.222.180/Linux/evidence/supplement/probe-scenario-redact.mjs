// AtomCode 2026-10-07 场景路由 + 脱敏补充探针（新鲜执行，SUT = hdk gitHead ffd7b47 = v1.1.8-next.1）
// 覆盖：D3-S1..S8 场景路由（设计契约自然语言意图，断言针对 recommendedServices 实际路由结果）、
//       D4-6 adminPass 脱敏、D4-27 小写 ak=/sk= 双路径脱敏、D8-9 sanitizeValue 敏感值脱敏
import { writeFileSync } from 'node:fs';
import { redactSecrets } from 'file:///home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { callTool } from 'file:///home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { sanitizeValue } from 'file:///home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';

const results = {};
let pass = 0, fail = 0;
const ok = (id, desc, cond, detail) => {
  cond ? pass++ : fail++;
  results[id] = { status: cond ? 'PASS' : 'FAIL', desc, detail: detail || '' };
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(cond)}${detail ? ' | ' + detail : ''}`);
};

// 返回 serviceCatalog 实际解析到的服务清单（数组），用于判断路由是否命中（而非回显的 intent 文本）
async function routedServices(intent) {
  try {
    const r = await callTool('huaweicloud_service_catalog', { intent });
    const svcs = Array.isArray(r?.recommendedServices) ? r.recommendedServices.map(String) : [];
    return { svcs, raw: JSON.stringify(r) };
  } catch (e) { return { svcs: [], raw: 'ERR:' + String(e && e.message || e) }; }
}
const isRouted = (svcs) => svcs.length > 0 && !svcs.some((s) => /^Run hcloud --help/i.test(s));

// ===== D3 场景路由（设计契约自然语言意图，断言 recommendedServices 非 Run-hcloud 兜底）=====
const r1 = await routedServices('列出cn-north-4的ECS，只读不改');
ok('D3-S1', '场景-只读查ECS 路由命中 ECS', isRouted(r1.svcs) && /ecs/i.test(r1.svcs.join(' ')), `recommendedServices=${JSON.stringify(r1.svcs)}`);

const r2 = await routedServices('删除测试VPC，先列命令确认');
ok('D3-S2', '场景-删VPC先确认 路由命中 VPC', isRouted(r2.svcs) && /vpc/i.test(r2.svcs.join(' ')), `recommendedServices=${JSON.stringify(r2.svcs)}`);

const r3 = await routedServices('部署当前项目到沙箱给我预览链接');
ok('D3-S3', '场景-沙箱预览出URL 路由命中 Sandbox/DevStation', isRouted(r3.svcs) && /sandbox|devstation/i.test(r3.svcs.join(' ')), `recommendedServices=${JSON.stringify(r3.svcs)}`);

const r4 = await routedServices('查能否领券，能领就领');
ok('D3-S4', '场景-领券闭环 路由命中 Incentive Voucher', isRouted(r4.svcs) && /voucher/i.test(r4.svcs.join(' ')), `recommendedServices=${JSON.stringify(r4.svcs)}`);

const r5 = await routedServices('物联网+时序数据+前端托管');
ok('D3-S5', '场景-复合意图分层路由 命中多服务', isRouted(r5.svcs) && /obs|dds|dms|ces|gauss/i.test(r5.svcs.join(' ')), `recommendedServices=${JSON.stringify(r5.svcs)}`);

const r6 = await routedServices('部署Python函数，每天定时执行');
ok('D3-S6', '场景-FunctionGraph定时 路由命中 FunctionGraph', isRouted(r6.svcs) && /functiongraph/i.test(r6.svcs.join(' ')), `recommendedServices=${JSON.stringify(r6.svcs)}`);

const r7 = await routedServices('部署一个带 MySQL 数据库的 Web 应用');
ok('D3-S7', '场景-跨服务Web+RDS 路由命中 RDS', isRouted(r7.svcs) && /rds/i.test(r7.svcs.join(' ')), `recommendedServices=${JSON.stringify(r7.svcs)}`);

let s8 = '';
try { const r = await callTool('huaweicloud_explain_error', { errorCode: 'APIGW.0301' }); s8 = JSON.stringify(r); }
catch (e) { s8 = 'ERR:' + String(e && e.message || e); }
ok('D3-S8', '场景-排障 explain_error(APIGW.0301) 返回可执行下一步检查建议',
   /APIGW\.0301|权限|认证|IAM|下一步|建议|检查/i.test(s8) && s8.length > 40, s8.slice(0, 160));

// ===== D4-6 adminPass 回显脱敏 =====
const a6 = redactSecrets('hcloud ECS CreateServers --adminPass=MyPass123 --server_id=abc');
ok('D4-6', 'adminPass 值被 <redacted> 替换（源码级直调）',
   /<redacted>/.test(a6) && !/MyPass123/.test(a6), `redactSecrets => ${a6.slice(0, 120)}`);

// ===== D4-27 双路径输出脱敏（小写 ak=/sk= 短形）=====
const r27 = redactSecrets('token=abc123 ak=AKID456 sk=secret789');
ok('D4-27', '小写 ak=/sk= 值被 <redacted> 替换（双路径一致）',
   !/ak=AKID456/.test(r27) && !/sk=secret789/.test(r27) && /<redacted>/.test(r27),
   `redactSecrets => ${r27}`);

// ===== D8-9 sanitizeValue 敏感值脱敏 =====
const v89 = sanitizeValue('AK=ABC123DEF456GHI');
const d89 = /AK=ABC123DEF456GHI/.test(v89) && !/<redacted>/.test(v89);
ok('D8-9', 'sanitizeValue 移除 AK/SK/token 等敏感值（设计契约）」', !d89, `sanitizeValue('AK=ABC123DEF456GHI') => ${JSON.stringify(v89)}`);

writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify({ total: { pass, fail }, results }, null, 2), 'utf8');
console.log(`\nSUMMARY pass=${pass} fail=${fail}`);
process.exit(0);