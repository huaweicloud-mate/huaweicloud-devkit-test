// D4-21 hook_check_artifacts 具名回归（P0，代码/IaC/策略制品预检）
// 断言：宽泛 IAM policy JSON 制品被 hook_check_artifacts 判 deny
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-21';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const risk = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const BROAD_IAM = {
  path: 'iam-admin-policy.json',
  content: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }],
  }, null, 2),
};
const BROAD_IAM2 = {
  path: 'policy-with-adminaccess.json',
  content: JSON.stringify({
    Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'], Principal: { AWS: ['arn:huaweicloud:iam::*:root'] } }],
  }),
};
const STAR_ACTION = {
  path: 'inline-policy.yaml',
  content: 'policy:\n  statement:\n    - Effect: Allow\n      Action: "*"\n      Resource: "*"\n',
};
// 对照：最小权限制品不得被误杀
const LEAST_PRIVILEGE = {
  path: 'least-privilege-policy.json',
  content: JSON.stringify({
    Statement: [{ Effect: 'Allow', Action: ['ecs:server:list'], Resource: ['*'] }],
  }),
};

const cases = [
  { name: '宽泛 IAM 策略 JSON(*/*)', artifact: BROAD_IAM, expect: 'deny', gate: true },
  { name: '通配 Principal+IAM JSON', artifact: BROAD_IAM2, expect: 'deny', gate: true },
  { name: '对照:最小权限 JSON 不得误杀', artifact: LEAST_PRIVILEGE, expect: 'not-deny', gate: true },
  { name: '附加观察:YAML 形态 Action: "*"', artifact: STAR_ACTION, expect: 'deny', gate: false },
];

const rows = [];
for (const c of cases) {
  const hook = await tools.callTool('huaweicloud_hook_check_artifacts', { artifacts: [c.artifact] });
  const ev = risk.evaluateArtifacts([c.artifact]);
  rows.push({
    name: c.name,
    gate: c.gate,
    expect: c.expect,
    path: c.artifact.path,
    hookDecision: hook && hook.decision,
    hookOk: hook && hook.ok,
    findings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
    engineDecision: ev.decision,
    satisfied: c.expect === 'deny' ? (hook && hook.decision === 'deny') : (hook && hook.decision !== 'deny'),
  });
}
const violations = rows.filter((r) => r.gate && !r.satisfied);
const observations = rows.filter((r) => !r.gate && !r.satisfied);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `用例断言成立：宽泛 IAM policy JSON 制品被 hook_check_artifacts 判 deny（hwc-iam-admin-policy），最小权限 JSON 对照未被误杀`
      + (observations.length ? `；附加观察：${observations.length} 个非 JSON 形态（YAML Action: "*"）未被拦截，已单独记入 FINDINGS` : '')
      : `hook_check_artifacts 断言不成立：${JSON.stringify(violations)}`,
  { rows, violations, observations,
    extraObservation: observations.length ? [
      '观察项：YAML 形态 policy（Action: "*" / Resource: "*"）hook_check_artifacts 返回 allow。',
      '根因：plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json 规则 hwc-iam-admin-policy 的 match.all[1] 正则 (\\"Action\\"\\s*:\\s*(\\"(\\*|\\*:\\*)\\"|\\[\\s*\\"(\\*|\\*:\\*)\\")|Action\\s*[=:]\\s*(\\*|\\*:\\*)|AdministratorAccess|FullAccess) 中 Action\\s*[=:]\\s*(\\*|\\*:\\*) 要求星号紧跟冒号（可含空白），不接受带引号标量 Action: "*"。',
    ].join('') : null });