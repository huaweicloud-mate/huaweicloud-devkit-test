// D4-6 adminPass echo protection (P1)
// literal case gate : adminPass=xxx -> <redacted> (function-level direct call)
// realistic CLI form: hcloud ECS CreateServers --adminPass xxx (space-separated flag value)
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

const sp = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const PW = 'ProbeAdminPass-9f3c1d';
const LITERAL = 'adminPass=' + PW;
const SAMPLES = [
  { label: '字面量 adminPass=xxx (用例字面断言形态)', text: LITERAL, literal: true },
  { label: 'hcloud CLI 空格分隔 --adminPass xxx (KooCLI 实际形态)', text: 'hcloud ECS CreateServers --name probe --adminPass ' + PW, literal: false },
  { label: '--password 空格分隔', text: '--password ' + PW, literal: false },
  { label: 'user_data 空格分隔', text: '--user-data ' + PW, literal: false },
  { label: 'JSON 字符串形态', text: JSON.stringify({ adminPass: PW }), literal: false },
];
const redaction = SAMPLES.map((s) => {
  const redacted = sp.redactSecrets(s.text);
  return { label: s.label, redacted, masked: !redacted.includes(PW), placeholder: redacted.includes('<redacted>'), literal: s.literal };
});
// 对象路径（redactSecrets 递归到 key 判断）与字符串路径（redactString 正则）行为对照
const objectPath = sp.redactSecrets({ adminPass: PW, name: 'probe', region: 'cn-north-4' });
const classified = SAMPLES.map((s) => {
  const c = sp.classifyTextCommand(s.text);
  return { label: s.label, decision: c.decision, ruleId: c.ruleId || null };
});
const hookVerdict = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS CreateServers --name probe --adminPass ' + PW });
const hookText = JSON.stringify(hookVerdict);
const hookDecision = hookVerdict.decision || null;

const literalRow = redaction.find((r) => r.literal);
const cliRow = redaction.find((r) => !r.literal && r.label.includes('adminPass'));
const rows = [
  { id: '字面断言 adminPass=xxx 被替换为 <redacted>', ok: literalRow.masked && literalRow.placeholder, actual: literalRow },
  { id: '对象路径 redactSecrets({adminPass}) 被替换为 <redacted>', ok: !JSON.stringify(objectPath).includes(PW), actual: objectPath },
  { id: 'KooCLI 实际形态 --adminPass <value> 不裸回显密码', ok: cliRow.masked, actual: cliRow },
  { id: 'classifyTextCommand 对 adminPass 命令给出非 allow 判定', ok: classified.find((c) => c.label.includes('adminPass')).decision !== 'allow', actual: classified },
  { id: 'hook_check_command 不裸回显密码', ok: !hookText.includes(PW), actual: { decision: hookDecision, masked: !hookText.includes(PW) } },
];
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `adminPass 回显防护成立：字面 adminPass=xxx、对象键 adminPass 及 hook 路径均脱敏为 <redacted>；KooCLI 空格分隔形态亦不裸回显`
      : `adminPass 回显防护断言不成立。根因：safety-policy.mjs 的 redactString() 只处理 'key<:|=><value>' 形态，缺少 CLI 空格分隔 '--adminPass <value>' 的取值规则（--password/--user-data 同样裸回显），因此 KooCLI 实际传参形态会裸回显明文口令。违规项：${JSON.stringify(violations.map((v) => v.id))}`,
  { redaction, objectPath, classified, hookDecision, rows, violations,
    rootCause: 'redactString() 正则要求 key 与 value 之间为 : 或 =，未覆盖 CLI 空格分隔取值（--adminPass xxx）；json 字符串形态仅在走 redactOutput(JSON.parse) 时由对象键路径覆盖',
    realCloudE2E: '未执行真云创建（会产生计费资源）；按用例允许的源码级函数直调方式核验',
    probeValues: '占位密码字符串，非真实凭证' });
