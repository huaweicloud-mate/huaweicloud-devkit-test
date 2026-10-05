// D4-27 dual-path output redaction (P1)
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
const cli = await import(pathToFileURL(join(SRC, 'hcloud-cli.mjs')).href);
const AK = 'AKIAPROBED4D27OUTPUT00001';
const SK = 'ProbeD27CliOutputSecretKey0000000000';
const TOKEN = 'ProbeD27SecurityToken000000000000';
const PW = 'ProbeD27AdminPass00000000000';
const NL = String.fromCharCode(10);
const MULTILINE = [
  'server: probe-b',
  'ak=' + AK,
  'sk=' + SK,
  'securityToken=' + TOKEN,
  'adminPass=' + PW,
  'password: ' + PW,
  'region: cn-north-4',
  'flavor: t6.smallest',
].join(NL);
const UPPER = ['AK=' + AK, 'SK=' + SK].join(NL);
const JSON_TEXT = JSON.stringify({ ak: AK, secretKey: SK, securityToken: TOKEN, adminPass: PW, region: 'cn-north-4' }, null, 2);
const viaSecrets = sp.redactSecrets(MULTILINE);
const viaOutput = cli.redactOutput(MULTILINE);
const upperSecrets = sp.redactSecrets(UPPER);
const jsonViaOutput = cli.redactOutput(JSON_TEXT);
const SECRETS = [AK, SK, TOKEN, PW];
const leakedSecrets = SECRETS.filter((v) => viaSecrets.includes(v));
const leakedOutput = SECRETS.filter((v) => viaOutput.includes(v));
const leakedJson = SECRETS.filter((v) => jsonViaOutput.includes(v));
const leakedUpper = [AK, SK].filter((v) => upperSecrets.includes(v));
const keepLines = ['server: probe-b', 'region: cn-north-4', 'flavor: t6.smallest'];
const keptSecrets = keepLines.filter((l) => viaSecrets.includes(l));
const keptOutput = keepLines.filter((l) => viaOutput.includes(l));
const rows = [
  { id: 'redactSecrets 文本路径脱敏全部明文凭证', ok: leakedSecrets.length === 0, actual: { leakedSecrets } },
  { id: 'redactOutput 文本路径脱敏全部明文凭证', ok: leakedOutput.length === 0, actual: { leakedOutput } },
  { id: 'redactOutput JSON 路径脱敏全部明文凭证', ok: leakedJson.length === 0, actual: { leakedJson } },
  { id: '大写 AK=/SK= 形态被脱敏(定位大小写敏感缺陷)', ok: leakedUpper.length === 0, actual: { leakedUpper } },
  { id: 'redactSecrets 未误伤非敏感字段', ok: keptSecrets.length === keepLines.length, actual: { kept: keptSecrets } },
  { id: 'redactOutput 未误伤非敏感字段', ok: keptOutput.length === keepLines.length, actual: { kept: keptOutput } },
];
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? '双路径输出一致脱敏：redactSecrets 与 redactOutput 对 AK/SK/securityToken/adminPass/password 五类明文凭证均替换为占位符，且非敏感字段全部保留'
      : `双路径脱敏断言不成立，${violations.length}/${rows.length} 项违规：${JSON.stringify(violations.map((v) => v.id))}。根因：safety-policy.mjs redactString() 的 /(AK|SK)\s*[:=]\s*(...)/g 未加 re.I 标志，小写 'ak=' / 'sk='（OBS .obsutilconfig 与 KooCLI configure show 的实际键名形态）不被脱敏，明文 AK/SK 原样出现在输出；securityToken/adminPass/password 形态正常`,
  { inputLines: MULTILINE.split(NL), redactSecretsOutput: viaSecrets, redactOutputOutput: viaOutput, upperCaseOutput: upperSecrets, jsonOutput: jsonViaOutput, rows, violations, probeValues: '占位凭证字符串，非真实凭证' });
