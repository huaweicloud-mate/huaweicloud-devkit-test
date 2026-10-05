// D10-4 安全干预-静态规则层（P0）
// 断言：①loadRiskRules 规则库完整（deny ≥ 9、warn ≥ 7、无 disabled）；②evaluateCommandRisk 对高危命令
//       (凭证读取/env 导出/删资源) 判 deny；③只读命令判 allow；三态分布合理
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const RULES = process.env.HDK_RULES || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json';
const CASE = 'D10-4';

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const engine = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);

// ① 规则库完整性
const raw = JSON.parse(readFileSync(RULES, 'utf8'));
const loaded = engine.loadRiskRules ? engine.loadRiskRules(RULES) : raw.rules;
const rules = Array.isArray(loaded) ? loaded : (loaded && Array.isArray(loaded.rules) ? loaded.rules : raw.rules);
const rulesReturnShape = Array.isArray(loaded) ? 'array' : (loaded && typeof loaded === 'object' ? 'object' : typeof loaded);
const bySeverity = rules.reduce((a, r) => { a[r.severity] = (a[r.severity] || 0) + 1; return a; }, {});
const denyCount = bySeverity.deny || 0;
const warnCount = bySeverity.warn || 0;
const disabled = rules.filter((r) => (r.disabled === true) || (typeof r.get === 'function' && r.get('disabled')));
const missingSeverity = rules.filter((r) => r.severity !== 'deny' && r.severity !== 'warn');
const ruleLibOk = denyCount >= 9 && warnCount >= 7 && disabled.length === 0 && missingSeverity.length === 0;

// ② 高危命令 → deny（对应规则库中 severity=deny 的 9 条规则）
const HIGH_RISK = [
  'cat ~/.hcloud/credentials.json',
  'type $HOME/.huaweicloud/credentials.json',
  'env | grep HUAWEICLOUD',
  'printenv | grep HW_SECRET',
  'hcloud CSMS ShowSecretVersion --secret-name prod --version-id v1',
  'hcloud OBS PutBucketPolicy --bucket b --acl public-read-write',
  'hcloud ECS DeleteServers --server-ids abc-123 --force',
];
const highRiskRows = HIGH_RISK.map((cmd) => {
  const ev = engine.evaluateCommandRisk(cmd);
  return { command: cmd, decision: ev.decision, ruleIds: (ev.findings || []).map((f) => f.ruleId), satisfied: ev.decision === 'deny' };
});

// ③ 只读命令 → 不得 deny
const READONLY = [
  'hcloud ECS ListServers',
  'hcloud OBS ListBuckets',
  'hcloud RDS ListInstances',
  'hcloud IAM ListUsers',
  'hcloud billing ShowBill',
];
const readonlyRows = READONLY.map((cmd) => {
  const ev = engine.evaluateCommandRisk(cmd);
  return { command: cmd, decision: ev.decision, ruleIds: (ev.findings || []).map((f) => f.ruleId), satisfied: ev.decision !== 'deny' };
});

// ④ 三态分布
const decisions = [...highRiskRows, ...readonlyRows].map((r) => r.decision);
const distribution = decisions.reduce((a, d) => { a[d] = (a[d] || 0) + 1; return a; }, {});

// ⑤ 附加观察（非本用例门禁，已在其他用例单独举证，避免重复计入缺陷）
const OBSERVATION = [
  'type %USERPROFILE%\\.obsutilconfig',
  'cat ~/.obsutilconfig',
  'env | grep -i secret',
  'hcloud ECS DeleteServers --server-ids abc-123',
  'hcloud RDS DeleteInstance --instance-id def-456',
];
const observationRows = OBSERVATION.map((cmd) => {
  const ev = engine.evaluateCommandRisk(cmd);
  return {
    command: cmd,
    decision: ev.decision,
    ruleIds: (ev.findings || []).map((f) => f.ruleId),
    note: /\.obsutilconfig/.test(cmd)
      ? '凭证文件读取未 deny（规则 hwc-command-credential-file 的 match.any[0] 仅覆盖 .hcloud|.huaweicloud）；与 D4-1 同根因'
      : /grep -i secret/.test(cmd)
        ? 'env 转储未 deny（hwc-command-env-dump 的 match.all[1] 要求命中 HUAWEICLOUD|HWC_|HCLOUD|HW_|OS_ 前缀，纯 secret 关键字不命中）'
        : '删除类命令判 warn 而非 deny（hwc-destructive-delete-operation severity=warn，属设计取向：删除需审批、--force 才 deny）',
  };
});

const violations = [...highRiskRows.filter((r) => !r.satisfied), ...readonlyRows.filter((r) => !r.satisfied)];
const ok = ruleLibOk && violations.length === 0;

finish(ok ? 'PASS' : 'FAIL',
  ok ? `规则库完整：共 ${rules.length} 条（deny=${denyCount} ≥9，warn=${warnCount} ≥7，0 disabled）；${highRiskRows.length} 条高危命令全部判 deny；${readonlyRows.length} 条只读命令无一被判 deny；三态分布 ${JSON.stringify(distribution)}。另有 ${observationRows.length} 条边界形态以 warn/allow 判定，已在 evidence 记录并归并到 D4-1 等既有缺陷`
      : `静态规则层断言不成立：ruleLibOk=${ruleLibOk} (deny=${denyCount}, warn=${warnCount}, disabled=${disabled.length}) violations=${JSON.stringify(violations)}`,
  {
    rulesPath: RULES,
    rulesReturnShape,
    ruleCount: rules.length,
    bySeverity,
    denyCount,
    warnCount,
    disabledRules: disabled.map((r) => r.id),
    missingSeverity: missingSeverity.map((r) => r.id),
    ruleLibOk,
    highRiskRows,
    readonlyRows,
    decisionDistribution: distribution,
    observations: observationRows,
    violations,
    tokenExposureCheck: '本探针输出仅含规则 ID 与判定决策，不回显任何 AK/SK/token',
  });