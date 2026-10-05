// D4-8 Python/Node policy parity (P1)
import { spawnSync } from 'node:child_process';
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

const PY_HOOK = join(HOOKS, 'huaweicloud-safety.py');
const sp = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const SAMPLES = [
  { label: '读取 .obsutilconfig 凭证文件', command: 'cat C:\\Users\\Administrator\\.obsutilconfig' },
  { label: '读取 .hcloud 配置目录', command: 'cat C:\\Users\\Administrator\\.hcloud\\config.json' },
  { label: '打印凭证环境变量', command: 'echo $HW_SECRET_KEY' },
  { label: 'hcloud 空格分隔写操作(hcloud ECS DeleteServers --servers x)', command: 'hcloud ECS DeleteServers --servers probe-id' },
  { label: 'hcloud 前缀粘连写操作(hcloud ECSxDeleteServers)', command: 'hcloud ECSxDeleteServers' },
  { label: 'shell 包装写操作(bash -c "hcloud ECS DeleteServers")', command: 'bash -c \'hcloud ECS DeleteServers --servers probe-id\'' },
  { label: '只读调用', command: 'huaweicloud_run_readonly_command ECS ListServersDetails' },
];
// Python hook 的 deny 形态：stdout 输出 hookSpecificOutput JSON，permissionDecision='deny'，进程退出码仍为 0
function pythonVerdict(s) {
  const payload = JSON.stringify({ tool_name: 'Bash', tool_input: { command: s.command } });
  const r = spawnSync('python', [PY_HOOK], { input: payload, encoding: 'utf8', timeout: 60000, windowsHide: true });
  const out = String(r.stdout || '');
  const errOut = String(r.stderr || '');
  let decision = 'allow';
  let reason = '';
  try {
    const parsed = JSON.parse(out.trim());
    const hso = parsed.hookSpecificOutput || {};
    decision = hso.permissionDecision || (parsed.permissionDecision) || 'allow';
    reason = String(hso.permissionDecisionReason || parsed.permissionDecisionReason || '').slice(0, 180);
  } catch {
    decision = out.trim() === '' && r.status === 0 ? 'allow' : 'unknown';
    reason = (out + errOut).slice(0, 180);
  }
  return { exit: r.status, decision, denied: decision === 'deny', reason };
}
const rows = [];
for (const s of SAMPLES) {
  const py = pythonVerdict(s);
  const nd = sp.classifyTextCommand(s.command);
  const nodeDeny = nd.decision !== 'allow';
  rows.push({
    id: '双路径判定一致: ' + s.label,
    ok: py.denied === nodeDeny,
    actual: { python: py, node: { decision: nd.decision, ruleId: nd.ruleId || null } },
  });
}
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `Python hook 与 Node MCP 策略判定一致：${rows.length} 个高危样本双路径 allow/deny 结论全部相同`
      : `Python/Node 策略一致性断言不成立，${violations.length}/${rows.length} 项不一致。根因：hooks/huaweicloud-safety.py 的 WRITE_OPERATION_RE 为 r"(^|[A-Za-z0-9])(<前缀>)\w*"，要求写操作前缀紧邻行首或字母数字，而 KooCLI 实际形态 'hcloud <Service> <Operation>' 中 Operation 前是空格，正则不匹配，导致 Python hook 放行未审批写操作（Node 侧 classifyTextCommand 判 deny）。违规项：${JSON.stringify(violations.map((v) => v.id))}`,
  { pyHook: PY_HOOK, samples: SAMPLES, rows, violations });
