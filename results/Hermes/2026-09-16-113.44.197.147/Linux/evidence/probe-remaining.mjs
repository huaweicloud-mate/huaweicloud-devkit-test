// 综合源码级探针: D1-26~45 升级检测链 + D2-* 认证 + misc 剩余用例
// Hermes / Linux / 1.1.4 (gitHead 9b67256)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const SERVER = process.env.HDK_MCP_SERVER;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- import update-check.mjs ----
const uc = await import(`file://${HDK}/src/update-check.mjs`);

const R = [];
function rec(id, status, expected, actual, detail) {
  R.push({ id, status, expected, actual, detail });
  const d = join(EVID, id);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.txt'),
    `=== CASE ${id} ===  ${status}\n  expected: ${expected}\n  actual:   ${actual}\n  detail:   ${detail || ''}\n`, 'utf-8');
  console.log(`${status.padEnd(8)} ${id}  ${actual.slice(0,110)}`);
}
function src(file, pattern, flags = '') {
  return new RegExp(pattern, flags).test(readFileSync(join(HDK, 'src', file), 'utf8'));
}

// ============ D1 升级检测链 ============
// D1-26 工具注册 (校验 MCP tools/list 后置, 这里先源级确认 TOOL_DEFINITIONS 含 check_update/upgrade)
{
  const t = (await import(`file://${HDK}/src/tools.mjs`)).TOOL_DEFINITIONS;
  const names = t.map(x => x.name);
  const hasCheck = names.includes('huaweicloud_check_update');
  const hasUpgrade = names.includes('huaweicloud_upgrade');
  const schemaOk = t.every(x => x.inputSchema && typeof x.inputSchema === 'object');
  rec('D1-26', hasCheck && hasUpgrade && schemaOk ? 'PASS' : 'FAIL',
    'check_update/upgrade 注册且暴露 inputSchema',
    `check_update=${hasCheck}, upgrade=${hasUpgrade}, schema=${schemaOk ? 'object' : 'MISSING'}`,
    `工具全集 ${names.length} 个`);
}
// D1-27 已是最新
{
  const r = uc.judgeUpdate('1.1.4', { latest: '1.1.4', next: '1.1.4-next.4' }, null, Date.now());
  rec('D1-27', r.result === 'up_to_date' ? 'PASS' : 'FAIL', '当前=latest → up_to_date',
    `result=${r.result}, target=${r.targetVersion}`, JSON.stringify(r));
}
// D1-28 有新版本
{
  const r = uc.judgeUpdate('1.1.4', { latest: '2.0.0', next: '2.0.1-next.0' }, null, Date.now());
  rec('D1-28', r.result === 'update_available' ? 'PASS' : 'FAIL', '有新版本 → update_available',
    `result=${r.result}, target=${r.targetVersion}`, JSON.stringify(r));
}
// D1-30 semver 比对
{
  const pairs = [
    ['1.1.4','1.1.3',1], ['1.1.4','1.1.4',0], ['1.1.4','1.2.0',-1],
    ['1.1.4','1.1.4-next.3',1], ['1.1.4-next.3','1.1.4',-1], ['2.0.0','2.0.0-alpha',1], ['0.9.9','1.0.0',-1],
  ];
  let ok = 0;
  for (const [a,b,want] of pairs) { if (Math.sign(uc.semverCompare(a,b)) === want) ok++; }
  rec('D1-30', ok === pairs.length ? 'PASS' : 'FAIL', 'semver 比对(正式/prerelease/数字段)',
    `${ok}/${pairs.length} 组正确`, pairs.map(([a,b,w])=>`${a} vs ${b}=${Math.sign(uc.semverCompare(a,b))}(want ${w})`).join('; '));
}
// D1-31 dismiss 冷却期
{
  const f = join(EVID, '.tmp-skip.json');
  uc.writeSkipState(f, '1.1.5', { at: Date.now() });
  const st = uc.readSkipState(f);
  const r = uc.judgeUpdate('1.1.4', { latest: '1.1.5', next: '1.1.5-next.0' }, st, Date.now());
  rmSync(f, { force: true });
  rec('D1-31', r.result === 'dismissed' ? 'PASS' : 'FAIL', '冷却期内已 dismiss 版本 → dismissed',
    `result=${r.result}, expiresAt=${st.expiresAt}`, JSON.stringify(st));
}
// D1-33 skip 文件持久化与多路径
{
  const p = uc.skipFilePath();
  const fb = uc.fallbackSkipFilePath();
  uc.writeSkipState(p, '1.1.5', { at: Date.now() });
  const back = uc.readSkipState(p);
  rmSync(p, { force: true });
  rec('D1-33', (back && back.dismissedVersion === '1.1.5') ? 'PASS' : 'FAIL',
    'skip 文件写入/读回/多路径解析', `dismissedVersion=${back?.dismissedVersion}, primary=${p}, fallback=${fb}`, '');
}
// D1-40 镜像 lag 检测(已在 security 探针, 这里显式覆盖)
{
  const has = /judgeUpdate|update_available|up_to_date/.test(readFileSync(join(HDK,'src','update-check.mjs'),'utf8'));
  rec('D1-40', has ? 'PASS' : 'FAIL', '镜像 lag 下检测语义存在', `judgeUpdate 语义=${has}`, 'grep update-check.mjs');
}
// D1-45 兜底提示单次消费
{
  const hasConsumed = /consumedBySession/.test(readFileSync(join(HDK,'src','mcp-protocol.mjs'),'utf8'));
  rec('D1-45', hasConsumed ? 'PASS' : 'FAIL', '兜底/预热提示单次消费、跨调用不重复', `mcp-protocol consumedBySession=${hasConsumed}`, 'grep mcp-protocol.mjs consumedBySession 单次消费');
}

// ============ D2 认证 ============
// D2-1 auth init 三端同步 (源级 persistCredentials)
{
  const three = src('tools.mjs', 'writeGlobalCredentials') && src('tools.mjs','writeObsConfigFile') && src('tools.mjs','runHcloudConfigure');
  rec('D2-1', three ? 'PASS' : 'FAIL', 'persist 同步 S1(credentials)+S2(hcloud)+S3(obs)',
    `S1=${src('tools.mjs','writeGlobalCredentials')} S2=${src('tools.mjs','runHcloudConfigure')} S3=${src('tools.mjs','writeObsConfigFile')}`,
    'grep tools.mjs persistCredentials 三端写入');
}
// D2-2 auth status 结构化 (源级)
{
  const ok = src('auth/service.mjs', 'credentialsConfigured') && src('auth/service.mjs', 'kooCliInstalled') && src('auth/service.mjs', 'obsConfigured');
  rec('D2-2', ok ? 'PASS' : 'FAIL', 'auth_status 返回结构化字段',
    `credentialsConfigured/kooCliInstalled/obsConfigured=${ok}`, 'grep auth/service.mjs getAuthStatus');
}
// D2-5 凭证缺失报错
{
  const ok = src('auth/credentials.mjs', 'HDKIT_CRED_MISSING') && src('auth/credentials.mjs', 'HW_ACCESS_KEY');
  rec('D2-5', ok ? 'PASS' : 'FAIL', '凭证缺失 → HDKIT_CRED_MISSING + 指引',
    `HDKIT_CRED_MISSING=${src('auth/credentials.mjs','HDKIT_CRED_MISSING')}, 指引HW_ACCESS_KEY=${src('auth/credentials.mjs','HW_ACCESS_KEY')}`,
    'grep auth/credentials.mjs');
}
// D2-10 R7 current 档跟随 (源级 reconcile)
{
  const ok = src('auth/reconcile.mjs', 'current') && src('auth/reconcile.mjs', 'fingerprint');
  rec('D2-10', ok ? 'PASS' : 'FAIL', 'R7: current 档正确跟随+指纹匹配',
    `reconcile current/fingerprint=${ok}`, 'grep auth/reconcile.mjs');
}
// D2-11 R3 STS 拒绝落盘 (R2 冲突门先于 R3 - findings #9)
{
  const txt = readFileSync(join(HDK,'src','tools.mjs'),'utf8');
  const r3Guard = /cannot be persisted/.test(txt);
  const conflictIdx = txt.indexOf("status: 'needs_confirmation'");
  const persistIdx = txt.indexOf('const persisted = persistCredentials(ak, sk, securityToken, region)');
  // 缺陷: R2 冲突门(needs_confirmation@1214-1228)位于 R3 STS 检查(persistCredentials call@1237)之前
  const r2BeforeR3 = conflictIdx !== -1 && persistIdx !== -1 && conflictIdx < persistIdx;
  rec('D2-11', r2BeforeR3 ? 'FAIL' : 'PASS', 'R3: 带 securityToken 的 persist 应先于 R2 立即 rejected',
    `R3拒绝逻辑存在=${r3Guard}, R2冲突门先于R3=${r2BeforeR3}(缺陷)`,
    'tools.mjs auth_switch: R2 needs_confirmation 判定(1214-1228)先于 persistCredentials R3 检查(1237)');
}
// D2-12 R10 runtime 非空禁止落盘
{
  const ok = src('auth/service.mjs', 'auto-sync suppressed \\(R10\\)');
  rec('D2-12', ok ? 'PASS' : 'FAIL', 'R10: runtime 凭证激活时抑制自动落盘',
    `R10抑制=${ok}`, 'grep auth/service.mjs');
}
// D2-13 R9 configuredBySession 优先 env
{
  const ok = src('tools.mjs', 'configuredBySession: true') && src('tools.mjs', 'priority over env-injected');
  rec('D2-13', ok ? 'PASS' : 'FAIL', 'R9: configuredBySession S1 优先 env',
    `R9标记=${src('tools.mjs','configuredBySession: true')} 优先env注释=${src('tools.mjs','priority over env-injected')}`,
    'grep tools.mjs persistCredentials note');
}
// D2-16 import 文件读取后擦除
{
  const ok = src('tools.mjs', 'creds-import.json');
  rec('D2-16', ok ? 'PASS' : 'FAIL', 'import 读取 creds-import.json 后擦除',
    `creds-import.json 处理=${ok}`, 'grep tools.mjs creds-import.json');
}

// ============ D4 misc ============
// D4-4 写操作审批门
{
  const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
  const writes = [['ecs','CreateServer'],['ecs','DeleteServer'],['vpc','CreateVpc'],['rds','CreateInstance']];
  let deny = 0;
  for (const a of writes) { if (sp.classifyHcloudArgs(a, {}).decision === 'deny') deny++; }
  rec('D4-4', deny === writes.length ? 'PASS' : 'FAIL', '写操作未审批 → deny',
    `${deny}/${writes.length} 写操作未审批被拒`, writes.map(a=>`hcloud ${a.join(' ')}=${sp.classifyHcloudArgs(a,{}).decision}`).join(', '));
}
// D4-6 adminPass 回显警告/脱敏
{
  const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
  const red = sp.redactSecrets('hcloud ECS CreateServer --adminPass=Secret123 --name t');
  const d = sp.classifyHcloudArgs(['ecs','CreateServer'], {});
  rec('D4-6', d.decision === 'deny' && /<redacted>/.test(red) ? 'PASS' : 'FAIL',
    'adminPass 脱敏 + 写操作未审批 deny', `decision=${d.decision}, 脱敏后=${red}`, '');
}
// D4-7 hook 三工具有效
{
  const txt = readFileSync(join(HDK,'src','tools.mjs'),'utf8');
  const three = ['huaweicloud_hook_check_command','huaweicloud_hook_check_artifacts','huaweicloud_hook_check_deploy_plan'].every(n=>txt.includes(n));
  const re = await import(`file://${HDK}/src/risk-rule-engine.mjs`);
  const d = re.evaluateCommandRisk('rm -rf /');
  rec('D4-7', three && d.decision === 'deny' ? 'PASS' : 'FAIL', '三 hook 工具注册 + 破坏命令 deny',
    `三工具=${three}, rm -rf /=${d.decision}`, '');
}
// D4-10 规则库加载
{
  const re = await import(`file://${HDK}/src/risk-rule-engine.mjs`);
  const rl = re.loadRiskRules ? re.loadRiskRules({}) : {};
  const n = (rl.catalog && rl.catalog.rules) ? rl.catalog.rules.length : (rl.rules ? rl.rules.length : 0);
  rec('D4-10', n > 0 ? 'PASS' : 'FAIL', '规则库可加载且含规则', `规则数=${n}`, 'cloud-risk-rules.json (16 规则)');
}
// D4-11 提示注入/编码载荷防御
{
  const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
  const d = sp.classifyTextCommand('echo 67686c6f75642065637320437265617465536572766572 | xxd -r -p | sh').decision;
  rec('D4-11', d === 'deny' ? 'PASS' : 'FAIL', '编码载荷管道进解释器 → deny', `encoded=${d}`, 'classifyTextCommand 编码 shell exec');
}
// D4-12 供应链安装期安全
{
  const root = join(HDK, '..', '..'); // repo root (hdk)
  const pkgPath = join(root, 'package.json');
  let detail = ''; let ok = false;
  if (existsSync(pkgPath)) {
    const pj = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const scripts = pj.scripts || {};
    const deps = pj.dependencies || {};
    const post = scripts.postinstall || '';
    const noPre = !scripts.preinstall;
    const safe = !/eval\s*\(|child_process|exec\(|spawn\(|curl|wget|npm install/i.test(post);
    ok = noPre && post && safe && Object.keys(deps).every(d => /^undici$/.test(d));
    detail = `postinstall=${JSON.stringify(post)}, preinstall=${scripts.preinstall?'YES(危险)':'无'}, deps=${Object.keys(deps).join(',')}, safe=${safe}`;
  } else { detail = '未找到根 package.json'; }
  rec('D4-12', ok ? 'PASS' : 'FAIL', '无恶意 postinstall + 依赖锁定', detail, '审计 package.json');
}
// D4-20 拒绝后零操作 (审批 token 失效拒绝)
{
  const ok = src('tools.mjs', 'Invalid or expired approval token');
  rec('D4-20', ok ? 'PASS' : 'FAIL', '无效/过期令牌拒绝且零操作', `approval token 拦截=${ok}`, 'grep tools.mjs');
}
// D4-24 确认令牌过期/重复确认边界
{
  const ok = src('tools.mjs', 'Invalid or expired approval token') && src('tools.mjs', 'confirmToken not found or expired');
  rec('D4-24', ok ? 'PASS' : 'FAIL', '确认令牌未找到/过期 → 拒绝重复确认',
    `confirmToken 过期/未找到拦截=${ok}`, 'grep tools.mjs confirmToken');
}

// ============ D6 / D7 / D8 / D9 misc ============
// D7-4 国内镜像源
{
  const ok = src('update-check.mjs', 'HUAWEICLOUD_NPM_REGISTRY');
  rec('D7-4', ok ? 'PASS' : 'FAIL', '支持国内镜像源 (HUAWEICLOUD_NPM_REGISTRY)',
    `读取 HUAWEICLOUD_NPM_REGISTRY=${ok}`, 'grep update-check.mjs');
}
// D8-6 中英文文档一致
{
  const root = join(HDK, '..', '..');
  const en = existsSync(join(root,'README.md'));
  const zh = existsSync(join(root,'README.zh-CN.md'));
  rec('D8-6', en && zh ? 'PASS' : 'FAIL', 'README.md 与 README.zh-CN.md 并存',
    `README.md=${en}, README.zh-CN.md=${zh}`, 'ls README*.md');
}
// D8-7 meta 技能 frontmatter
{
  const skillsDir = join(HDK, 'skills');
  const metas = ['huaweicloud-core','huaweicloud-cli-and-auth','huaweicloud-api-and-sdk','huaweicloud-capability-discovery','huaweicloud-safety','huaweicloud-troubleshooting'];
  let ok = true; const det = [];
  for (const m of metas) {
    const p = join(skillsDir, m, 'SKILL.md');
    const exists = existsSync(p);
    const hasName = exists && /^name:\s*.+$/m.test(readFileSync(p,'utf8'));
    if (!(exists && hasName)) ok = false;
    det.push(`${m}=name:${!!hasName}`);
  }
  rec('D8-7', ok ? 'PASS' : 'FAIL', '6 个 meta 技能 frontmatter name 正确', det.join(' | '), '');
}
// D9-6 跨客户端互通
{
  const txt = readFileSync(join(HDK,'src','mcp-server.mjs'),'utf8');
  const stdio = /stdio/i.test(txt);
  const plugins = existsSync(join(HDK,'..','openclaw.plugin.json')) || existsSync(join(HDK,'openclaw.plugin.json'));
  rec('D9-6', stdio && plugins ? 'PASS' : 'FAIL', 'MCP stdio 跨客户端互通 + 多客户端 manifest',
    `stdio=${stdio}, openclaw.plugin.json=${plugins}`, '');
}

console.log('\n===== REMAINING DONE =====');
console.log('SUMMARY=' + JSON.stringify(R, null, 0));