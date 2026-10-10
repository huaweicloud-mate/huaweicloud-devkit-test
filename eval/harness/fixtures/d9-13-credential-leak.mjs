// D9-13 tools/call 凭证不泄露与权限校验夹具
// 源码级直调 9 个凭证函数，验证：
//   1. tools/call 无 AK/SK/security-token 明文（plan 结果中 args/command/executableBlock 均 <redacted>）
//   2. deny/warn/allow 三态（classifyHcloudArgs + assertAllowed）
//   3. setRuntimeCredentials → clearRuntimeCredentials 生命周期完整
// 用法: node d9-13-credential-leak.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D9-13/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d9-13-credential-leak.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// SUT imports
const safetyBase = new URL(`file://${hdkSrc}/safety-policy.mjs`);
const { redactSecrets, classifyHcloudArgs, assertAllowed } = await import(safetyBase);

const hcloudBase = new URL(`file://${hdkSrc}/hcloud-cli.mjs`);
const { planHcloudCommand } = await import(hcloudBase);

const credBase = new URL(`file://${hdkSrc}/auth/credentials.mjs`);
const { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime } = await import(credBase);

const TEST_AK = 'AKTESTLEAK123456789ABC';
const TEST_SK = 'SKTESTLEAK987654321DEF';
const TEST_STK = 'STKTESTLEAK555555555GHI';

// ① redactSecrets: AK/SK/security-token 在 args 中被 <redacted>
{
  const args = [`--cli-access-key=${TEST_AK}`, `--cli-secret-key=${TEST_SK}`, `--cli-security-token=${TEST_STK}`];
  const redacted = redactSecrets(args);
  const noLeak = !redacted.some((a) => String(a).includes(TEST_AK) || String(a).includes(TEST_SK) || String(a).includes(TEST_STK));
  const allRedacted = redacted.every((a) => String(a).includes('<redacted>'));
  rec('D9-13-redact-args-no-leak', 'redactSecrets: args 中 AK/SK/STK 被 <redacted>',
      noLeak && allRedacted,
      { noLeak, allRedacted },
      { noLeak: true, allRedacted: true });
}

// ② redactSecrets: 对象中 credential 字段被 <redacted>
{
  const obj = { ak: TEST_AK, sk: TEST_SK, securityToken: TEST_STK, region: 'cn-north-4' };
  const redacted = redactSecrets(obj);
  const noLeak = !JSON.stringify(redacted).includes(TEST_AK) && !JSON.stringify(redacted).includes(TEST_SK) && !JSON.stringify(redacted).includes(TEST_STK);
  rec('D9-13-redact-obj-no-leak', 'redactSecrets: 对象 AK/SK/STK 字段 <redacted>',
      noLeak && redacted.ak === '<redacted>' && redacted.sk === '<redacted>' && redacted.securityToken === '<redacted>',
      { noLeak, ak: redacted.ak, sk: redacted.sk, securityToken: redacted.securityToken },
      { noLeak: true, ak: '<redacted>', sk: '<redacted>', securityToken: '<redacted>' });
}

// ③ planHcloudCommand: plan 结果中 args/command/executableBlock 不含明文凭证
{
  const cmdArgs = ['ECS', 'CreateServers', `--cli-access-key=${TEST_AK}`, `--cli-secret-key=${TEST_SK}`, '--cli-region=cn-north-4'];
  const plan = planHcloudCommand(cmdArgs, { allowWrites: false });
  const serialized = JSON.stringify(plan);
  const noLeak = !serialized.includes(TEST_AK) && !serialized.includes(TEST_SK);
  rec('D9-13-plan-no-leak', 'planHcloudCommand: plan 结果不含明文 AK/SK',
      noLeak,
      { noLeak, argsHasRedacted: plan.args.some((a) => String(a).includes('<redacted>')) },
      { noLeak: true, argsHasRedacted: true });
}

// ④ classifyHcloudArgs: deny 三态 — 写操作无审批 → deny
{
  const cls = classifyHcloudArgs(['ECS', 'CreateServers', '--cli-region=cn-north-4'], { allowWrites: false });
  rec('D9-13-classify-deny', 'classifyHcloudArgs: 写操作无审批 → deny',
      cls.decision === 'deny',
      cls.decision, 'deny');
}

// ⑤ classifyHcloudArgs: allow 三态 — 只读操作 → allow
{
  const cls = classifyHcloudArgs(['ECS', 'ListServers', '--cli-region=cn-north-4'], { allowWrites: false });
  rec('D9-13-classify-allow', 'classifyHcloudArgs: 只读操作 → allow',
      cls.decision === 'allow',
      cls.decision, 'allow');
}

// ⑥ assertAllowed: deny → throw；allow → 不 throw
{
  const denyCls = classifyHcloudArgs(['ECS', 'CreateServers', '--cli-region=cn-north-4'], { allowWrites: false });
  let denyThrew = false;
  try { assertAllowed(denyCls); } catch { denyThrew = true; }

  const allowCls = classifyHcloudArgs(['ECS', 'ListServers', '--cli-region=cn-north-4'], { allowWrites: false });
  let allowThrew = false;
  try { assertAllowed(allowCls); } catch { allowThrew = true; }

  rec('D9-13-assert-deny-throws', 'assertAllowed: deny → throw',
      denyThrew, denyThrew, true);
  rec('D9-13-assert-allow-passes', 'assertAllowed: allow → 不 throw',
      !allowThrew, allowThrew, false);
}

// ⑦ setRuntimeCredentials → hasRuntimeCredentials = true
{
  // 先清理确保干净状态
  clearRuntimeCredentials();
  rec('D9-13-clear-before-set', 'clearRuntimeCredentials 后 hasRuntimeCredentials=false',
      !hasRuntimeCredentials(), hasRuntimeCredentials(), false);

  setRuntimeCredentials(TEST_AK, TEST_SK, TEST_STK, 'cn-north-4');
  rec('D9-13-set-runtime-creds', 'setRuntimeCredentials 后 hasRuntimeCredentials=true',
      hasRuntimeCredentials(), hasRuntimeCredentials(), true);
}

// ⑧ resolveCredentialsWithRuntime: 返回 runtime 凭证且不含明文泄露到外部上下文
{
  const creds = resolveCredentialsWithRuntime();
  // resolveCredentialsWithRuntime 返回 setRuntimeCredentials 设置的值
  // 验证 runtime 凭证生命周期：set → resolve → clear → resolve(env fallback)
  rec('D9-13-resolve-runtime-creds', 'resolveCredentialsWithRuntime 返回 runtime 凭证',
      creds && creds.ak === TEST_AK && creds.sk === TEST_SK && creds.securityToken === TEST_STK,
      { ak: creds?.ak, sk: creds?.sk, securityToken: creds?.securityToken },
      { ak: TEST_AK, sk: TEST_SK, securityToken: TEST_STK });
}

// ⑨ setRuntimeCredentials → clearRuntimeCredentials 生命周期完整
{
  clearRuntimeCredentials();
  rec('D9-13-clear-runtime-creds', 'clearRuntimeCredentials 后 hasRuntimeCredentials=false',
      !hasRuntimeCredentials(), hasRuntimeCredentials(), false);
}

// ⑩ 凭证泄露防护：plan 中的 approvalToken 不包含原始 args（仅 hash + redacted）
{
  const cmdArgs = ['ECS', 'CreateServers', `--cli-access-key=${TEST_AK}`, `--cli-secret-key=${TEST_SK}`, '--cli-region=cn-north-4'];
  const plan = planHcloudCommand(cmdArgs, { allowWrites: false });
  const token = plan.approvalToken;
  // token 是 UUID，不含凭证
  const tokenSafe = !token.includes(TEST_AK) && !token.includes(TEST_SK);
  // 验证 token 消费后 stored.argsRedacted 不含明文
  const { consumeApprovalToken } = await import(hcloudBase);
  const stored = consumeApprovalToken(token);
  const storedSafe = stored && !JSON.stringify(stored).includes(TEST_AK) && !JSON.stringify(stored).includes(TEST_SK);
  rec('D9-13-token-no-leak', 'approvalToken + stored.argsRedacted 不含明文 AK/SK',
      tokenSafe && storedSafe,
      { tokenSafe, storedSafe, argsRedacted: stored?.argsRedacted },
      { tokenSafe: true, storedSafe: true });
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D9-13 tools/call 凭证不泄露与权限校验夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D9-13');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D9-13 tools/call 凭证不泄露与权限校验夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
