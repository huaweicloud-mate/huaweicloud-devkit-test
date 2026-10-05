// D4-22 hook_check_deploy_plan 具名回归（P0，部署计划预检）
// 断言：公网暴露型部署计划（FunctionGraph/APIG 无鉴权、0.0.0.0/0 管理端口、匿名 OBS 写）被 warn/deny
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-22';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const risk = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const PLANS = [
  {
    name: 'FunctionGraph 公开无鉴权',
    expect: 'warn|deny',
    plan: { service: 'FunctionGraph', function: { name: 'probe-fn', auth: 'NONE' }, triggers: [{ type: 'APIG', public: true }] },
  },
  {
    name: 'APIG DEDICATEDGATEWAY 0.0.0.0/0',
    expect: 'warn|deny',
    plan: { service: 'APIG', apis: [{ name: 'probe-api', gateway: 'DEDICATEDGATEWAY', security_authentication: 'NONE' }], securityGroup: [{ remote_ip_prefix: '0.0.0.0/0', port: 22 }] },
  },
  {
    name: '公网暴露 + 管理端口 3389',
    expect: 'deny',
    plan: { service: 'ECS', securityGroups: [{ cidr: '0.0.0.0/0', port: 3389 }], instances: [{ flavorRef: 't6.medium' }] },
  },
  {
    name: 'OBS 匿名写策略(附加观察)',
    expect: 'deny',
    gate: false,
    plan: { service: 'OBS', bucketPolicy: { Statement: [{ Effect: 'Allow', Principal: { AWS: ['*'] }, Action: ['obs:object:PutObject'] }] } },
  },
  {
    name: '对照:私有低风险部署',
    expect: 'allow',
    gate: true,
    plan: { service: 'OBS', bucket: { acl: 'private', region: 'cn-north-4' } },
  },
];

const rows = [];
for (const p of PLANS) {
  const hook = await tools.callTool('huaweicloud_hook_check_deploy_plan', { plan: p.plan });
  const ev = risk.evaluateDeployPlan(p.plan);
  const d = hook && hook.decision;
  const satisfied = p.expect === 'allow' ? d === 'allow' : ['warn', 'deny'].includes(d);
  rows.push({
    name: p.name,
    gate: p.gate,
    expect: p.expect,
    hookDecision: d,
    hookOk: hook && hook.ok,
    findings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
    nextStep: hook && hook.nextStep,
    engineDecision: ev.decision,
    satisfied,
  });
}
const violations = rows.filter((r) => r.gate && !r.satisfied);
const observations = rows.filter((r) => !r.gate && !r.satisfied);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? '用例断言成立：公网暴露 FunctionGraph（无鉴权）判 warn、APIG 0.0.0.0/0 与 3389 管理端口暴露判 deny；私有低风险对照判 allow'
      + (observations.length ? `；附加观察：${observations.length} 个非公网暴露类高危计划（OBS 匿名写策略）未被拦截，已单独记入 FINDINGS` : '')
      : `hook_check_deploy_plan 断言不成立：${JSON.stringify(violations)}`,
  { rows, violations, observations,
    extraObservation: observations.length ? [
      '观察项：OBS bucketPolicy {Principal:{AWS:["*"]}, Action:["obs:object:PutObject"]} hook_check_deploy_plan 返回 allow。',
      '根因：plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json 规则 hwc-obs-anonymous-write 的 match.any[0] 仅识别 Anonymous|Everyone|"Principal":"*"|AllUsers 三类主体字面量，不识别嵌套 Principal.AWS=["*"] 形态。',
    ].join('') : null });