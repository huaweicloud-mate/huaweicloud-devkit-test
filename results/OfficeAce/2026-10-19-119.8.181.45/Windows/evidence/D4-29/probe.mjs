// D4-29 分类断言与原始命令分类入口夹具
// classifyRawCommand (tools.mjs) / classifyTextCommand (safety-policy.mjs) / assertAllowed
// classifyHcloudArgs / redactSecrets / loadPolicy
// 异常契约核对：deny → assertAllowed throws Error(.policy) ; allow → assertAllowed returns result
// 用法: node d4-29-classify-assert.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d4-29-classify-assert.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const safety = await import(new URL(`file://${hdkSrc}/safety-policy.mjs`));
const tools = await import(new URL(`file://${hdkSrc}/tools.mjs`));

// ① classifyRawCommand 存在且委托 classifyTextCommand
{
  const r = tools.classifyRawCommand('ls -la');
  const r2 = safety.classifyTextCommand('ls -la');
  rec('D4-29-raw-delegates', 'classifyRawCommand 委托 classifyTextCommand（结果一致）',
      JSON.stringify(r) === JSON.stringify(r2),
      r.decision, r2.decision);
}

// ② allow 分类 → assertAllowed 不抛错，返回 result
{
  const r = safety.classifyTextCommand('echo hello');
  let passed = false;
  let returned = null;
  try {
    returned = safety.assertAllowed(r);
    passed = returned === r;
  } catch {
    passed = false;
  }
  rec('D4-29-allow-no-throw', 'allow 分类 → assertAllowed 不抛错',
      passed && r.decision === 'allow', { decision: r.decision, passed },
      { decision: 'allow', passed: true });
}

// ③ deny 分类 → assertAllowed 抛 Error(.policy)
{
  const r = safety.classifyTextCommand('cat ~/.huaweicloud/credentials.json');
  let threw = false;
  let hasPolicy = false;
  let errMsg = '';
  try {
    safety.assertAllowed(r);
  } catch (e) {
    threw = true;
    hasPolicy = e.policy === r;
    errMsg = e.message;
  }
  rec('D4-29-deny-throws', 'deny 分类 → assertAllowed 抛 Error',
      threw && hasPolicy && r.decision === 'deny',
      { threw, hasPolicy, decision: r.decision },
      { threw: true, hasPolicy: true, decision: 'deny' },
      `err=${errMsg.slice(0, 80)}`);
}

// ④ 凭证文件读取 → deny / risk=credential
{
  const cases = [
    'cat ~/.huaweicloud/credentials.json',
    'cat /root/.huaweicloud/credentials.json',
    'Get-Content ~/.huaweicloud/credentials.json',
  ];
  let allDeny = true;
  for (const cmd of cases) {
    const r = safety.classifyTextCommand(cmd);
    if (r.decision !== 'deny' || r.risk !== 'credential') {
      allDeny = false;
      console.log(`    FAIL: ${cmd} => ${r.decision}/${r.risk}`);
    }
  }
  rec('D4-29-cred-file-deny', '凭证文件读取 → deny/credential', allDeny, allDeny, true);
}

// ⑤ 环境变量 dump → deny
{
  const cases = [
    'env | grep HUAWEICLOUD',
    'printenv HW_ACCESS_KEY',
    'printenv HWC_SECRET_KEY',
    '$HW_SECRET_KEY',
  ];
  let allDeny = true;
  for (const cmd of cases) {
    const r = safety.classifyTextCommand(cmd);
    if (r.decision !== 'deny') {
      allDeny = false;
      console.log(`    FAIL: ${cmd} => ${r.decision}/${r.risk}`);
    }
  }
  rec('D4-29-env-dump-deny', '凭证环境变量 dump → deny', allDeny, allDeny, true);
}

// ⑥ hcloud 只读命令 → allow
{
  const r = safety.classifyTextCommand('hcloud ECS ListServers');
  rec('D4-29-hcloud-read-allow', 'hcloud 只读命令 → allow',
      r.decision === 'allow', r.decision, 'allow',
      `risk=${r.risk}`);
}

// ⑦ hcloud 写操作 → deny（无 approval）
{
  const r = safety.classifyTextCommand('hcloud ECS CreateServers');
  rec('D4-29-hcloud-write-deny', 'hcloud 写操作 → deny（无 approval）',
      r.decision === 'deny', r.decision, 'deny',
      `risk=${r.risk} reason=${r.reason?.slice(0, 60)}`);
}

// ⑧ hcloud 空参数 → deny/invalid
{
  const r = safety.classifyHcloudArgs(['hcloud']);
  rec('D4-29-hcloud-empty-deny', 'hcloud 空参数 → deny/invalid',
      r.decision === 'deny' && r.risk === 'invalid',
      { decision: r.decision, risk: r.risk },
      { decision: 'deny', risk: 'invalid' });
}

// ⑨ hcloud --help / version → allow/local_metadata
{
  const r1 = safety.classifyHcloudArgs(['hcloud', '--help']);
  const r2 = safety.classifyHcloudArgs(['hcloud', 'version']);
  rec('D4-29-hcloud-help-allow', 'hcloud --help/version → allow/local_metadata',
      r1.decision === 'allow' && r2.decision === 'allow',
      { help: r1.decision, version: r2.decision },
      { help: 'allow', version: 'allow' });
}

// ⑩ redactSecrets 脱敏
{
  const input = { access_key: 'AKIDEXAMPLE', secret_key: 'SKEXAMPLE', name: 'test' };
  const redacted = safety.redactSecrets(input);
  rec('D4-29-redact-secrets', 'redactSecrets 脱敏凭证字段',
      redacted.access_key === '<redacted>' && redacted.secret_key === '<redacted>' && redacted.name === 'test',
      { ak: redacted.access_key, sk: redacted.secret_key, name: redacted.name },
      { ak: '<redacted>', sk: '<redacted>', name: 'test' });
}

// ⑪ loadPolicy 返回有效策略对象
{
  const policy = safety.loadPolicy();
  const hasFields = policy && typeof policy === 'object' &&
    Array.isArray(policy.credentialFilePatterns) &&
    Array.isArray(policy.blockedSecretOperations);
  rec('D4-29-load-policy', 'loadPolicy 返回有效策略',
      hasFields, hasFields, true,
      `keys=${Object.keys(policy).slice(0, 6).join(',')}`);
}

// ⑫ 拼接命令中 hcloud 写操作仍 deny（shell operator 分割）
{
  const r = safety.classifyTextCommand('echo ok && hcloud ECS DeleteServers');
  rec('D4-29-concat-write-deny', '拼接命令中 hcloud 写操作 → deny',
      r.decision === 'deny', r.decision, 'deny',
      `risk=${r.risk}`);
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D4-29 分类断言与原始命令分类入口夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D4-29');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D4-29 分类断言与原始命令分类入口夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
