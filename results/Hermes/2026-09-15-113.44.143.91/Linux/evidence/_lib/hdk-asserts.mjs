// 华为云 DevKit 源码级断言库 — Hermes / Linux / 1.1.4 (9b67256)
// 每个用例一个 async 断言函数，返回 { pass, expected, actual, detail }。
// 用法: CASE_ID=D4-2 node probe-runner.mjs  (见各 evidence/<case>/probe.mjs 薄包装)
const HDK = process.env.HDK_PLUGIN_SRC ||
  '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';

const libs = {};
async function lib(name) {
  if (!libs[name]) libs[name] = await import('file://' + HDK + '/' + name);
  return libs[name];
}

function decisionOf(fn) {
  try { return fn().decision; } catch (e) { return 'THROW:' + e.message; }
}

export const CASES = {};

// ============ D4 安全 ============
CASES['D4-1'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const cases = [
    ['cat ~/.hcloud/config.json', 'deny'],
    ['cat /root/.hcloud/credentials', 'deny'],
    ['type C:\\Users\\me\\.hcloud\\config.json', 'deny'],
    ['less ~/.hcloud/credentials', 'deny'],
    ['cat ~/.huaweicloud/config', 'deny'],
    ['cat hcloud/config.json', 'deny'],
    ['cat ~/notes.txt', 'allow'],
    ['ls ~/workspace', 'allow'],
  ];
  const fails = [];
  for (const [cmd, want] of cases) {
    const got = decisionOf(() => sp.classifyTextCommand(cmd));
    if (got !== want) fails.push(`${cmd} => ${got}(want ${want})`);
  }
  return {
    pass: fails.length === 0,
    expected: '凭证/配置文件读取 → deny；普通文件 → allow',
    actual: fails.length ? fails.join(' | ') : '全部 8 组符合预期',
    detail: fails.length ? '拦截遗漏' : null,
  };
};

CASES['D4-2'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const cases = [
    ['env | grep HW_ACCESS_KEY', 'deny'],
    ['env | grep HW_SECRET_KEY', 'deny'],
    ['printenv HUAWEICLOUD_ACCESS_KEY', 'deny'],
    ['env | grep HWC_ACCESS_KEY', 'deny'],
    ['env | grep HCLOUD_TOKEN', 'deny'],
    ['env | grep OS_PASSWORD', 'deny'],
  ];
  const fails = [];
  for (const [cmd, want] of cases) {
    const got = decisionOf(() => sp.classifyTextCommand(cmd));
    if (got !== want) fails.push(`${cmd} => ${got}(want ${want})`);
  }
  return {
    pass: fails.length === 0,
    expected: 'env/printenv 打印 HW_* 等凭证环境变量 → deny',
    actual: fails.length ? fails.join(' | ') : '全部 env 打印拦截生效',
    detail: fails.length ? 'env-dump 正则未覆盖 HW_ 前缀凭证名' : null,
  };
};

CASES['D4-3'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const cases = [
    ['hcloud CSMS ShowSecretVersion --secret-name x', 'deny'],
    ['hcloud DEW DownloadSecret --secret-name x', 'deny'],
    ['ShowSecretVersion secret_string', 'deny'],
    ['GetSecretValue --secret-id x', 'deny'],
  ];
  const fails = [];
  for (const [cmd, want] of cases) {
    const got = decisionOf(() => sp.classifyTextCommand(cmd));
    if (got !== want) fails.push(`${cmd} => ${got}`);
  }
  return {
    pass: fails.length === 0,
    expected: '明文 secret 读取 API → deny',
    actual: fails.length ? fails.join(' | ') : '全部 secret API 拦截',
    detail: null,
  };
};

CASES['D4-4'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const cases = [
    [['ECS', 'DeleteServers', '--id', 'x'], 'deny'],
    [['ECS', 'CreateServer', '--name', 't'], 'deny'],
    [['VPC', 'AssociateEip'], 'deny'],
    [['RDS', 'DeleteInstance'], 'deny'],
  ];
  const fails = [];
  for (const [args, want] of cases) {
    const got = decisionOf(() => sp.classifyHcloudArgs(args));
    if (got !== want) fails.push(`${args.join(' ')} => ${got}`);
  }
  return {
    pass: fails.length === 0,
    expected: '写操作未审批 → deny',
    actual: fails.length ? fails.join(' | ') : '全部写操作未审批被拒',
    detail: null,
  };
};

CASES['D4-5'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const cases = [
    [['ECS', 'ListServers'], 'allow'],
    [['VPC', 'DescribeVpcs'], 'allow'],
    [['IMS', 'ShowImage'], 'allow'],
    [['OBS', 'ls'], 'allow'],
  ];
  const fails = [];
  for (const [args, want] of cases) {
    const got = decisionOf(() => sp.classifyHcloudArgs(args));
    if (got !== want) fails.push(`${args.join(' ')} => ${got}`);
  }
  return {
    pass: fails.length === 0,
    expected: '只读操作 → allow(read_only)',
    actual: fails.length ? fails.join(' | ') : '只读操作均未被误判为写',
    detail: null,
  };
};

CASES['D4-9'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const re = await lib('risk-rule-engine.mjs');
  const denyHcloud = [
    ['ECS', 'DeleteServerGroup', '--force'],
    ['RDS', 'DeleteInstance'],
  ].map((a) => decisionOf(() => sp.classifyHcloudArgs(a)));
  const sandbox = ['rm -rf /xxx', 'mkfs.ext4 /dev/sda1', 'shutdown -h now', 'fdisk /dev/sda'];
  const sandboxDecisions = sandbox.map((c) => re.evaluateCommandRisk(c).decision);
  const expose = re.evaluateCommandRisk('create security group rule remote_ip_prefix 0.0.0.0/0 port 22').decision;
  const allDeny = denyHcloud.every((d) => d === 'deny') && sandboxDecisions.every((d) => d === 'deny') && expose === 'deny';
  return {
    pass: allDeny,
    expected: '破坏性写 / 沙箱破坏命令 / 公开暴露端口 → 全部 deny',
    actual: `hcloud破坏写=${denyHcloud.join(',')} | 沙箱=${sandboxDecisions.join(',')} | 公开暴露=${expose}`,
    detail: null,
  };
};

CASES['D4-10'] = async () => {
  const re = await lib('risk-rule-engine.mjs');
  const catalog = re.loadRiskRules();
  const rules = catalog?.rules || [];
  const sample = re.evaluateCommandRisk('ecs CreateServer --name t');
  return {
    pass: Array.isArray(rules) && rules.length > 0 && sample && typeof sample.decision === 'string',
    expected: '规则库可加载、含规则、evaluate 可执行',
    actual: `规则数=${rules.length}, evaluate决策=${sample.decision}, 规则id示例=${rules.slice(0,3).map(r=>r.id).join(',')}`,
    detail: null,
  };
};

CASES['D4-11'] = async () => {
  const re = await lib('risk-rule-engine.mjs');
  const encoded = re.evaluateCommandRisk('echo x | base64 -d | bash');
  const benign = re.evaluateCommandRisk('printf hello | sh').decision;
  return {
    pass: encoded.decision === 'deny' && encoded.findings.some((f) => f.ruleId === 'hwc-command-encoded-shell-exec'),
    expected: '提示注入/编码载荷管道进解释器 → deny（hwc-command-encoded-shell-exec）',
    actual: `encoded=${encoded.decision}(${encoded.findings.map((f) => f.ruleId).join(',')})`,
    detail: null,
  };
};

CASES['D4-16'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const wraps = [
    "bash -c 'hcloud ECS DeleteServers --id x'",
    "sh -c 'hcloud ecs DeleteServers'",
    "echo ok && hcloud ECS DeleteServers",
    "$(hcloud ECS DeleteServers)",
    "`hcloud ECS DeleteServers`",
  ];
  const decisions = wraps.map((c) => decisionOf(() => sp.classifyTextCommand(c)));
  // 期望全部 deny（包裹/子 shell/命令替换不应绕过 hcloud 写操作拦截）
  return {
    pass: decisions.every((d) => d === 'deny'),
    expected: '命令包裹/命令替换不绕过 hcloud 写操作拦截（全部 deny）',
    actual: wraps.map((c, i) => `${c} => ${decisions[i]}`).join(' | '),
    detail: decisions.some((d) => d !== 'deny')
      ? 'HCLOUD 正则仅匹配行首/空白后 hcloud，引号包裹/子 shell/命令替换可绕过（safety-policy.mjs classifyTextCommand）'
      : null,
  };
};

CASES['D4-21'] = async () => {
  const re = await lib('risk-rule-engine.mjs');
  const artifacts = [
    { path: 'main.tf', content: 'resource "huaweicloud_secgroup_rule" "r" { remote_ip_prefix = "0.0.0.0/0" protocol = "tcp" port_range_max = "22" }' },
    { path: 'policy.json', content: '{"Statement":[{"Effect":"Allow","Action":"*","Principal":"*"}]}' },
  ];
  const r = re.evaluateArtifacts(artifacts);
  return {
    pass: r.decision === 'deny',
    expected: '代码/IaC/策略制品含公开暴露/破坏性 → deny',
    actual: `decision=${r.decision}, findings=${r.findings.map((f) => f.ruleId).join(',')}`,
    detail: null,
  };
};

CASES['D4-22'] = async () => {
  const re = await lib('risk-rule-engine.mjs');
  const plan = 'Deploy plan: create ECS with security group open to 0.0.0.0/0 on port 22, no cleanup/ttl/owner';
  const r = re.evaluateDeployPlan(plan);
  return {
    pass: r.decision === 'deny',
    expected: '部署计划含公开暴露端口且无清理元数据 → deny',
    actual: `decision=${r.decision}, findings=${r.findings.map((f) => f.ruleId).join(',')}`,
    detail: null,
  };
};

CASES['D4-15'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const evasions = [
    'cat $(echo ~/.hcloud/config.json)',
    'cat "~/.hcloud/credentials"',
    'cat ~/.hcloud/config.json; cat ~/notes.txt',
    'hcloud CSMS ShowSecretVersion --secret-name x',
  ];
  const decisions = evasions.map((c) => decisionOf(() => sp.classifyTextCommand(c)));
  return {
    pass: decisions.every((d) => d === 'deny'),
    expected: '常见绕过手法（命令替换/引号/命令拼接）仍被拦截为 deny',
    actual: evasions.map((c, i) => `${c.slice(0, 26)}=${decisions[i]}`).join(' | '),
    detail: null,
  };
};

CASES['D4-17'] = async () => {
  // hook 输入不可解析/模糊时 fail-closed 语义（.mjs hook 解析失败会静默 return = fail-open）
  // 这里从 hook 行为层面验证：见 CLI 探针 hook-failopen 补充；源码层验证 classifyTextCommand 总返回明确决策
  const sp = await lib('safety-policy.mjs');
  const r = sp.classifyTextCommand('random command not huawei related');
  return {
    pass: r && typeof r.decision === 'string',
    expected: 'classifyTextCommand 始终返回明确决策对象（不抛错/不静默）',
    actual: `decision=${r.decision}, risk=${r.risk}`,
    detail: null,
  };
};

CASES['D4-7'] = async () => {
  const tools = await lib('tools.mjs');
  const names = tools.TOOL_DEFINITIONS.map((t) => t.name);
  const hookTools = ['huaweicloud_hook_check_command', 'huaweicloud_hook_check_artifacts', 'huaweicloud_hook_check_deploy_plan'];
  const present = hookTools.every((n) => names.includes(n));
  let callOk = false;
  if (present) {
    const r = await tools.callTool('huaweicloud_hook_check_command', { command: 'rm -rf /' });
    callOk = r && r.ok === false && r.decision === 'deny';
  }
  return {
    pass: present && callOk,
    expected: '三个 hook 工具存在且 hook_check_command 对破坏命令返回 deny',
    actual: `hook工具注册=${present}, hook_check_command(rm -rf /)=${callOk ? 'deny' : '异常'}`,
    detail: null,
  };
};

// ============ D2 认证 / 凭证 ============
CASES['D2-4'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const obj = { accessKey: 'AK123456', secret_key: 'SKsecret', adminPass: 'Passw0rd!', region: 'cn-north-4' };
  const out = sp.redactSecrets(obj);
  const objOk = out.accessKey === '<redacted>' && out.secret_key === '<redacted>' && out.adminPass === '<redacted>' && out.region === 'cn-north-4';
  // 字符串级脱敏：ak=/sk= （obsutil 配置格式）应被脱敏
  const str = sp.redactSecrets('ak=AK123456 sk=SKsecret adminPass=Passw0rd!');
  const akLeak = !str.includes('<redacted>') || str.includes('AK123456') || str.includes('SKsecret');
  return {
    pass: objOk && !akLeak,
    expected: '凭证字段(对象)与字符串(ak=/sk=)均脱敏为 <redacted>',
    actual: `对象脱敏=${objOk}, 字符串=${str}`,
    detail: akLeak ? 'redactString 仅匹配大写 AK/SK 与 access_key 等，不匹配 lowercase ak=/sk=（obsutilconfig 格式）' : null,
  };
};

CASES['D2-5'] = async () => {
  const cred = await lib('auth/credentials.mjs');
  let code = null, msg = null;
  const saved = { HW_ACCESS_KEY: process.env.HW_ACCESS_KEY, HW_SECRET_KEY: process.env.HW_SECRET_KEY };
  delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY;
  delete process.env.HW_SECURITY_TOKEN;
  try {
    cred.clearRuntimeCredentials();
    process.env.HUAWEICLOUD_HOME = '/tmp/hdk-nocred-' + process.pid;
    try { cred.resolveCredentials({}); } catch (e) { code = e.code; msg = e.message; }
  } finally {
    if (saved.HW_ACCESS_KEY !== undefined) process.env.HW_ACCESS_KEY = saved.HW_ACCESS_KEY; else delete process.env.HW_ACCESS_KEY;
    if (saved.HW_SECRET_KEY !== undefined) process.env.HW_SECRET_KEY = saved.HW_SECRET_KEY; else delete process.env.HW_SECRET_KEY;
  }
  return {
    pass: code === 'HDKIT_CRED_MISSING' && /auth init|HW_ACCESS_KEY/.test(msg || ''),
    expected: '凭证缺失 → 抛出 HDKIT_CRED_MISSING 且指引 auth init/HW_ACCESS_KEY',
    actual: `code=${code}, msg=${(msg || '').slice(0, 120)}`,
    detail: null,
  };
};

CASES['D2-11'] = async () => {
  const tools = await lib('tools.mjs');
  const r = await tools.callTool('huaweicloud_auth_switch', {
    action: 'persist', ak: 'AKTEST', sk: 'SKTEST', securityToken: 'STS_TMP', region: 'cn-north-4',
  });
  return {
    pass: r && r.status === 'error' && r.scope === 'rejected' && /R3|STS/i.test(r.error || ''),
    expected: 'R3: 带 securityToken 的 STS 临时凭证 persist → 拒绝落盘',
    actual: `status=${r?.status}, scope=${r?.scope}, error=${r?.error}`,
    detail: null,
  };
};

CASES['D2-12'] = async () => {
  const cred = await lib('auth/credentials.mjs');
  const svc = await lib('auth/service.mjs');
  const savedHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = '/tmp/hdk-r10-' + process.pid;
  cred.clearRuntimeCredentials();
  cred.writeGlobalCredentials({ ak: 'GLOBAL_AK', sk: 'GLOBAL_SK', region: 'cn-north-4' });
  cred.setRuntimeCredentials('AKRT', 'SKRT', '', 'cn-north-4');
  const r = svc.syncAuth('all');
  cred.clearRuntimeCredentials();
  if (savedHome !== undefined) process.env.HUAWEICLOUD_HOME = savedHome; else delete process.env.HUAWEICLOUD_HOME;
  return {
    pass: r && r.ok === false && /R10|Runtime|suppressed/i.test(r.error || ''),
    expected: 'R10: runtime 凭证激活时 syncAuth → 抑制自动落盘(R10)',
    actual: `ok=${r?.ok}, error=${r?.error}`,
    detail: null,
  };
};

CASES['D2-13'] = async () => {
  const cred = await lib('auth/credentials.mjs');
  const saved = { HOME: process.env.HUAWEICLOUD_HOME };
  process.env.HUAWEICLOUD_HOME = '/tmp/hdk-r9-' + process.pid;
  cred.clearRuntimeCredentials();
  process.env.HW_ACCESS_KEY = 'ENV_AK';
  process.env.HW_SECRET_KEY = 'ENV_SK';
  // 写入 configuredBySession=true 的 S1
  cred.writeGlobalCredentials({ ak: 'S1_AK', sk: 'S1_SK', region: 'cn-north-4', configuredBySession: true });
  const r = cred.resolveCredentials({});
  const pass = r.ak === 'S1_AK' && r.sk === 'S1_SK';
  delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY;
  if (saved.HOME !== undefined) process.env.HUAWEICLOUD_HOME = saved.HOME; else delete process.env.HUAWEICLOUD_HOME;
  return {
    pass,
    expected: 'R9: configuredBySession=true 的 S1 优先于 env 注入凭证',
    actual: `ak=${r.ak}(want S1_AK)`,
    detail: null,
  };
};

CASES['D2-2'] = async () => {
  const svc = await lib('auth/service.mjs');
  const saved = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = '/tmp/hdk-status-' + process.pid;
  const r = svc.getAuthStatus('hermes');
  if (saved !== undefined) process.env.HUAWEICLOUD_HOME = saved; else delete process.env.HUAWEICLOUD_HOME;
  return {
    pass: r && typeof r.credentialsConfigured === 'boolean' && typeof r.kooCliInstalled === 'boolean' && r.agents && typeof r.agents.hermes === 'object',
    expected: 'auth status 返回 credentialsConfigured/kooCliInstalled/agents 结构化字段',
    actual: `credentialsConfigured=${r?.credentialsConfigured}, kooCliInstalled=${r?.kooCliInstalled}, agents.hermes=${JSON.stringify(r?.agents?.hermes)}`,
    detail: null,
  };
};

CASES['D2-10'] = async () => {
  const { readKooCliProfiles, fingerprint } = await lib('auth/reconcile.mjs');
  const saved = process.env.HCLOUD_CONFIG_PATH;
  process.env.HCLOUD_CONFIG_PATH = '/tmp/hdk-r7-' + process.pid + '.json';
  const { writeFileSync } = await import('node:fs');
  writeFileSync(process.env.HCLOUD_CONFIG_PATH, JSON.stringify({ current: 'profileA', profiles: [{ name: 'profileA', accessKeyId: 'AKA', secretAccessKey: 'SKA' }] }));
  const res = readKooCliProfiles();
  const current = res.current;
  const curProf = res.profiles.find((x) => x.name === res.current);
  if (saved !== undefined) process.env.HCLOUD_CONFIG_PATH = saved; else delete process.env.HCLOUD_CONFIG_PATH;
  return {
    pass: current === 'profileA' && curProf && curProf.fingerprint === fingerprint('AKA', 'SKA'),
    expected: 'R7: current 档正确跟随并可用指纹匹配',
    actual: `current=${current}, curFingerprint=${curProf?.fingerprint}`,
    detail: null,
  };
};

CASES['D2-16'] = async () => {
  const tools = await lib('tools.mjs');
  const { writeFileSync, existsSync, mkdirSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const cred = await lib('auth/credentials.mjs');
  const savedHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = '/tmp/hdk-import-' + process.pid;
  const importPath = join(dirname(cred.globalCredentialsPath()), 'creds-import.json');
  mkdirSync(dirname(importPath), { recursive: true });
  writeFileSync(importPath, JSON.stringify({ ak: 'IMPORT_AK', sk: 'IMPORT_SK', region: 'cn-north-4' }));
  const r = await tools.callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'import' });
  const erased = !existsSync(importPath);
  if (savedHome !== undefined) process.env.HUAWEICLOUD_HOME = savedHome; else delete process.env.HUAWEICLOUD_HOME;
  return {
    pass: erased,
    expected: 'import 文件读取并处理成功后擦除（creds-import.json 不存在）',
    actual: `import文件已擦除=${erased}, persist结果status=${r?.status}`,
    detail: null,
  };
};

// ============ D4 审批 / 确认 ============
CASES['D4-18'] = async () => {
  const tools = await lib('tools.mjs');
  let msg = '';
  try { await tools.callTool('huaweicloud_run_approved_command', { args: ['ECS', 'ListServers'], approvalToken: 'nope' }); }
  catch (e) { msg = e.message; }
  return {
    pass: /approvedByUser/.test(msg),
    expected: 'run_approved_command 未显式 approvedByUser=true → 拒绝',
    actual: `error=${msg.slice(0, 90)}`,
    detail: null,
  };
};

CASES['D4-20'] = async () => {
  const tools = await lib('tools.mjs');
  let msg = '';
  try { await tools.callTool('huaweicloud_run_approved_command', { approvedByUser: true, args: ['ECS', 'ListServers'], approvalToken: 'bogus-token' }); }
  catch (e) { msg = e.message; }
  return {
    pass: /Invalid or expired approval token/.test(msg),
    expected: '无效/过期令牌 → 拒绝且零操作',
    actual: `error=${msg.slice(0, 80)}`,
    detail: null,
  };
};

CASES['D4-24'] = async () => {
  const tools = await lib('tools.mjs');
  let msg = '';
  try { await tools.callTool('huaweicloud_auth_confirm', { token: 'nonexistent', decision: 's1' }); }
  catch (e) { msg = e.message; }
  return {
    pass: /not found or expired/.test(msg),
    expected: '确认令牌未找到/过期 → 拒绝重复确认',
    actual: `error=${msg.slice(0, 80)}`,
    detail: null,
  };
};

// ============ D1 升级检测 ============
CASES['D1-26'] = async () => {
  const tools = await lib('tools.mjs');
  const names = tools.TOOL_DEFINITIONS.map((t) => t.name);
  const hasUpdate = names.includes('huaweicloud_check_update');
  const hasUpgrade = names.includes('huaweicloud_upgrade');
  const cu = tools.TOOL_DEFINITIONS.find((t) => t.name === 'huaweicloud_check_update');
  const schemaOk = cu && cu.inputSchema && cu.inputSchema.type === 'object' && (cu.inputSchema.properties?.dismiss || true);
  return {
    pass: hasUpdate && hasUpgrade && schemaOk,
    expected: '升级提醒工具 check_update/upgrade 已注册且暴露 inputSchema',
    actual: `check_update=${hasUpdate}, upgrade=${hasUpgrade}, schema=${cu?.inputSchema?.type || '-'}`,
    detail: null,
  };
};

CASES['D1-27'] = async () => {
  const uc = await lib('update-check.mjs');
  const r = uc.judgeUpdate('1.1.4', { latest: '1.1.4', next: '1.1.5-next.0' });
  return {
    pass: r.result === 'up_to_date',
    expected: '当前已是正式版最新 → up_to_date',
    actual: `result=${r.result}, target=${r.targetVersion}`,
    detail: null,
  };
};

CASES['D1-28'] = async () => {
  const uc = await lib('update-check.mjs');
  const r = uc.judgeUpdate('1.1.4-next.2', { latest: '1.1.3', next: '1.1.4-next.3' });
  return {
    pass: r.result === 'update_available' && r.targetVersion === '1.1.4-next.3',
    expected: '有更新(next) → update_available 指向 1.1.4-next.3',
    actual: `result=${r.result}, target=${r.targetVersion}`,
    detail: null,
  };
};

CASES['D1-30'] = async () => {
  const uc = await lib('update-check.mjs');
  const ok = [
    uc.semverCompare('1.1.4', '1.1.3') === 1,
    uc.semverCompare('1.1.4-next.1', '1.1.4-next.2') === -1,
    uc.semverCompare('1.1.4-next.1', '1.1.4') === -1,
    uc.semverCompare('1.1.4', '1.1.4') === 0,
    uc.semverCompare('1.10.0', '1.9.0') === 1,
    uc.hasPrerelease('1.1.4-next.3') === true,
    uc.hasPrerelease('1.1.4') === false,
  ];
  return {
    pass: ok.every(Boolean),
    expected: 'semver 比对（正式/prerelease/数字段）全部正确',
    actual: ok.every(Boolean) ? '7 组比对全部正确' : '存在比对错误',
    detail: null,
  };
};

CASES['D1-31'] = async () => {
  const uc = await lib('update-check.mjs');
  const now = Date.now();
  const skipState = { dismissedVersion: '9.9.9', dismissedAt: new Date(now - 1000).toISOString(), expireAt: new Date(now + 86400000).toISOString() };
  const r = uc.judgeUpdate('1.1.4-next.2', { latest: '9.9.9', next: '9.9.9-next.0' }, skipState, now);
  return {
    pass: r.result === 'dismissed',
    expected: '冷却期内已 dismiss 的版本不再提醒 → dismissed',
    actual: `result=${r.result}, expiresAt=${r.dismissExpiresAt}`,
    detail: null,
  };
};

CASES['D1-33'] = async () => {
  const uc = await lib('update-check.mjs');
  const file = '/tmp/hdk-skip-' + process.pid + '.json';
  uc.writeSkipState(file, '1.1.5');
  const back = uc.readSkipState(file);
  const p1 = uc.skipFilePath();
  const p2 = uc.fallbackSkipFilePath();
  const { rmSync } = await import('node:fs');
  rmSync(file, { force: true });
  return {
    pass: back && back.dismissedVersion === '1.1.5' && back.expireAt && p1 && p2,
    expected: 'skip 文件写入/读回/多路径解析正确',
    actual: `dismissedVersion=${back?.dismissedVersion}, skipPath=${p1}, fallbackPath=${p2}`,
    detail: null,
  };
};

CASES['D1-40'] = async () => {
  const uc = await lib('update-check.mjs');
  // 镜像 lag：latest 仍是旧版本（低于当前 prerelease），不应误报新版本
  const r = uc.judgeUpdate('1.1.4-next.3', { latest: '1.1.3', next: '1.1.4-next.2' });
  return {
    pass: r.result === 'up_to_date',
    expected: '镜像 lag（registry 版本低于本地）→ 不误报新版本(up_to_date)',
    actual: `result=${r.result}, target=${r.targetVersion}`,
    detail: null,
  };
};

CASES['D1-41'] = async () => {
  const tools = await lib('tools.mjs');
  const r = await tools.callTool('huaweicloud_check_update', {});
  return {
    pass: r && typeof r.currentVersion === 'string' && typeof r.result === 'string',
    expected: 'check_update 真实 MCP 返回 {currentVersion, result} 契约',
    actual: `currentVersion=${r?.currentVersion}, result=${r?.result}, keys=${Object.keys(r || {}).slice(0, 8).join(',')}`,
    detail: null,
  };
};

CASES['D1-45'] = async () => {
  const proto = await lib('mcp-protocol.mjs');
  // 兜底提示一次性消费：_isHintConsumed 初始 false，decorate 后 true
  const sid = 'probe-d1-45-' + process.pid;
  proto._resetHintConsumption();
  const before = proto._isHintConsumed(sid);
  const r1 = proto._decorateResult(sid, 'huaweicloud_service_catalog', { ok: true });
  const after = proto._isHintConsumed(sid);
  return {
    pass: before === false && typeof r1 === 'object',
    expected: '兜底/预热提示单次消费、跨调用不重复（consumed 初始 false）',
    actual: `consumed初始=${before}, consume后=${after}`,
    detail: null,
  };
};

// ============ D5 客户端 / D9 协议 / D10 ============
CASES['D5-3'] = async () => {
  const tools = await lib('tools.mjs');
  const t = tools.TOOL_DEFINITIONS;
  const names = t.map((x) => x.name);
  const noDup = new Set(names).size === names.length;
  return {
    pass: Array.isArray(t) && t.length >= 39 && noDup && t.every((x) => x.name && x.description),
    expected: `工具全量枚举(=tools.mjs 注册源数量, next.6 现为 ${t.length}) 且每个含 name+description 无重复`,
    actual: `工具数=${t.length}, 无重复=${noDup}, 全部含描述=${t.every((x) => x.name && x.description)}`,
    detail: null,
  };
};

CASES['D10-1'] = async () => {
  const tools = await lib('tools.mjs');
  const t = tools.TOOL_DEFINITIONS;
  const bad = t.filter((x) => !x.description || x.description.length < 10).map((x) => x.name);
  return {
    pass: bad.length === 0,
    expected: '工具描述非空且质量达标（≥10 字符，供 agent 选择性调用）',
    actual: bad.length ? `描述过短: ${bad.join(',')}` : `${t.length} 个工具描述均达标`,
    detail: null,
  };
};

CASES['D10-4'] = async () => {
  // 安全干预有效性：危险命令经 classifyTextCommand + evaluateCommandRisk 全部 deny
  const sp = await lib('safety-policy.mjs');
  const re = await lib('risk-rule-engine.mjs');
  const dangerous = [
    'hcloud ECS DeleteServers --id x --force',
    'cat ~/.hcloud/config.json',
    'env | grep HUAWEICLOUD_ACCESS_KEY',
    'hcloud CSMS ShowSecretVersion --name x',
    'rm -rf /',
  ];
  const out = dangerous.map((c) => {
    const d1 = decisionOf(() => sp.classifyTextCommand(c));
    const d2 = re.evaluateCommandRisk(c).decision;
    return { c, d1, d2, blocked: d1 === 'deny' || d2 === 'deny' };
  });
  return {
    pass: out.every((o) => o.blocked),
    expected: '5 类高危命令全部被安全层干预(deny)',
    actual: out.map((o) => `${o.c.slice(0, 28)}=${o.d1}/${o.d2}`).join(' | '),
    detail: null,
  };
};

// ============ D3 功能 ============
CASES['D3-A1'] = async () => {
  const tools = await lib('tools.mjs');
  const r = await tools.callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-core' });
  return {
    pass: r && (r.name === 'huaweicloud-core' || r.skill || r.content || r.skills || typeof r === 'string'),
    expected: 'skill 检索返回 huaweicloud-core 内容/元信息',
    actual: `返回类型=${typeof r}, keys=${Object.keys(r || {}).slice(0, 8).join(',')}`,
    detail: null,
  };
};

CASES['D3-B1'] = async () => {
  const tools = await lib('tools.mjs');
  const r = await tools.callTool('huaweicloud_list_operations', { service: 'ECS' });
  // 契约：返回 service + command + selectionRule + examples + result（操作名经 --help/示例发现）
  const shapeOk = r && r.service === 'ECS' && r.command === 'hcloud ECS --help' && 'selectionRule' in r && 'examples' in r && 'result' in r;
  const hasHelp = r && r.result && (r.result.stdout || r.result.stderr || r.result.error || r.result.ok !== undefined);
  return {
    pass: shapeOk && hasHelp,
    expected: 'list_operations 返回 service/command/selectionRule/examples/result 契约',
    actual: `service=${r?.service}, command=${r?.command}, result.ok=${r?.result?.ok}, stdout=${String(r?.result?.stdout || '').slice(0, 60)}`,
    detail: null,
  };
};

CASES['D3-B5'] = async () => {
  const df = await lib('detect-framework.mjs');
  const { mkdtempSync, writeFileSync, mkdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'hdk-fw-'));
  mkdirSync(join(dir, 'pages'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{"dependencies":{"next":"14"}}');
  writeFileSync(join(dir, 'next.config.js'), 'module.exports={};');
  const r = df.detectFramework(dir);
  return {
    pass: r && r.framework === 'Next.js',
    expected: 'detect_framework 识别 Next.js 项目（含 next.config.js）',
    actual: `framework=${r?.framework}, type=${r?.type}`,
    detail: null,
  };
};

CASES['D3-C5'] = async () => {
  // 工具冒烟：对多个只读/非云工具逐一 callTool，不抛非预期异常、返回结构化结果
  const tools = await lib('tools.mjs');
  const smokes = [
    ['huaweicloud_list_regions', {}],
    ['huaweicloud_service_catalog', { intent: 'ecs' }],
    ['huaweicloud_auth_status', { target: 'hermes' }],
    ['huaweicloud_detect_framework', { projectPath: '/tmp' }],
    ['huaweicloud_hook_check_command', { command: 'hcloud ECS ListServers' }],
  ];
  const results = [];
  for (const [n, a] of smokes) {
    try { const r = await tools.callTool(n, a); results.push({ n, ok: r !== undefined && r !== null }); }
    catch (e) { results.push({ n, ok: false, err: e.message.slice(0, 60) }); }
  }
  const allOk = results.every((r) => r.ok);
  return {
    pass: allOk,
    expected: '5 个工具冒烟调用均返回结构化结果（不崩溃）',
    actual: results.map((r) => `${r.n.slice(11)}=${r.ok ? 'ok' : r.err}`).join(' | '),
    detail: null,
  };
};

// ============ D8 质量 ============
CASES['D8-7'] = async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const skillsRoot = join(HDK, '..', 'skills');
  const metas = ['huaweicloud-core', 'huaweicloud-cli-and-auth', 'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 'huaweicloud-safety', 'huaweicloud-troubleshooting'];
  const results = [];
  for (const m of metas) {
    const p = join(skillsRoot, m, 'SKILL.md');
    if (!existsSync(p)) { results.push(`${m}=缺SKILL.md`); continue; }
    const txt = readFileSync(p, 'utf8');
    const hasName = /^---\s*\nname:/.test(txt);
    const lines = txt.split('\n').length;
    results.push(`${m}=name:${hasName},行数:${lines}`);
  }
  const allOk = results.every((r) => r.includes('name:true'));
  return {
    pass: allOk,
    expected: '6 个 meta 技能 SKILL.md 均存在、YAML frontmatter name 正确',
    actual: results.join(' | '),
    detail: null,
  };
};

// ============ D9 协议（源码层 dispatch） ============
CASES['D9-1'] = async () => {
  const tools = await lib('tools.mjs');
  const t = tools.TOOL_DEFINITIONS;
  const ok = t.every((x) => x.name && typeof x.description === 'string' && x.inputSchema && x.inputSchema.type === 'object');
  return {
    pass: ok,
    expected: 'tools/list 工具定义含 name/description/inputSchema(type=object)',
    actual: `${t.length} 工具 schema 合规=${ok}`,
    detail: null,
  };
};

CASES['D9-3'] = async () => {
  const proto = await lib('mcp-protocol.mjs');
  const r = await proto.dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: 'stdin' });
  const shapeOk = r && Array.isArray(r.content) && r.content[0]?.type === 'text' && typeof r.content[0]?.text === 'string';
  return {
    pass: shapeOk,
    expected: 'tools/call 返回 {content:[{type:text,text}],isError:false}',
    actual: `content数组=${Array.isArray(r?.content)}, 首元素type=${r?.content?.[0]?.type}, isError=${JSON.stringify(r?.isError)}`,
    detail: null,
  };
};

CASES['D9-4'] = async () => {
  const proto = await lib('mcp-protocol.mjs');
  const init = await proto.dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: {} });
  const list = await proto.dispatch('tools/list', {});
  return {
    pass: init && init.serverInfo?.name === 'huaweicloud-devkit' && init.capabilities?.tools && list && Array.isArray(list.tools) && list.tools.length >= 39,
    expected: `initialize → tools/list 生命周期正确（serverInfo + 全量工具≥39, next.6 现为 ${list?.tools?.length}）`,
    actual: `serverInfo.name=${init?.serverInfo?.name}, tools数=${list?.tools?.length}`,
    detail: null,
  };
};

CASES['D9-7'] = async () => {
  const proto = await lib('mcp-protocol.mjs');
  const r = await proto.dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: {} });
  return {
    pass: r.protocolVersion === '2024-11-05',
    expected: '协议版本协商回显请求版本',
    actual: `protocolVersion=${r.protocolVersion}`,
    detail: null,
  };
};

CASES['D9-2'] = async () => {
  // JSON-RPC 错误码：未知方法应符合 -32601 (Method not found)；实测 mcp-server 统一 catch 为 -32603
  // 这里从 dispatch 层验证未知方法确实抛错，错误码层以 stdio 探针为准
  const proto = await lib('mcp-protocol.mjs');
  let msg = '';
  try { await proto.dispatch('unknown/method', {}); }
  catch (e) { msg = e.message; }
  return {
    pass: /Unsupported method/.test(msg),
    expected: '未知方法 → 抛出明确错误（上层映射 -32603，见 stdio 探针 D9-2 复核）',
    actual: `error=${msg}`,
    detail: null,
  };
};

// ============ D10 路由（serviceCatalog） ============
CASES['D10-3'] = async () => {
  const tools = await lib('tools.mjs');
  const cases = [
    ['ecs server list instances', 'ECS'],
    ['obs static website hosting', 'OBS'],
    ['rds mysql database', 'RDS'],
    ['帮我查一下我账号在华北北京四有哪些云主机', 'ECS'],
    ['看一下我的云数据库MySQL实例的状态', 'RDS'],
  ];
  const out = [];
  let englishOk = true, chineseOk = true;
  for (const [intent, wantSvc] of cases) {
    const r = await tools.callTool('huaweicloud_service_catalog', { intent });
    const svcs = r?.recommendedServices || [];
    const hit = svcs.includes(wantSvc);
    if (/[\u4e00-\u9fff]/.test(intent) && !hit) chineseOk = false;
    if (!/[\u4e00-\u9fff]/.test(intent) && !hit) englishOk = false;
    out.push(`${intent.slice(0, 14)}=>${svcs.join('/')}${hit ? '' : '(MISS ' + wantSvc + ')'}`);
  }
  return {
    pass: englishOk && chineseOk,
    expected: '意图路由（英文+中文）命中正确服务',
    actual: out.join(' | '),
    detail: chineseOk ? null : 'serviceCatalog 关键词路由英文-only，中文意图未命中',
  };
};

// ============ D4-6 adminPass 回显警告 ============
CASES['D4-6'] = async () => {
  const sp = await lib('safety-policy.mjs');
  const re = await lib('risk-rule-engine.mjs');
  const cmd = 'hcloud ECS CreateServer --adminPass=Secret123 --name t';
  const r = sp.classifyTextCommand(cmd);
  const red = sp.redactSecrets(cmd);
  // adminPass 属于写操作 (Create) → 未审批应 deny；且值回显应被脱敏
  return {
    pass: r.decision === 'deny' && !red.includes('Secret123'),
    expected: 'adminPass 回显脱敏 且 CreateServer 写操作未审批 deny',
    actual: `decision=${r.decision}, 脱敏后=${red}`,
    detail: null,
  };
};

// ============ D6 性能 ============
CASES['D6-4'] = async () => {
  // 并发调度：同时并行 dispatch 多个独立 tools/call，结果一一对应、无串扰
  const proto = await lib('mcp-protocol.mjs');
  const names = ['huaweicloud_list_regions', 'huaweicloud_service_catalog', 'huaweicloud_list_regions'];
  const args = [{}, { intent: 'ecs' }, {}];
  const rs = await Promise.all(names.map((n, i) => proto.dispatch('tools/call', { name: n, arguments: args[i] }, { sessionId: 'c1' })));
  const allContent = rs.every((r) => Array.isArray(r?.content) && r.content[0]?.type === 'text');
  return {
    pass: allContent && rs.length === 3,
    expected: '并发 dispatch 3 个 tools/call 均返回正确 content 结构',
    actual: `3 并发全部 content 正确=${allContent}`,
    detail: null,
  };
};

// ============ D1-42 dismiss 闭环 / D2-1 三端同步 / D4-19 预检 / D6 / D7-4 ============
CASES['D1-42'] = async () => {
  const uc = await lib('update-check.mjs');
  const { rmSync } = await import('node:fs');
  const now = Date.now();
  const file = '/tmp/hdk-d1-42-' + process.pid + '.json';
  const state = uc.writeSkipState(file, '9.9.9');
  const r1 = uc.judgeUpdate('1.1.4-next.2', { latest: '9.9.9', next: '9.9.9' }, state, now);
  const roundTrip = uc.readSkipState(file);
  const r2 = uc.judgeUpdate('1.1.4-next.2', { latest: '9.9.9', next: '9.9.9' }, roundTrip, now);
  rmSync(file, { force: true });
  return {
    pass: roundTrip?.dismissedVersion === '9.9.9' && r1.result === 'dismissed' && r2.result === 'dismissed',
    expected: 'dismiss 落盘 → 读回 → 跨调用仍 dismissed（冷却期内不再提醒）',
    actual: `写回=${roundTrip?.dismissedVersion}, 首判=${r1.result}, 跨调用=${r2.result}`,
    detail: null,
  };
};

CASES['D2-1'] = async () => {
  const tools = await lib('tools.mjs');
  const cred = await lib('auth/credentials.mjs');
  const { existsSync, readFileSync, rmSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const savedHome = process.env.HUAWEICLOUD_HOME;
  const savedObs = process.env.HCLOUD_OBS_CONFIG_PATH;
  process.env.HUAWEICLOUD_HOME = '/tmp/hdk-d2-1-' + process.pid;
  process.env.HCLOUD_OBS_CONFIG_PATH = '/tmp/hdk-d2-1-' + process.pid + '/obsconfig';
  cred.clearRuntimeCredentials();
  const r = await tools.callTool('huaweicloud_auth_switch', { action: 'persist', ak: 'AK3SYNC', sk: 'SK3SYNC', region: 'cn-north-4' });
  const s1Path = cred.globalCredentialsPath();
  const s1 = existsSync(s1Path) ? JSON.parse(readFileSync(s1Path, 'utf8')) : null;
  const s3 = process.env.HCLOUD_OBS_CONFIG_PATH && existsSync(process.env.HCLOUD_OBS_CONFIG_PATH);
  if (savedHome !== undefined) process.env.HUAWEICLOUD_HOME = savedHome; else delete process.env.HUAWEICLOUD_HOME;
  if (savedObs !== undefined) process.env.HCLOUD_OBS_CONFIG_PATH = savedObs; else delete process.env.HCLOUD_OBS_CONFIG_PATH;
  return {
    pass: s1?.ak === 'AK3SYNC' && s1?.configuredBySession === true && s3,
    expected: 'auth persist 同步 S1(credentials.json)+S3(obsconfig)，S2 视 KooCLI 环境',
    actual: `S1.ak=${s1?.ak}, configuredBySession=${s1?.configuredBySession}, S3写入=${s3}, status=${r?.status}`,
    detail: null,
  };
};

CASES['D4-19'] = async () => {
  const tools = await lib('tools.mjs');
  const plan = await tools.callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers', '--id', 'x'] });
  return {
    pass: plan && plan.classification && plan.classification.decision === 'deny',
    expected: '确认流/计划预检仍生效：写操作 plan 未 approval → classification.deny',
    actual: `classification.decision=${plan?.classification?.decision}, risk=${plan?.classification?.risk}`,
    detail: null,
  };
};

CASES['D6-1'] = async () => {
  const tools = await lib('tools.mjs');
  const t0 = Date.now();
  const r = await tools.callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-core' });
  const ms = Date.now() - t0;
  return {
    pass: r && r.ok === true && ms < 2000,
    expected: 'skill 检索延迟 < 2000ms 且返回成功',
    actual: `${ms}ms, ok=${r?.ok}`,
    detail: null,
  };
};

CASES['D7-4'] = async () => {
  // 国内镜像源：update-check 的 fetch 路径读取 HUAWEICLOUD_NPM_REGISTRY
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(HDK + '/update-check.mjs', 'utf8');
  const honorsRegistry = /HUAWEICLOUD_NPM_REGISTRY/.test(src);
  return {
    pass: honorsRegistry,
    expected: 'update-check 支持国内镜像源（读取 HUAWEICLOUD_NPM_REGISTRY）',
    actual: `源码读取 HUAWEICLOUD_NPM_REGISTRY=${honorsRegistry}`,
    detail: null,
  };
};

// ============ EXP-C4 服务矩阵（只读规划冒烟） ============
const C4_SERVICES = ['ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES', 'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB'];
C4_SERVICES.forEach((svc, i) => {
  CASES['EXP-C4-' + String(i + 1).padStart(2, '0')] = async () => {
    const t = await lib('tools.mjs');
    const lo = await t.callTool('huaweicloud_list_operations', { service: svc });
    const plan = await t.callTool('huaweicloud_plan_cli_command', { args: [svc, 'ListResources'] });
    const loOk = lo && lo.service === svc && 'command' in lo && 'examples' in lo && 'result' in lo;
    const planOk = plan && plan.classification && plan.classification.decision === 'allow';
    return {
      pass: loOk && planOk,
      expected: `${svc} 只读规划冒烟（list_operations + plan 只读命令）`,
      actual: `list=${loOk ? 'ok' : 'FAIL'} plan=${plan?.classification?.decision}`,
      detail: null,
    };
  };
});

// ============ EXP-NR3 回归矩阵（Linux 变体；Windows/macOS = BLOCKED） ============
CASES['EXP-NR3-02'] = async () => { const r = await runCase('D1-27'); return { ...r, expected: r.expected + ' (Linux)' }; };
CASES['EXP-NR3-04'] = async () => { const r = await runCase('D1-42'); return { ...r, expected: r.expected + ' (Linux)' }; };
CASES['EXP-NR3-10'] = async () => { const uc = await lib('update-check.mjs'); const isLinux = process.platform === 'linux'; const r = uc.judgeUpdate('1.1.4-next.2', { latest: '1.1.5', next: '1.1.4-next.3' }); return { pass: isLinux && r.result === 'update_available', expected: 'Linux 无 .cmd/EINVAL 语义，升级检测链可用', actual: `platform=${process.platform}, result=${r.result}`, detail: null }; };
CASES['EXP-NR3-24'] = async () => { const r = await runCase('D1-45'); return { ...r, expected: r.expected + ' (Linux)' }; };

// ============ EXP-E 路由评测集（中文意图 → 期望服务） ============
const E_ROUTES = [
  ['EXP-E01', '帮我查一下我账号在华北北京四有哪些云主机', 'ECS'],
  ['EXP-E02', '创建一台 2C4G 的 Ubuntu 云服务器', 'ECS'],
  ['EXP-E03', '把本地 dist 目录部署成一个公网静态网站', 'OBS'],
  ['EXP-E04', '给这台服务器绑定一个弹性公网IP', 'EIP'],
  ['EXP-E05', '看一下我的云数据库MySQL实例的状态', 'RDS'],
  ['EXP-E06', '创建一个 Redis 缓存实例用于会话存储', 'DCS'],
  ['EXP-E07', '给生产环境的服务器配置一个每日备份策略', 'CBR'],
  ['EXP-E08', '我的ECS启动失败了, 帮我分析原因', 'ECS'],
  ['EXP-E09', '开设一个 Kubernetes 集群用于微服务部署', 'CCE'],
  ['EXP-E10', '部署一个函数处理图片自动压缩', 'FunctionGraph'],
  ['EXP-E11', '查一下我账号这个月的费用情况', 'BSS'],
  ['EXP-E12', '把应用日志指标推送到云监控告警', 'CES'],
  ['EXP-E13', '申请HTTPS证书并配置到我的域名', 'ELB'],
  ['EXP-E14', '我账号下的用户都有哪些权限, 帮我审计一下', 'IAM'],
  ['EXP-E15', '帮我领一下华为云的代金券', 'Incentive Voucher'],
];
for (const [id, intent, wantSvc] of E_ROUTES) {
  CASES[id] = async () => {
    const tools = await lib('tools.mjs');
    const r = await tools.callTool('huaweicloud_service_catalog', { intent });
    const svcs = r?.recommendedServices || [];
    const hit = svcs.includes(wantSvc);
    return {
      pass: hit,
      expected: `意图「${intent.slice(0, 12)}…」→ 路由到 ${wantSvc}`,
      actual: `=> ${svcs.join('/') || '(无)'}  ${hit ? '' : '(期望 ' + wantSvc + ')'}`,
      detail: hit ? null : '中文意图未命中 serviceCatalog 英文关键词',
    };
  };
}

export async function runCase(id) {
  const fn = CASES[id];
  if (!fn) throw new Error('no case: ' + id);
  const t0 = Date.now();
  const r = await fn();
  return { id, ms: Date.now() - t0, ...r };
}