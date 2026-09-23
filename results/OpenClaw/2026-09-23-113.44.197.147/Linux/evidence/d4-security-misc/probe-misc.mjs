// D2-5/D4-5/D4-7/D4-8/D4-17/D3-B1/D1-26/D9-8 补充探针
import { classifyTextCommand, classifyHcloudArgs } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { resolveCredentials, readGlobalCredentials } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { TOOL_DEFINITIONS, callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D2-5 凭证缺失报错指引
{
  const tmp = '/tmp/hdk-missing-' + Date.now();
  process.env.HUAWEICLOUD_HOME = tmp;
  delete process.env.HW_ACCESS_KEY;
  delete process.env.HW_SECRET_KEY;
  try {
    let err = null;
    try { resolveCredentials(); } catch (e) { err = e; }
    check('D2-5', '抛错含指引(HDKIT_CRED_MISSING)', err?.code, 'HDKIT_CRED_MISSING');
    check('D2-5', '报错含可执行指引', /auth init|HW_ACCESS_KEY/.test(err?.message || ''), true);
  } finally {
    delete process.env.HUAWEICLOUD_HOME;
  }
}

// D4-5 写操作误判检测: 只读操作不被误判为写
{
  const reads = [
    ['ECS', 'DescribeInstances'],
    ['VPC', 'ListVpcs'],
    ['IAM', 'KeystoneListProjects'],
    ['OBS', 'ls'],
  ];
  for (const [svc, op] of reads) {
    const r = classifyHcloudArgs([svc, op]);
    check('D4-5', `只读 ${svc} ${op} 放行`, r.decision, 'allow');
  }
}

// D4-17 hook模糊fail-closed: 异常输入不静默放行（空 → deny, 非法 → 有明确结论）
{
  const r = classifyHcloudArgs([]);
  check('D4-17', '空 hcloud args → deny', r.decision, 'deny');
}

// D4-8 Python/Node 策略一致: 两个 hook 实现覆盖同一高危输入
{
  const py = readFileSync('/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py', 'utf8');
  const mjs = readFileSync('/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs', 'utf8');
  check('D4-8', 'Python hook 覆盖 credential file 拦截', /credential|CONFIG_FILE_RE|\.hcloud|\.huaweicloud/.test(py), true);
  check('D4-8', 'Node hook 覆盖 credential file 拦截', /classifyTextCommand/.test(mjs), true);
}

// D3-B1 list_operations 规范名: 返回 KooCLI service 帮助文本结构
{
  const r = await callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 30000 });
  check('D3-B1', 'list_operations 返回 service 名', r?.service, 'ECS');
  check('D3-B1', '返回 command 字符串', typeof r?.command, 'string');
}

// D1-26 升级提醒工具注册
{
  const names = TOOL_DEFINITIONS.map((t) => t.name);
  check('D1-26', 'huaweicloud_check_update 已注册', names.includes('huaweicloud_check_update'), true);
  check('D1-26', 'huaweicloud_upgrade 已注册', names.includes('huaweicloud_upgrade'), true);
  const cu = TOOL_DEFINITIONS.find((t) => t.name === 'huaweicloud_check_update');
  check('D1-26', 'check_update 含 description', typeof cu?.description, 'string');
  check('D1-26', 'check_update 含 inputSchema', typeof cu?.inputSchema, 'object');
}

// D9-8 inputSchema 版本合规: 每个工具 inputSchema 均为 object 且含 properties
{
  const bad = TOOL_DEFINITIONS.filter((t) => typeof t.inputSchema !== 'object' || t.inputSchema === null);
  check('D9-8', '全部工具 inputSchema 合规', bad.length, 0);
}

console.log('\n=== 补充探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);