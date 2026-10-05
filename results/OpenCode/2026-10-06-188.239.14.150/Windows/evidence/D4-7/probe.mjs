// D4-7 three hook tools effectiveness (P1)
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HOOKS = process.env.HDK_HOOKS || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/hooks';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const pick = (r) => ({
  decision: r.decision || null,
  blocked: r.blocked === true,
  ruleId: r.ruleId || null,
  findings: (r.findings || []).slice(0, 3),
});
const CASES = [
  { key: 'command', label: 'hook_check_command: 读取 OBS 凭证文件',
    input: { command: 'cat C:\\Users\\Administrator\\.obsutilconfig' },
    expected: 'deny' },
  { key: 'command', label: 'hook_check_command: 读取 KooCLI 配置目录',
    input: { command: 'cat C:\\Users\\Administrator\\.hcloud\\config.json' },
    expected: 'deny' },
  { key: 'artifacts', label: 'hook_check_artifacts: YAML 明文 ak/sk',
    input: { artifacts: [{ path: 'deploy/values.yaml', content: 'huawei:\n  ak: AKPROBEHOOKARTIFACT0001\n  sk: ProbeHookArtifactSecret000000000' }] },
    expected: 'deny' },
  { key: 'artifacts', label: 'hook_check_artifacts: JSON 明文 secretAccessKey',
    input: { artifacts: [{ path: 'deploy/creds.json', content: JSON.stringify({ secretAccessKey: 'ProbeHookArtifactSecret000000000' }) }] },
    expected: 'deny' },
  { key: 'artifacts', label: 'hook_check_artifacts: 明文密码配置文件',
    input: { artifacts: [{ path: 'app/database.properties', content: 'jdbc.url=x\njdbc.password=ProbeHookDbPass000000000' }] },
    expected: 'deny' },
  { key: 'deployPlan', label: 'hook_check_deploy_plan: 公网 0.0.0.0/0 + 管理员权限',
    input: { plan: { intent: 'deploy app', resources: [
      { type: 'ECS', name: 'probe', publicIp: true, securityGroups: [{ name: 'sg', rules: [{ cidr: '0.0.0.0/0', port: '22' }] }] },
      { type: 'IAM', name: 'admin-user', policy: 'SecurityAdministrator' } ] } },
    expected: 'deny' },
];
const rows = [];
for (const c of CASES) {
  const tool = c.key === 'command' ? 'huaweicloud_hook_check_command'
    : c.key === 'artifacts' ? 'huaweicloud_hook_check_artifacts' : 'huaweicloud_hook_check_deploy_plan';
  const res = await callTool(tool, c.input);
  const v = pick(res);
  rows.push({ id: c.label, ok: v.decision === c.expected, actual: { tool, decision: v.decision, ruleId: v.ruleId, findings: v.findings } });
}
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? 'hook 三工具有效性成立：三类高危输入在对应 hook 工具均返回 deny'
      : `hook 三工具拦截断言不成立，${violations.length}/${rows.length} 项被放行。根因：hook_check_command 未拦截云凭证文件读取（与 P0 D4-1 同源，credentialFilePatterns 只覆盖 .hcloud/.huaweicloud，不含 .obsutilconfig）；hook_check_artifacts 对含明文 ak/sk 的 YAML 与 JSON 未产生 deny 结论。违规项：${JSON.stringify(violations.map((v) => v.id))}`,
  { rows, violations, relatedFindings: ['D4-1(凭证文件读取未拦截)', 'D4-2(hook 与 Node 策略不一致)'], probeValues: '高危样本为构造字符串，非真实凭证' });
