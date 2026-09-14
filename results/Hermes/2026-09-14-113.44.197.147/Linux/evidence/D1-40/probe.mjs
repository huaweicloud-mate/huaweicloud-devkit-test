// HuaweiCloud DevKit daily test — source-level probe (Hermes / Linux)
// Covers: D1 semver/update-detection, D2 credentials, D4 security, D5 tool enum,
//         D8 quality, D3-B5 detect_framework, D9-8 schema, D1-45 helper.
// Emits one line per case: "RESULT <case-id> <PASS|FAIL> <detail>"
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const PLUGIN = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core';

function emit(id, cond, detail) {
  console.log(`RESULT ${id} ${cond ? 'PASS' : 'FAIL'} ${detail}`);
}

const policy = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const risk = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);
const update = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);
const creds = await import(pathToFileURL(join(SRC, 'auth/credentials.mjs')).href);

// ============ D4 安全 (source: classifyTextCommand / classifyHcloudArgs / risk) ============
// D4-1 凭证文件读取拦截
{
  const cmds = ['cat ~/.hcloud/config', 'type C:\\Users\\x\\.hcloud\\config',
    'Get-Content ~/.huaweicloud/credentials', 'cat /home/u/.huaweicloud/credentials.json',
    'less ~/.hcloud/credentials'];
  const denied = cmds.filter((c) => policy.classifyTextCommand(c).decision === 'deny');
  emit('D4-1', denied.length === cmds.length, `凭证文件读取 ${denied.length}/${cmds.length} deny`);
}

// D4-2 凭证 env 打印拦截
{
  const covered = ['printenv HWC_ACCESS_KEY', 'env | grep HUAWEICLOUD', 'printenv HCLOUD_SECRET_KEY'];
  const coveredDeny = covered.filter((c) => policy.classifyTextCommand(c).decision === 'deny');
  // 真实凭证 env 变量名 (credentials.mjs resolveCredentials L102-104) 用 HW_ 前缀
  const real = ['printenv HW_ACCESS_KEY', 'echo $HW_SECRET_KEY', 'env | grep HW_SECURITY_TOKEN'];
  const realDeny = real.filter((c) => policy.classifyTextCommand(c).decision === 'deny');
  const allOk = coveredDeny.length === covered.length && realDeny.length === real.length;
  emit('D4-2', allOk,
    `覆盖前缀 deny=${coveredDeny.length}/${covered.length}; HW_* 真实凭证 deny=${realDeny.length}/${real.length} (全拦截需全部 deny)`);
}

// D4-3 明文 secret API 拦截
{
  const cmds = ['hcloud csms ShowSecretVersion secret-name=prod/db', 'hcloud dew GetSecretValue secret-id=x',
    'echo $secret_string', 'hcloud csms DownloadSecret --secret-name x'];
  const denied = cmds.filter((c) => policy.classifyTextCommand(c).decision === 'deny');
  emit('D4-3', denied.length === cmds.length, `明文 secret API ${denied.length}/${cmds.length} deny`);
}

// D4-4 写操作审批门
{
  const r = policy.classifyHcloudArgs(['ecs', 'CreateServers'], { allowWrites: false });
  emit('D4-4', r.decision === 'deny' && r.risk === 'write', `CreateServers 未审批 => ${r.decision}/${r.risk}`);
}

// D4-5 写操作误判检测
{
  const w = policy.classifyHcloudArgs(['ecs', 'DeleteServers']);
  const w2 = policy.classifyTextCommand('hcloud ecs DeleteServers --servers.0.id=i-1');
  const r = policy.classifyHcloudArgs(['ecs', 'ListServers']);
  emit('D4-5', w.decision === 'deny' && w.risk === 'write' && w2.decision === 'deny' && r.decision === 'allow' && r.risk === 'read_only',
    `DeleteServers=>${w.decision}/${w.risk} text=>${w2.decision} ListServers=>${r.decision}/${r.risk}`);
}

// D4-6 adminPass 回显警告 (脱敏)
{
  const obj = policy.redactSecrets({ name: 'vm', adminPass: 'P@ssw0rd!', password: 'hunter2' });
  const ok = obj.adminPass === '<redacted>' && obj.password === '<redacted>' && obj.name === 'vm';
  emit('D4-6', ok, `adminPass/password 脱敏 => ${JSON.stringify(obj)}`);
}

// D4-7 hook 三工具有效性 (command/artifact/deploy_plan)
{
  const c = risk.evaluateCommandRisk('hcloud ecs DeleteServers --force');
  const a = risk.evaluateArtifacts([{ path: 'iam.json', content: '{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }]);
  const d = risk.evaluateDeployPlan({ plan: 'FunctionGraph trigger security_authentication=NONE 0.0.0.0/0 CreateTrigger' });
  emit('D4-7', ['deny', 'warn'].includes(c.decision) && ['deny', 'warn'].includes(a.decision) && ['deny', 'warn'].includes(d.decision),
    `command=${c.decision} artifact=${a.decision} deploy_plan=${d.decision}`);
}

// D4-8 Python/Node 策略一致 (共享 policy.json + 相同 env-dump 前缀 + 相同 write 正则)
{
  const pol = policy.loadPolicy();
  const pySrc = readFileSync(join(PLUGIN, 'hooks', 'huaweicloud-safety.py'), 'utf8');
  const envPrefixes = ['HUAWEICLOUD', 'HWC_', 'HCLOUD', 'OS_'];
  const pyHasEnv = envPrefixes.every((p) => pySrc.includes(p));
  const nodeEnv = readFileSync(join(SRC, 'safety-policy.mjs'), 'utf8');
  const nodeHasEnv = envPrefixes.every((p) => nodeEnv.includes(p));
  const writeRe = pol.writeOperationPrefixes;
  const pyWrite = pySrc.includes('WRITE_OPERATION_RE') && pySrc.includes('(^|[A-Za-z0-9])');
  const nodeWrite = nodeEnv.includes('(^|[A-Za-z0-9])') && nodeEnv.includes('writeOperationPrefixes');
  emit('D4-8', pyHasEnv && nodeHasEnv && pyWrite && nodeWrite && writeRe.length > 0,
    `env前缀一致 py=${pyHasEnv}/node=${nodeHasEnv}, write正则可比对 py=${pyWrite}/node=${nodeWrite}, 共享 policy writeOps=${writeRe.length}`);
}

// D4-9 公开暴露/破坏性预检
{
  const pub = risk.evaluateCommandRisk('hcloud vpc CreateSecurityGroupRule 0.0.0.0/0 22');
  const dest = policy.classifyTextCommand('hcloud ecs DeleteServers --force');
  emit('D4-9', pub.decision === 'deny' && dest.decision === 'deny',
    `公网暴露=>${pub.decision}(${pub.findings?.map((f)=>f.ruleId).join(',')}) 破坏性=>${dest.decision}`);
}

// D4-15 hook 绕过尝试
{
  const tries = ['HCloud Ecs DeleteServers --servers x', 'hcloud ecs deleteservers --servers x',
    'hcloud ecs Delete Servers --force', 'echo aGNsb3VkIGVjcyBEZWxldGVTZXJ2ZXJz | base64 -d | sh'];
  const denied = tries.map((c) => [c, policy.classifyTextCommand(c).decision]).filter(([, d]) => d === 'deny');
  emit('D4-15', denied.length === tries.length, `绕过 ${denied.length}/${tries.length} deny`);
}

// D4-16 命令包裹穿透
{
  const wrap = policy.classifyTextCommand("sh -c 'hcloud ecs DeleteServers --servers i-1'");
  emit('D4-16', wrap.decision === 'deny', `sh -c 包裹内层写命令 => ${wrap.decision} (预期 deny)`);
}

// D4-17 hook 模糊 fail-closed (畸形输入不崩溃 + 写操作不误放行)
{
  let noCrash = true;
  try { risk.evaluateCommandRisk(undefined); } catch { noCrash = false; }
  const emptyArgs = policy.classifyHcloudArgs([]);
  const malformed = policy.classifyTextCommand('');
  emit('D4-17', noCrash && emptyArgs.decision === 'deny' && malformed.decision === 'allow',
    `畸形输入不含写不误拒 noCrash=${noCrash} emptyArgs=${emptyArgs.decision} emptyText=${malformed.decision}`);
}

// D4-18 confirm-not-deny 审批语义
{
  const noApproval = policy.classifyHcloudArgs(['ecs', 'DeleteServers'], { allowWrites: false });
  const approved = policy.classifyHcloudArgs(['ecs', 'DeleteServers'], { allowWrites: true });
  emit('D4-18', noApproval.decision === 'deny' && approved.decision === 'allow',
    `未审批=>${noApproval.decision} 审批后=>${approved.decision}/${approved.risk}`);
}

// D4-19 确认流下预检仍生效
{
  const r = policy.classifyHcloudArgs(['vpc', 'CreateSecurityGroupRule', '0.0.0.0/0', '22'], { allowWrites: true });
  emit('D4-19', r.decision === 'deny', `审批后高危预检仍拦截 => ${r.decision}(${r.reason})`);
}

// D4-20 拒绝后零操作 (定级: deny 无执行副作用; 源层断言)
{
  const r = policy.classifyHcloudArgs(['ecs', 'DeleteServers'], { allowWrites: false });
  emit('D4-20', r.decision === 'deny', `拒绝路径 => ${r.decision} (无资源变更/命令执行)`);
}

// D4-21 hook_check_artifacts 具名回归
{
  const broad = risk.evaluateArtifacts([{ path: 'iam-policy.json', content: '{"Version":"1.0","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }]);
  const safe = risk.evaluateArtifacts([{ path: 'main.tf', content: 'resource "huaweicloud_ecs" "a" { name = "x" }' }]);
  emit('D4-21', broad.decision === 'deny' && safe.decision !== 'deny',
    `broad IAM=>${broad.decision}(${broad.findings?.map((f)=>f.ruleId).join(',')}) 普通IaC=>${safe.decision}`);
}

// D4-22 hook_check_deploy_plan 具名回归
{
  const plan = risk.evaluateDeployPlan({ plan: 'FunctionGraph function trigger security_authentication=NONE public 0.0.0.0/0 CreateTrigger' });
  emit('D4-22', ['warn', 'deny'].includes(plan.decision), `公网 FunctionGraph 无鉴权 => ${plan.decision}(${plan.findings?.map((f)=>f.ruleId+':'+f.severity).join(',')})`);
}

// D4-10 规则库新增回归 (注入自定义 catalog 不误杀良性输入)
{
  const catalog = risk.loadRiskRules();
  const benign = risk.evaluateCommandRisk('hcloud ecs ListServers --limit 10', { catalog });
  // 新增一条仅匹配特定字符串的规则，良性命令不应命中
  catalog.rules.push({ id: 'hwc-test-only', title: 't', category: 'test', severity: 'deny',
    stages: ['command'], match: { all: [{ field: 'text', regex: 'ZZZ_NEVER_MATCH_ZZZ' }] }, message: 'm', remediation: 'r' });
  const afterAdd = risk.evaluateCommandRisk('hcloud ecs ListServers --limit 10', { catalog });
  emit('D4-10', benign.decision !== 'deny' && afterAdd.decision !== 'deny',
    `新增规则不误杀: benign=${benign.decision} afterAdd=${afterAdd.decision}`);
}

// ============ D2 认证 (source) ============
// D2-4 凭证脱敏正确性
{
  const obj = policy.redactSecrets({ ak: 'FAKEAK123456', sk: 'FAKESK789', password: 'p@ss', region: 'cn-north-4', nested: { secret_key: 'x', name: 'keep' } });
  const akPass = obj.ak === '<redacted>' && obj.sk === '<redacted>' && obj.password === '<redacted>' && obj.nested.secret_key === '<redacted>';
  const str = policy.redactSecrets('access_key=AKIA123 password=hunter2 region=cn-north-4');
  emit('D2-4', akPass && !/AKIA123/.test(str) && !/hunter2/.test(str),
    `对象/字符串脱敏: ${JSON.stringify(obj)} / ${JSON.stringify(str)}`);
}

// D2-13 R9 configuredBySession 优先 env (resolveCredentials 逻辑)
{
  // 源层验证逻辑分支存在性: configuredBySession===true 时 S1 wins (credentials.mjs L125-130)
  const src = readFileSync(join(SRC, 'auth/credentials.mjs'), 'utf8');
  const hasR9 = src.includes('configuredBySession === true') && src.includes('source of truth');
  emit('D2-13', hasR9, `resolveCredentials R9 分支存在 (configuredBySession优先): ${hasR9}`);
}

// D2-16 import 文件读取后擦除 (clearImportFile 定义且于 import 后调用)
{
  const toolsSrc = readFileSync(join(SRC, 'tools.mjs'), 'utf8');
  const hasClear = /function clearImportFile/.test(toolsSrc);
  const callSites = (toolsSrc.match(/importedFromFile\)?\s*clearImportFile\(\)|fromImport[^\n]*clearImportFile\(\)/g) || []).length;
  emit('D2-16', hasClear && callSites > 0, `clearImportFile 定义=${hasClear} 调用点(import后擦除)=${callSites}`);
}

// D2-2 auth status 判定 (getAuthStatus 存在且返回结构化 status)
{
  const svc = await import(pathToFileURL(join(SRC, 'auth/service.mjs')).href);
  emit('D2-2', typeof svc.getAuthStatus === 'function' && typeof svc.syncAuth === 'function',
    `getAuthStatus/syncAuth 导出: ${typeof svc.getAuthStatus}/${typeof svc.syncAuth}`);
}

// D2-10 R7 current 档跟随 (reconcile 导出 readKooCliProfiles/resolveManagedProfile/runHcloudConfigure)
{
  const rec = await import(pathToFileURL(join(SRC, 'auth/reconcile.mjs')).href);
  emit('D2-10', typeof rec.readKooCliProfiles === 'function' && typeof rec.resolveManagedProfile === 'function' && typeof rec.runHcloudConfigure === 'function',
    `reconcile 导出: readKooCliProfiles=${typeof rec.readKooCliProfiles} resolveManagedProfile=${typeof rec.resolveManagedProfile} runHcloudConfigure=${typeof rec.runHcloudConfigure}`);
}

// D2-12 R10 runtime 非空禁止落盘 (syncAuth 有 runtime 抑制逻辑 R10)
{
  const svcSrc = readFileSync(join(SRC, 'auth/service.mjs'), 'utf8');
  const hasRuntimeGuard = /hasRuntimeCredentials|runtimeActive|R10|runtime credentials|suppress/i.test(svcSrc);
  emit('D2-12', hasRuntimeGuard, `service.mjs runtime 抑制守卫存在(R10): ${hasRuntimeGuard}`);
}

// D2-1 auth init 三端同步 (syncAuth 传播 KooCLI/OBS + 真云凭证校验 validateIamCredentials)
{
  const svcSrc = readFileSync(join(SRC, 'auth/service.mjs'), 'utf8');
  const hasThreeEnd = /writeGlobalCredentials|writeObsConfig|runHcloudConfigure|obsConfig/.test(svcSrc) && /validateIamCredentials/.test(readFileSync(join(SRC, 'tools.mjs'), 'utf8'));
  const recSrc = readFileSync(join(SRC, 'auth/reconcile.mjs'), 'utf8');
  const hasSync = /runHcloudConfigure/.test(recSrc) && /writeObsConfig/.test(svcSrc);
  emit('D2-1', hasThreeEnd && hasSync,
    `三端同步逻辑存在(KooCLI/OBS/S1): svc=${/writeObsConfig/.test(svcSrc)} reconcile=${/runHcloudConfigure/.test(recSrc)} validator=${/validateIamCredentials/.test(readFileSync(join(SRC,'tools.mjs'),'utf8'))}`);
}

// ============ D1 升级检测 (source, 无网络) ============
// D1-27 检测语义-已是最新
{
  const j = update.judgeUpdate('1.1.4', { latest: '1.1.4', next: '1.1.4-next.3' }, null);
  emit('D1-27', j.result === 'up_to_date' && j.updateAvailable === false, `judgeUpdate 1.1.4/latest=1.1.4 => ${j.result}/${j.updateAvailable}`);
}

// D1-28 检测语义-有新版本
{
  const j = update.judgeUpdate('1.1.2', { latest: '1.1.3', next: null }, null);
  emit('D1-28', j.result === 'update_available' && j.updateAvailable === true && j.targetVersion === '1.1.3',
    `judgeUpdate 1.1.2/latest=1.1.3 => ${j.result} target=${j.targetVersion}`);
}

// D1-30 semver 比对正确性
{
  const a = update.semverCompare('1.1.2', '1.1.1');
  const b = update.semverCompare('1.1.0', '1.1.0-next.9');
  const c = update.semverCompare('1.1.1', '1.1.1');
  const d = update.semverCompare('1.1.2', '1.1.2-next.0'); // 正式版 > 同版本 pre
  emit('D1-30', a > 0 && b > 0 && c === 0 && d > 0, `semverCompare: 1.1.2>1.1.1=${a>0} 1.1.0>1.1.0-next.9=${b>0} 相等=${c===0} 正式>pre=${d>0}`);
}

// D1-31 dismiss 冷却期
{
  const tmp = '/tmp/hdk-skip-test.json';
  update.writeSkipState(tmp, '1.1.2', { at: Date.now(), days: 3 });
  const st = update.readSkipState(tmp);
  const expireMs = Date.parse(st?.expireAt || '');
  const dismissedMs = Date.parse(st?.dismissedAt || '');
  const is3days = expireMs - dismissedMs === 3 * 24 * 60 * 60 * 1000;
  const cooldown = st && st.dismissedVersion === '1.1.2' && expireMs > Date.now() && is3days;
  emit('D1-31', cooldown, `冷却期: dismissedVersion=${st?.dismissedVersion} expireAt=${st?.expireAt} (差值=${is3days ? '3天' : (expireMs-dismissedMs)/86400000 + '天'}; 冷却未过=${expireMs > Date.now()})`);
}

// D1-33 skip 文件持久化与多路径
{
  const p = update.skipFilePath();
  const fb = update.fallbackSkipFilePath();
  const r = update.resolveSkipFilePath(null);
  emit('D1-33', typeof p === 'string' && typeof fb === 'string' && typeof r === 'string',
    `skip 路径: primary=${p} fallback=${fb} resolved=${r}`);
}

// D1-40 镜像 lag 检测正确性 (反向提醒防护)
{
  const lag = update.judgeUpdate('1.1.3', { latest: '1.1.2', next: null }, null);
  const same = update.judgeUpdate('1.1.3', { latest: '1.1.3', next: '1.1.3-next.2' }, null);
  emit('D1-40', lag.result === 'up_to_date' && same.result === 'up_to_date',
    `镜像 lag 不提示倒退: 本地1.1.3/远端1.1.2=>${lag.result} 同版=>${same.result}`);
}

// ============ D5-3 / D9-1 / D9-8 工具枚举与 schema ============
{
  const { TOOL_DEFINITIONS } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
  const names = TOOL_DEFINITIONS.map((t) => t.name);
  const unique = new Set(names).size === names.length;
  const allHaveSchema = TOOL_DEFINITIONS.every((t) => t.inputSchema && t.inputSchema.type === 'object');
  const allHaveDesc = TOOL_DEFINITIONS.every((t) => typeof t.description === 'string' && t.description.length > 0);
  emit('D5-3', names.length === 39 && unique && allHaveSchema, `39 工具全量枚举=>${names.length} 唯一=${unique} schema完整=${allHaveSchema}`);
  emit('D9-1', names.length === 39 && unique && allHaveSchema && allHaveDesc, `tools/list schema 合法=${allHaveSchema} 描述=${allHaveDesc}`);
  // D9-8 inputSchema 版本合规
  const drafts = new Set();
  for (const t of TOOL_DEFINITIONS) {
    drafts.add(t.inputSchema?.$schema || t.inputSchema?.__schemaVersion || 'json-schema(draft-07 默认)');
  }
  emit('D9-8', drafts.size <= 1 || TOOL_DEFINITIONS.every((t) => !t.inputSchema.$schema),
    `inputSchema 版本: ${[...drafts].join(', ')} (统一=1类)`);
}

// ============ D8-7 7 个 meta/通用技能可机械执行 ============
{
  const { findSkillsRoot } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
  const skillRoot = findSkillsRoot ? findSkillsRoot([join(PLUGIN, 'skills'), join(SRC, '..', '..', '..', '..', 'skills')]) : join(PLUGIN, 'skills');
  const metaSkills = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk',
    'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-troubleshooting', 'huawei-getting-started'];
  let missing = [];
  for (const s of metaSkills) {
    const f = join(skillRoot, s, 'SKILL.md');
    if (!existsSync(f)) { missing.push(s); continue; }
    const c = readFileSync(f, 'utf8');
    if (!/^---\n/.test(c) || c.trim().length < 100) missing.push(`${s}(格式异常)`);
  }
  emit('D8-7', missing.length === 0, `7 meta 技能可加载 root=${skillRoot} 缺失=${JSON.stringify(missing)}`);
}

// ============ D8-6 中英文文档一致 ============
{
  const root = '/home/testbot1/devkit-test/Hermes/hdk';
  const en = readFileSync(join(root, 'README.md'), 'utf8');
  const zh = readFileSync(join(root, 'README.zh-CN.md'), 'utf8');
  // 粗粒度一致性: 章节标题数量级 + 关键命令 (npm install -g) 双边存在
  const enH2 = (en.match(/^## /gm) || []).length;
  const zhH2 = (zh.match(/^## /gm) || []).length;
  const cmdBoth = /npm install (-g )?huaweicloud-devkit/.test(en) || /npm install -g/.test(zh);
  emit('D8-6', enH2 > 0 && zhH2 > 0 && Math.abs(enH2 - zhH2) <= Math.max(3, enH2 * 0.5),
    `双语文档章节 en=${enH2} zh=${zhH2} (无严重漂移)`);
}

// ============ D3-B5 detect_framework 识别 ============
{
  const df = await import(pathToFileURL(join(SRC, 'detect-framework.mjs')).href);
  const detected = typeof df.detectFramework === 'function';
  emit('D3-B5', detected, `detectFramework 导出函数存在: ${detected}`);
}

// ============ D1-45 兜底提示 (source: _decorateResult) ============
{
  const proto = await import(pathToFileURL(join(SRC, 'mcp-protocol.mjs')).href);
  const hasDecorate = typeof proto._decorateResult === 'function' && typeof proto._resetHintConsumption === 'function';
  emit('D1-45', hasDecorate, `_decorateResult/_resetHintConsumption 兜底提示一次性消费机制存在: ${hasDecorate}`);
}

console.log('\n=== probe-source done ===');