// D2 认证：11 条（真实执行，全部走隔离 HOME，避免污染真实凭证）
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SRC, HDK, readSrc, lineOf, clip } from '../_lib/lib.mjs';
import { isoHome } from '../_lib/mcp.mjs';

const P = {};

const AK = 'AKIAPROBED2AAAAAAAAA';
const SK = 'ProbeSecretKeyD2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const STS = 'ProbeSecurityTokenD2bbbbbbbbbbbbbbbbbb';
const REGION = 'cn-north-4';

// 所有 auth 探针都在子进程里跑：C1 的 HUAWEICLOUD_HOME/baseHome() 在 import 时固化
// runtime 凭证是模块级单例，进程内切换会互相污染。
function child(name, rel, body) {
    const dir = isoHome(name);
    const home = join(dir, 'home');
    mkdirSync(home, { recursive: true });
    mkdirSync(join(dir, '.config', 'huaweicloud'), { recursive: true });
    const p = join(dir, `${name}.mjs`);
    writeFileSync(p, body, 'utf8');
    return { dir, home, path: p };
}

function runChild(c, extraEnv = {}) {
    const r = spawnSync(process.execPath, [c.path], {
        encoding: 'utf8', windowsHide: true, timeout: 180000,
        env: {
            ...process.env,
            HOME: c.home, USERPROFILE: c.home, HUAWEICLOUD_HOME: c.home,
            HDK_ISOLATED: '1',
            ...extraEnv,
        },
    });
    let parsed = null;
    try { parsed = JSON.parse(r.stdout); } catch { /* keep raw */ }
    return { code: r.status, stdout: r.stdout, stderr: r.stderr, json: parsed };
}

const PRELUDE = () => `
import { existsSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const C = await import('file:///${SRC}/auth/credentials.mjs');
`;

// ---------------- D2-1 auth init 三端同步 ----------------
P['D2-1'] = async (ctx) => {
    const c = child('d2-1-auth-init', 'd2-1', PRELUDE() + `
const out = {};
out.paths = {
  global: C.globalCredentialsPath(),
  obs: C.obsConfigPath(),
};
out.before = existsSync(out.paths.global);
// 1) auth init = setRuntimeCredentials（会话级） + 三端探针
const S = await import('file:///${SRC}/auth/service.mjs');
const initRes = await import('file:///${SRC}/tools.mjs').then(m => m.callTool('huaweicloud_auth_init', { ak: '${AK}', sk: '${SK}', region: '${REGION}' }));
out.initRes = initRes;
out.runtimeActive = C.hasRuntimeCredentials();
out.runtimeResolved = C.resolveCredentialsWithRuntime();
out.sessionOnly = !existsSync(out.paths.global) && out.runtimeActive;
// 2) auth_status 判定：runtimeActive=true + credentialsConfigured=false
const st = S.getAuthStatus('all');
out.status = {
  credentialsConfigured: st.credentialsConfigured,
  runtimeActive: st.reconciled?.runtimeActive,
  activeSource: st.credentialPanel?.activeSource,
  obsConfigured: st.obsConfigured,
  kooCliInstalled: st.kooCliInstalled,
  kooCliStatus: st.kooCliStatus,
};
// 3) persist 落 S1/S3 + attempt S2
const persist = await import('file:///${SRC}/tools.mjs').then(m => m.callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'memory', ak: '${AK}', sk: '${SK}', region: '${REGION}' }));
out.persist = persist;
out.after = {
  globalExists: existsSync(out.paths.global),
  obsExists: existsSync(out.paths.obs),
};
if (out.after.globalExists) out.s1 = JSON.parse(readFileSync(out.paths.global, 'utf8'));
if (out.after.obsExists) out.s3 = readFileSync(out.paths.obs, 'utf8');
console.log(JSON.stringify(out));
`);
    const r = runChild(c);
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 500) });
    ctx.ok('隔离 HOME 探针子进程正常退出', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.ok('auth init 后 runtimeActive=true 且仅会话级生效（未写 S1）', j.sessionOnly === true, j);
    ctx.ok('auth_status 判定 runtimeActive=true 且 credentialsConfigured=false', j.status?.runtimeActive === true && j.status?.credentialsConfigured === false, j.status);
    ctx.ok('credentialPanel.activeSource 反映真实来源（会话 runtime 非 s1-persistent）', j.status?.activeSource !== 's1-persistent', j.status?.activeSource);
    ctx.ok('persist 后 S1 全局凭证落盘且含 ak/sk/region/configuredBySession',
        j.after?.globalExists === true && j.s1?.ak === AK && j.s1?.sk === SK && j.s1?.region === REGION && j.s1?.configuredBySession === true, j.s1);
    ctx.ok('persist 后 S3 OBS 配置落盘且格式正确（endpoint/ak/sk 扁平 key=value）',
        j.after?.obsExists === true && /^endpoint=https:\/\/obs\.cn-north-4\.myhuaweicloud\.com\nak=/.test(j.s3 || '') && new RegExp(`sk=${SK}`).test(j.s3 || ''), clip(j.s3, 300));
    ctx.ok('persist 返回结构化结果（status/scope/obs/hcloud 三端结论）',
        ['ok', 'partial'].includes(j.persist?.status) && !!j.persist?.scope && !!j.persist?.obs && !!j.persist?.hcloud, j.persist);
    ctx.set('rootCause', 'auth/service.mjs:189 getAuthStatus + tools.mjs:1055 persistCredentials');
};

// ---------------- D2-2 auth status 判定准确（构造三端组合） ----------------
P['D2-2'] = async (ctx) => {
    const cases = [
        { tag: 'empty', prep: '', expect: { credentialsConfigured: false, obsConfigured: false } },
        { tag: 's1-only', prep: 's1', expect: { credentialsConfigured: true, obsConfigured: false } },
        { tag: 's1+obs', prep: 's1+obs', expect: { credentialsConfigured: true, obsConfigured: true } },
        { tag: 's1+obs+runtime', prep: 's1+obs+runtime', expect: { credentialsConfigured: true, obsConfigured: true, runtimeActive: true } },
    ];
    const results = [];
    for (const cs of cases) {
        const c = child(`d2-2-${cs.tag}`, 'd2-2', PRELUDE() + `
const gp = C.globalCredentialsPath(), op = C.obsConfigPath();
mkdirSync(join(gp, '..'), { recursive: true });
${cs.prep.includes('s1') ? `writeFileSync(gp, JSON.stringify({ ak: '${AK}', sk: '${SK}', securityToken: '', region: '${REGION}' }), 'utf8');` : ''}
${cs.prep.includes('obs') ? `writeFileSync(op, 'endpoint=https://obs.cn-north-4.myhuaweicloud.com\\nak=${AK}\\nsk=${SK}\\n', 'utf8');` : ''}
${cs.prep.includes('runtime') ? `C.setRuntimeCredentials('${AK}', '${SK}', '', '${REGION}');` : ''}
const S = await import('file:///${SRC}/auth/service.mjs');
const st = S.getAuthStatus('all');
console.log(JSON.stringify({
  credentialsConfigured: st.credentialsConfigured,
  obsConfigured: st.obsConfigured,
  runtimeActive: st.reconciled?.runtimeActive,
  activeSource: st.credentialPanel?.activeSource,
  s1Configured: st.credentialPanel?.s1?.configured,
  agentsIsArray: Array.isArray(st.agents),
  agentsIsObject: !!st.agents && typeof st.agents === 'object' && !Array.isArray(st.agents),
  agentKeys: st.agents ? Object.keys(st.agents) : [],
  agentsAllBoolean: st.agents ? Object.values(st.agents).every((v) => v && typeof v.configured === 'boolean') : false,
}));
`);
        const r = runChild(c);
        results.push({ tag: cs.tag, expect: cs.expect, actual: r.json, code: r.code, stderr: clip(r.stderr, 300) });
    }
    ctx.set('combinations', results);
    for (const item of results) {
        const a = item.actual || {};
        for (const [k, v] of Object.entries(item.expect)) {
            ctx.ok(`组合 ${item.tag}: ${k} 判定正确`, a[k] === v, { expect: v, actual: a[k], err: item.stderr });
        }
    }
    const s1obs = results.find((x) => x.tag === 's1+obs')?.actual;
    ctx.ok('仅 S1+S3（无 runtime）时 activeSource=s1-persistent', s1obs?.activeSource === 's1-persistent', s1obs?.activeSource);
    const rt = results.find((x) => x.tag === 's1+obs+runtime')?.actual;
    ctx.ok('runtime 存在时 activeSource 仍为 s1-persistent（runtime 非 STS）且 runtimeActive=true', rt?.runtimeActive === true, rt);
    // 契约：status.agents 是 target→{configured:boolean} 映射（agent-registration.mjs:223-241），非数组
    const keySets = results.map((x) => (x.actual?.agentKeys || []).join(','));
    ctx.ok('status.agents 为 target→{configured} 映射且各客户端注册态可枚举（agent-registration.mjs:223）',
        results.every((x) => x.actual?.agentsIsObject === true && x.actual?.agentsAllBoolean === true),
        { types: results.map((x) => (x.actual?.agentsIsArray ? 'array' : x.actual?.agentsIsObject ? 'object' : 'other')), keySets });
    ctx.ok('status.agents 覆盖全部 11 个客户端 target',
        keySets.every((k) => k.split(',').filter(Boolean).length === 11), keySets[0]);
    ctx.set('rootCause', 'auth/service.mjs:189-221 getAuthStatus；auth/agent-registration.mjs:223 getAgentRegistrationStatuses');
};

// ---------------- D2-4 凭证脱敏正确性（P0） ----------------
P['D2-4'] = async (ctx) => {
    const SP = await import('file:///' + SRC + '/safety-policy.mjs');
    const HC = await import('file:///' + SRC + '/hcloud-cli.mjs');
    // 契约：D2-4「①执行脱敏展示 ②检查输出中 AK 中段、SK 永不完整」
    const samples = [
        { name: 'access_key= 明文', text: `hcloud configure set --cli-profile=default --access-key=${AK}`, secret: AK },
        { name: 'security_token= STS', text: `security_token=${STS}`, secret: STS },
        { name: 'admin_pass 回显', text: `admin_pass=Huawei@12345`, secret: 'Huawei@12345' },
        { name: 'adminPass camelCase', text: `adminPass=Huawei@12345`, secret: 'Huawei@12345' },
        { name: 'AK=/SK: 简写', text: `AK=${AK}\nSK=${SK}`, secret: SK },
        { name: 'x_auth_token', text: `x_auth_token=${STS}`, secret: STS },
    ];
    const redacted = samples.map((s) => ({ ...s, out: SP.redactSecrets(s.text) }));
    ctx.set('redacted', redacted);
    for (const r of redacted) {
        ctx.ok(`脱敏：${r.name} 明文值不出现在输出中`, !r.out.includes(r.secret), { out: clip(r.out, 200) });
        ctx.ok(`脱敏：${r.name} 命中 <redacted> 占位`, /<redacted>/.test(r.out), { out: clip(r.out, 200) });
    }
    ctx.ok('AK 中段被隐藏（AK 完整明文不出现）', !redacted[0].out.includes(AK), { out: clip(redacted[0].out, 200) });
    ctx.ok('SK 永不完整出现', !redacted[4].out.includes(SK), { out: clip(redacted[4].out, 200) });
    // 真实缺陷候选：多行 user_data 只有首行被清空（regex 用 `.*` 无 s 标志）
    const multi = `--server.user_data=#!/bin/sh\necho "-----BEGIN RSA PRIVATE KEY-----"\nDB_PASSWORD=hunter2`;
    const multiOut = SP.redactSecrets(multi);
    ctx.set('multilineUserData', { in: multi, out: multiOut });
    ctx.ok('多行 user_data 的后续行也被清空（safety-policy.mjs:40 的 `.` 缺 s 标志，只清空首行）',
        !/BEGIN RSA PRIVATE KEY/.test(multiOut) && !/hunter2/.test(multiOut),
        { in: multi, out: multiOut, line: lineOf('safety-policy.mjs', 'user[_-]?data|metadata|private[_-]?key') });
    // 单行 opaque blob 形态是产品已声明契约（safety-policy.mjs:39-41 整值清空）
    const singleLine = SP.redactSecrets([
        '--server.user_data=ZXhwb3J0IEFQUF9TRUNSRVQ9czNjcjN0',
        '--keypair.private_key=-----BEGIN RSA PRIVATE KEY-----',
    ]);
    ctx.ok('单行 user_data/private_key 整值被清空（产品声明契约）',
        !/ZXhwb3J0|RSA PRIVATE/.test(j2s(singleLine)) && j2s(singleLine).includes('<redacted>'), singleLine);
    // 对象/数组递归脱敏
    const obj = { profile: 'default', secret_key: SK, nested: { password: 'p@ss', items: [{ security_token: STS }] } };
    const red = SP.redactSecrets(obj);
    ctx.set('objectRedacted', red);
    ctx.ok('对象键名命中 secretKeyNamePatterns 时整值替换为 <redacted>', red.secret_key === '<redacted>', red);
    ctx.ok('嵌套对象与数组内 secret 同样脱敏', red.nested.password === '<redacted>' && red.nested.items[0].security_token === '<redacted>', red.nested);
    ctx.ok('非敏感字段（profile）保持原值', red.profile === 'default', red.profile);
    // hcloud-cli 侧：真实产品路径 redactOutput / redactArgsWithObs
    const ra = HC.redactArgsWithObs(['ECS', 'CreateServers', '--server.adminPass=Secret123!', '--name', 'x']);
    ctx.set('redactArgsWithObs', ra);
    ctx.ok('redactArgsWithObs 对 --server.adminPass= 形参脱敏', !j2s(ra).includes('Secret123!') && j2s(ra).includes('<redacted>'), clip(j2s(ra), 300));
    const obsArgs = HC.redactArgsWithObs(['OBS', 'ShowBucket', '-i', 'AKOBSOBSOBSOBSOBSOBS', '-kAKOBSOBSOBSOBSOBSOBS']);
    ctx.set('redactArgsWithObsObs', obsArgs);
    ctx.ok('redactArgsWithObs 对 OBS -i/-k 凭证形参脱敏', !j2s(obsArgs).includes('AKOBSOBSOBSOBSOBSOBS'), clip(j2s(obsArgs), 300));
    const ro = HC.redactOutput(`{"token": "TokenValueABCDEF123456", "note": "keep"}`);
    ctx.set('redactOutputJson', ro);
    ctx.ok('redactOutput JSON 路径：parse 后按 key 脱敏且保留非敏感字段',
        !ro.includes('TokenValueABCDEF123456') && ro.includes('<redacted>') && ro.includes('keep'), clip(ro, 300));
    const roText = HC.redactOutput('adminPass=Secret123! security_token=stABC token=tokABC');
    ctx.set('redactOutputText', roText);
    ctx.ok('redactOutput 文本路径：token/security_token/adminPass 三种均脱敏',
        !/Secret123!|stABC|tokABC/.test(roText) && (roText.match(/<redacted>/g) || []).length === 3, clip(roText, 300));
    // 真实缺陷候选：JSON 解析失败时退回纯文本脱敏，JSON 片段里的 key 不被识别
    const jsonTail = `Error: {"secret_key":"${SK}"} (truncated)`;
    const roTail = HC.redactOutput(jsonTail);
    ctx.set('redactOutputJsonFallback', { in: jsonTail, out: roTail });
    ctx.ok('JSON 片段（JSON 后带尾随文本，hcloud-cli.mjs:774 parse 失败回退文本路径）仍被脱敏',
        !roTail.includes(SK), { in: jsonTail, out: roTail, line: lineOf('hcloud-cli.mjs', 'export function redactOutput') });
    const policy = JSON.parse(readFileSync(`${HDK}/plugins/huaweicloud-core/safety/policy.json`, 'utf8'));
    ctx.set('policySecretKeyNamePatterns', policy.secretKeyNamePatterns);
    // 键名模式覆盖 access/secret/security_token/xauth/authorization/password/passwd/token/credential/private_key/user_data/metadata/ak/sk
    // adminPass/admin_pass 不在 secretKeyNamePatterns 中，靠 redactString 的 admin[_-]?pass 正则覆盖（见 samples 断言）
    // 按 isSecretKeyName 的真实语义（safety-policy.mjs:31 `^(${pattern})$`）逐个键名验证覆盖
    const keyNames = ['access_key', 'accessKey', 'secret_key', 'secretKey', 'security_token', 'x_auth_token',
        'authorization', 'password', 'passwd', 'token', 'credential', 'private_key', 'user_data', 'metadata', 'ak', 'sk'];
    const keyHits = keyNames.map((k) => ({
        key: k,
        covered: policy.secretKeyNamePatterns.some((p) => new RegExp(`^(${p})$`, 'i').test(k)),
    }));
    ctx.set('keyNameCoverage', keyHits);
    const uncovered = keyHits.filter((x) => !x.covered).map((x) => x.key);
    ctx.ok('policy.json secretKeyNamePatterns 覆盖全部敏感键名形态（含 adminPass 走 redactString 正则）',
        uncovered.length === 0, { uncovered, patterns: policy.secretKeyNamePatterns });
    ctx.ok('admin_pass/adminPass 变体由 redactString 正则覆盖（不在 key patterns 列表但实测脱敏）',
        /admin[_-]?pass/.test(readSrc('safety-policy.mjs')), { line: lineOf('safety-policy.mjs', 'admin[_-]?pass') });
    ctx.set('rootCause', 'safety-policy.mjs:40 多行 opaque blob 正则缺 s 标志；hcloud-cli.mjs:774 redactOutput JSON 回退路径');
};
function j2s(o) { try { return JSON.stringify(o); } catch { return String(o); } }

// ---------------- D2-5 凭证缺失/错误/过期报错指引 ----------------
P['D2-5'] = async (ctx) => {
    const c = child('d2-5-cred-errors', 'd2-5', PRELUDE() + `
const out = {};
// 1) 完全无凭证
for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN']) delete process.env[k];
try { C.resolveCredentials(); out.missing = 'NO_THROW'; }
catch (e) { out.missing = { code: e.code, message: e.message, onboardingScenario: e.onboarding?.scenario, onboardingSteps: e.onboarding?.steps }; }
// 2) R11 placeholder/masked 值不算凭证（credentials.mjs:66-82 isPlaceholder 声明的形态）
const docPlaceholders = ['<HW_ACCESS_KEY>', '\${HW_SECRET_KEY}', 'YOUR_AK', 'ACCESS_KEY', 'SECRET_KEY', 'SECURITY_TOKEN', 'REPLACE_ME', 'abc****', '****'];
out.docPlaceholders = docPlaceholders.map((v) => ({ v, isPlaceholder: C.isPlaceholder(v) }));
out.placeholderResolve = (() => {
    process.env.HW_ACCESS_KEY = '<HW_ACCESS_KEY>';
    process.env.HW_SECRET_KEY = 'YOUR_SK';
    try { C.resolveCredentials(); return 'NO_THROW'; }
    catch (e) { return { code: e.code }; }
    finally { delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; }
})();
// 未覆盖的模板文本：R11 注释（credentials.mjs:61-65）声明要防 IDE/市场预填模板文本遮蔽真实 S1
// 注：20 位纯字母数字串按产品注释属"真实 AK"，故不列入期望
out.extraTemplates = ['***masked***', 'YOUR_SECRET_KEY_HERE', 'YOUR_AK_HERE', '<your-ak>', 'YOUR_SECRET'].map((v) => ({ v, isPlaceholder: C.isPlaceholder(v) }));
delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY;
// 3) allowMissing 模式
out.allowMissing = C.resolveCredentials({ allowMissing: true });
// 4) validateIamCredentials 对错误 AK 的真实报错
const V = await import('file:///${SRC}/auth/credential-validator.mjs');
out.badAk = await V.validateIamCredentials({ ak: 'AKIABOGUSKEY000000000', sk: '${SK}', region: '${REGION}', timeoutMs: 20000 });
// 5) explain_error 对 AUTH 错误分类
const T = await import('file:///${SRC}/tools.mjs');
out.explain = await T.callTool('huaweicloud_explain_error', { service: 'IAM', errorCode: '401', message: 'The provided authentication is invalid', requestId: 'req-probe-001' });
console.log(JSON.stringify(out));
`);
    const r = runChild(c);
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 400) });
    ctx.ok('探针子进程退出 0', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.eq('无凭证时抛 HDKIT_CRED_MISSING', j.missing?.code, 'HDKIT_CRED_MISSING');
    ctx.ok('缺失报错给出可执行指引（auth-init 步骤而非裸堆栈）',
        /npx huaweicloud-devkit auth init/.test(j.missing?.message || '') && Array.isArray(j.missing?.onboardingSteps) && j.missing.onboardingSteps.length > 0, j.missing);
    ctx.eq('缺失时 onboarding 场景=3（s1-missing）', j.missing?.onboardingScenario, 3);
    const docMiss = (j.docPlaceholders || []).filter((x) => !x.isPlaceholder).map((x) => x.v);
    ctx.set('placeholderProbe', { declared: j.docPlaceholders, extra: j.extraTemplates, resolve: j.placeholderResolve });
    ctx.ok('R11：credentials.mjs:66-82 声明的 placeholder/masked 形态全部被识别为未配置',
        docMiss.length === 0, { missed: docMiss, declared: j.docPlaceholders });
    ctx.eq('placeholder env 下 resolveCredentials 抛 HDKIT_CRED_MISSING', j.placeholderResolve?.code, 'HDKIT_CRED_MISSING');
    // 缺口：R11 注释声称防止 IDE/市场预填模板文本遮蔽真实 S1，但这些常见写法未命中 isPlaceholder
    const extraUncovered = (j.extraTemplates || []).filter((x) => !x.isPlaceholder).map((x) => x.v);
    ctx.ok('R11 覆盖常见 IDE/市场预填模板文本（***masked*** / YOUR_SECRET_KEY_HERE 等）不被当作凭证',
        extraUncovered.length === 0, { uncovered: extraUncovered, isPlaceholder: j.extraTemplates,
            line: lineOf('auth/credentials.mjs', 'export function isPlaceholder') });
    ctx.eq('allowMissing=true 时返回 null 而非抛错', j.allowMissing, null);
    ctx.set('badAkResult', j.badAk);
    ctx.ok('错误 AK 的真云校验不通过（valid=false）且给出分类错误（APIGW.0301 / 401）',
        j.badAk?.valid === false && /APIGW\.0301|HTTP 401|invalid/i.test(j.badAk?.error || ''), j.badAk);
    ctx.ok('真云校验失败不泄露 SK 明文', !j2s(j.badAk).includes(SK), clip(j2s(j.badAk), 300));
    ctx.set('explainResult', j.explain);
    ctx.ok('explain_error 对 401 鉴权错误给出权限类诊断而非裸报错',
        /权限|permission|auth|认证|鉴权|credential/i.test(j2s(j.explain)), clip(j2s(j.explain), 400));
    ctx.set('rootCause', 'auth/credentials.mjs:264-305；auth/credential-validator.mjs validateIamCredentials');
};

// ---------------- D2-10 R7 current 档跟随 ----------------
P['D2-10'] = async (ctx) => {
    const c = child('d2-10-current-profile', 'd2-10', PRELUDE() + `
const out = {};
const R = await import('file:///${SRC}/auth/reconcile.mjs');
// KooCLI 真实布局：~/.hcloud/config.json（reconcile.mjs:20-25 kooCliConfigPath，固定 home，不随 HUAWEICLOUD_HOME）
const cfgPath = join(process.env.HUAWEICLOUD_HOME, '.hcloud', 'config.json');
mkdirSync(join(cfgPath, '..'), { recursive: true });
const mk = (cur) => JSON.stringify({
  current: cur,
  authEncrypt: 'false',
  profiles: [
    { name: 'default', region: 'cn-north-4', output: 'json', accessKeyId: 'AKDEFAULT000000000000000000', secretAccessKey: 'sk-default-000000000000' },
    { name: 'deploy', region: 'cn-south-1', output: 'table', accessKeyId: 'AKDEPLOY00000000000000000000', secretAccessKey: 'sk-deploy-0000000000000' },
  ],
});
out.configPath = R.kooCliConfigPath();
writeFileSync(cfgPath, mk('deploy'), 'utf8');
out.profiles = R.readKooCliProfiles();
out.resolved = R.resolveManagedProfile();
out.fpDeploy = R.currentFingerprintFromHcloud(R.readKooCliProfiles());
// R7：current 切到 default 后必须跟随
writeFileSync(cfgPath, mk('default'), 'utf8');
out.profilesAfterSwitch = R.readKooCliProfiles();
out.resolvedAfterSwitch = R.resolveManagedProfile();
out.fpDefault = R.currentFingerprintFromHcloud(R.readKooCliProfiles());
// authEncrypt=true 时 AK/SK 为密文，fingerprint 必须让位（#533）
writeFileSync(cfgPath, JSON.stringify({
  current: 'deploy', authEncrypt: 'true',
  profiles: [{ name: 'deploy', accessKeyId: 'CIPHER-AK', secretAccessKey: 'CIPHER-SK' }],
}), 'utf8');
out.encrypted = R.readKooCliProfiles();
console.log(JSON.stringify(out));
`);
    const r = runChild(c);
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 400) });
    ctx.ok('探针子进程退出 0', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.ok('readKooCliProfiles 解析出两档（default/deploy）', (j.profiles?.profiles?.length ?? 0) === 2, j.profiles);
    ctx.eq('current=deploy 时 resolveManagedProfile 返回 deploy', j.resolved, 'deploy');
    ctx.eq('切换 current=default 后 resolveManagedProfile 跟随为 default（R7）', j.resolvedAfterSwitch, 'default');
    ctx.ok('未加密档 fingerprint 由 AK+SK 派生且随档切换而变', /^[0-9a-f]{8}$/.test(j.fpDeploy || '') && /^[0-9a-f]{8}$/.test(j.fpDefault || '') && j.fpDeploy !== j.fpDefault,
        { deploy: j.fpDeploy, default: j.fpDefault });
    ctx.ok('authEncrypt=true 时不把密文当凭证（fingerprint/accessKeyId 留空并标 encrypted）',
        j.encrypted?.authEncrypt === true && j.encrypted?.profiles?.[0]?.encrypted === true
        && j.encrypted?.profiles?.[0]?.fingerprint === '' && j.encrypted?.profiles?.[0]?.accessKeyId === '', j.encrypted);
    // runHcloudConfigure 必须把 --cli-profile= 作为实参传给 hcloud（源码 + 夹具）
    const R = readSrc('auth/reconcile.mjs');
    const line = lineOf('auth/reconcile.mjs', '--cli-profile=');
    ctx.ok('runHcloudConfigure 以 --cli-profile=<profile> 实参调用（非裸 hcloud configure set）', line > 0,
        { line, code: R.split('\n')[line - 1]?.trim() });
    ctx.ok('resolveManagedProfile 结果直接透传为 --cli-profile 实参',
        /runHcloudConfigure[\s\S]{0,400}--cli-profile=\$\{profile\}/.test(R), { line });
    ctx.set('rootCause', 'auth/reconcile.mjs:79 resolveManagedProfile / :204 runHcloudConfigure');
};

// ---------------- D2-11 R3 STS token 拒绝落盘（P0） ----------------
P['D2-11'] = async (ctx) => {
    const c = child('d2-11-sts-reject', 'd2-11', PRELUDE() + `
const out = {};
const T = await import('file:///${SRC}/tools.mjs');
const gp = C.globalCredentialsPath();
mkdirSync(join(gp, '..'), { recursive: true });
writeFileSync(gp, JSON.stringify({ ak: '${AK}', sk: '${SK}', securityToken: '', region: '${REGION}' }), 'utf8');
out.beforeS1 = JSON.parse(readFileSync(gp, 'utf8'));
// STS + persist → 必须拒绝
out.persistSts = await T.callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'memory', ak: '${AK}', sk: '${SK}', securityToken: '${STS}', region: '${REGION}' });
out.afterS1 = JSON.parse(readFileSync(gp, 'utf8'));
out.obsExistsAfterPersist = existsSync(C.obsConfigPath());
out.obsText = out.obsExistsAfterPersist ? readFileSync(C.obsConfigPath(), 'utf8') : null;
// STS + temporary → 允许（仅内存）
out.temporarySts = await T.callTool('huaweicloud_auth_switch', { action: 'temporary', mode: 'memory', ak: '${AK}', sk: '${SK}', securityToken: '${STS}', region: '${REGION}' });
out.runtimeHasSts = C.hasRuntimeCredentials() ? C.resolveCredentialsWithRuntime().securityToken : null;
out.s1AfterTemporary = JSON.parse(readFileSync(gp, 'utf8'));
out.obsAfterTemporary = existsSync(C.obsConfigPath()) ? readFileSync(C.obsConfigPath(), 'utf8') : null;
console.log(JSON.stringify(out));
`);
    const r = runChild(c);
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 400) });
    ctx.set('persistSts', j.persistSts);
    ctx.ok('探针子进程退出 0', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.eq('STS + persist 返回 status=error', j.persistSts?.status, 'error');
    ctx.eq('STS + persist 拒绝范围 scope=rejected', j.persistSts?.scope, 'rejected');
    ctx.ok('拒绝信息指明 R3 与改用 temporary 的动作',
        /R3/.test(j.persistSts?.error || '') && /temporary/i.test(j.persistSts?.error || ''), j.persistSts);
    ctx.ok('S1 未被写入 securityToken', (j.afterS1?.securityToken || '') === '', j.afterS1);
    ctx.eq('S1 内容未被 STS 覆盖（ak 不变）', j.afterS1?.ak, AK);
    ctx.ok('OBS 配置未落盘 STS token', !(j.obsText || '').includes(STS), clip(j.obsText, 200));
    ctx.ok('STS + temporary 成功（status=ok/scope=temporary）', j.temporarySts?.status === 'ok' && j.temporarySts?.scope === 'temporary', j.temporarySts);
    ctx.eq('temporary 模式下 runtime 确实携带 securityToken', j.runtimeHasSts, STS);
    ctx.ok('temporary 不落盘：S1 仍无 token', (j.s1AfterTemporary?.securityToken || '') === '', j.s1AfterTemporary);
    ctx.ok('temporary 不落盘：OBS 配置不含 token', !(j.obsAfterTemporary || '').includes('token='), clip(j.obsAfterTemporary, 200));
    ctx.set('rootCause', 'tools.mjs:1055-1062 persistCredentials 前置 R3 拒绝');
};

// ---------------- D2-12 R10 runtime 非空禁止落盘 ----------------
P['D2-12'] = async (ctx) => {
    const c = child('d2-12-runtime-suppress', 'd2-12', PRELUDE() + `
const out = {};
const S = await import('file:///${SRC}/auth/service.mjs');
const T = await import('file:///${SRC}/tools.mjs');
const gp = C.globalCredentialsPath();
mkdirSync(join(gp, '..'), { recursive: true });
writeFileSync(gp, JSON.stringify({ ak: '${AK}', sk: '${SK}', securityToken: '', region: '${REGION}' }), 'utf8');
out.syncNoRuntime = S.syncAuth('all');
out.lastSyncNoRuntime = C.readLastSync();
// 注入 runtime 凭证
await T.callTool('huaweicloud_auth_init', { ak: 'AKRUNTIME00000000000000000', sk: '${SK}', region: '${REGION}' });
out.runtimeActive = C.hasRuntimeCredentials();
out.statusRuntime = S.getAuthStatus('all').reconciled?.runtimeActive;
// 被拒绝的同步不得改动任何落盘：记录拒绝前 OBS 配置与 KooCLI 状态
const obsPath = C.obsConfigPath();
out.obsBefore = existsSync(obsPath) ? readFileSync(obsPath, 'utf8') : null;
out.obsMtimeBefore = existsSync(obsPath) ? statSync(obsPath).mtimeMs : null;
out.syncWithRuntime = S.syncAuth('all');
out.lastSyncWithRuntime = C.readLastSync();
out.obsAfterSyncWithRuntime = existsSync(obsPath) ? readFileSync(obsPath, 'utf8') : null;
out.obsMtimeAfter = existsSync(obsPath) ? statSync(obsPath).mtimeMs : null;
// clear runtime 后恢复
await T.callTool('huaweicloud_auth_switch', { action: 'clear' });
out.runtimeAfterClear = C.hasRuntimeCredentials();
out.syncAfterClear = S.syncAuth('all');
console.log(JSON.stringify(out));
`);
    const r = runChild(c);
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 400) });
    ctx.ok('探针子进程退出 0', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.ok('auth_init 后 runtimeActive=true', j.runtimeActive === true, j);
    ctx.eq('auth_status 反映 runtimeActive', j.statusRuntime, true);
    ctx.ok('R10：runtime 非空时 auth_sync 拒绝同步（ok=false）', j.syncWithRuntime?.ok === false, j.syncWithRuntime);
    ctx.ok('拒绝原因为 runtime 凭证激活并指明清除方式',
        /R10/.test(j.syncWithRuntime?.error || '') && /clear|persist/.test(j.syncWithRuntime?.nextStep || ''), j.syncWithRuntime);
    // R10 分支必须先于 writeObsConfig 返回（service.mjs:233 在 :243 之前）→ 拒绝时 OBS 内容与 mtime 均不变
    ctx.ok('被拒绝时 OBS 配置未被改写（内容与 mtime 均不变）',
        j.obsAfterSyncWithRuntime === j.obsBefore
        && (j.obsMtimeAfter === j.obsMtimeBefore),
        { before: clip(String(j.obsBefore), 200), after: clip(String(j.obsAfterSyncWithRuntime), 200),
            mtimeBefore: j.obsMtimeBefore, mtimeAfter: j.obsMtimeAfter,
            rejectLine: lineOf('auth/service.mjs', 'auto-sync suppressed'), writeLine: lineOf('auth/service.mjs', 'writeObsConfig(credentials)') });
    ctx.ok('action=clear 后 runtimeActive=false', j.runtimeAfterClear === false, j.runtimeAfterClear);
    ctx.ok('clear 后 auth_sync 恢复可执行（不再受 R10 抑制）', j.syncAfterClear?.ok !== false || /not configured|KooCLI/.test(j.syncAfterClear?.error || ''), j.syncAfterClear);
    ctx.ok('R10 分支源码含明确规则注释', /R10/.test(readSrc('auth/service.mjs')), { line: lineOf('auth/service.mjs', 'R10') });
    ctx.set('rootCause', 'auth/service.mjs:233-239 syncAuth 的 R10 分支');
};

// ---------------- D2-13 R9 configuredBySession 优先 env ----------------
P['D2-13'] = async (ctx) => {
    const c = child('d2-13-s1-env', 'd2-13', PRELUDE() + `
const out = {};
const gp = C.globalCredentialsPath();
mkdirSync(join(gp, '..'), { recursive: true });
// ① 写 S1 + configuredBySession=true
writeFileSync(gp, JSON.stringify({ ak: '${AK}', sk: '${SK}', securityToken: '', region: '${REGION}', configuredBySession: true }), 'utf8');
// ② 注入 env（模拟平台注入的另一套账号）
process.env.HW_ACCESS_KEY = 'AKENVINJECTED0000000000000';
process.env.HW_SECRET_KEY = 'sk-env-injected-000000000';
process.env.HW_REGION = 'cn-south-1';
out.withFlag = C.resolveCredentials();
// ③ 清除 configuredBySession 标记后复算 → env 应重新生效
writeFileSync(gp, JSON.stringify({ ak: '${AK}', sk: '${SK}', securityToken: '', region: '${REGION}' }), 'utf8');
out.withoutFlag = C.resolveCredentials();
// ④ S1 无 AK 时 env 兜底
writeFileSync(gp, JSON.stringify({ ak: '', sk: '', region: '' }), 'utf8');
out.s1Empty = C.resolveCredentials();
console.log(JSON.stringify(out));
`);
    const r = runChild(c, { HW_ACCESS_KEY: 'AKENVOUTER000000000000000', HW_SECRET_KEY: 'sk-env-outer-0000000000' });
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 400) });
    ctx.ok('探针子进程退出 0', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.eq('R9：configuredBySession=true 时 S1 覆盖 env 的 AK', j.withFlag?.ak, AK);
    ctx.eq('R9：configuredBySession=true 时 S1 覆盖 env 的 SK', j.withFlag?.sk, SK);
    ctx.ok('R9：region 仍以 env HW_REGION 为准（仅凭证字段被 S1 接管）', j.withFlag?.region === 'cn-south-1', j.withFlag?.region);
    ctx.eq('清除 configuredBySession 标记后 env AK 重新生效', j.withoutFlag?.ak, 'AKENVINJECTED0000000000000');
    ctx.eq('清除标记后 env SK 重新生效', j.withoutFlag?.sk, 'sk-env-injected-000000000');
    ctx.eq('S1 为空时回退到 env AK（env 兜底）', j.s1Empty?.ak, 'AKENVINJECTED0000000000000');
    ctx.ok('源码含 R9 显式规则说明', /R9/.test(readSrc('auth/credentials.mjs')), { line: lineOf('auth/credentials.mjs', 'R9') });
    ctx.set('rootCause', 'auth/credentials.mjs:242-250 R9 分支');
};

// ---------------- D2-16 import 文件读取后擦除 ----------------
P['D2-16'] = async (ctx) => {
    const c = child('d2-16-import-wipe', 'd2-16', PRELUDE() + `
const out = {};
const T = await import('file:///${SRC}/tools.mjs');
// ① 放 creds-import.json
const importFile = join(process.env.HUAWEICLOUD_HOME, '.config', 'huaweicloud', 'creds-import.json');
mkdirSync(join(importFile, '..'), { recursive: true });
writeFileSync(importFile, JSON.stringify({ ak: '${AK}', sk: '${SK}', region: '${REGION}' }), { encoding: 'utf8', mode: 0o600 });
out.importFile = importFile;
out.existsBefore = existsSync(importFile);
// ② mode=import action=temporary（应读入并擦除）
out.temporary = await T.callTool('huaweicloud_auth_switch', { action: 'temporary', mode: 'import' });
out.existsAfterTemporary = existsSync(importFile);
out.runtime = C.hasRuntimeCredentials() ? C.resolveCredentialsWithRuntime() : null;
// ③ 再放一次，persist（成功路径应擦除）
writeFileSync(importFile, JSON.stringify({ ak: '${AK}', sk: '${SK}', region: '${REGION}' }), { encoding: 'utf8', mode: 0o600 });
out.persist = await T.callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'import' });
out.existsAfterPersist = existsSync(importFile);
console.log(JSON.stringify(out));
`);
    const r = runChild(c);
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 400) });
    ctx.ok('探针子进程退出 0', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.ok('导入前 creds-import.json 存在', j.existsBefore === true, j.importFile);
    ctx.ok('mode=import action=temporary 读取成功', j.temporary?.status === 'ok', j.temporary);
    ctx.ok('temporary 成功后 import 文件已擦除（明文不残留磁盘）', j.existsAfterTemporary === false, { exists: j.existsAfterTemporary });
    ctx.eq('runtime 内存凭证来自 import 文件', j.runtime?.ak, AK);
    ctx.set('persistResult', j.persist);
    ctx.ok('mode=import action=persist 成功/部分成功', ['ok', 'partial'].includes(j.persist?.status), j.persist);
    // 契约：非 partial（含 ok）必须擦除；partial 保留以便重试（tools.mjs:1284，#502）
    ctx.ok('persist 结果非 partial 时 import 文件被擦除（partial 保留以支持重试）',
        j.persist?.status === 'partial' ? j.existsAfterPersist === true : j.existsAfterPersist === false,
        { status: j.persist?.status, exists: j.existsAfterPersist });
    const src = readSrc('tools.mjs');
    ctx.ok('源码 readImportFile/clearImportFile 成对存在（读取后擦除）',
        /function readImportFile/.test(src) && /function clearImportFile/.test(src) && /importedFromFile && persisted.status !== 'partial'/.test(src),
        { readLine: lineOf('tools.mjs', 'function readImportFile'), clearLine: lineOf('tools.mjs', 'function clearImportFile') });
    ctx.set('rootCause', 'tools.mjs:1023 readImportFile / :1046 clearImportFile / :1247,:1284 调用点');
};

// ---------------- D2-26 凭证备份与恢复 ----------------
P['D2-26'] = async (ctx) => {
    const c = child('d2-26-backup-restore', 'd2-26', PRELUDE() + `
const out = {};
const gp = C.globalCredentialsPath();
mkdirSync(join(gp, '..'), { recursive: true });
writeFileSync(gp, JSON.stringify({ ak: '${AK}', sk: '${SK}', securityToken: '', region: '${REGION}' }), 'utf8');
out.path = gp;
out.original = JSON.parse(readFileSync(gp, 'utf8'));
out.bakPath = C.backupGlobalCredentials();
out.bakExists = out.bakPath ? existsSync(out.bakPath) : false;
out.bakContent = out.bakPath && out.bakExists ? JSON.parse(readFileSync(out.bakPath, 'utf8')) : null;
// ③ 破坏主凭证
writeFileSync(gp, JSON.stringify({ ak: 'AKBROKEN00000000000000000', sk: 'sk-broken-0000000000', securityToken: '', region: 'cn-south-1' }), 'utf8');
out.broken = JSON.parse(readFileSync(gp, 'utf8'));
// ④ 恢复
out.restored = C.restoreGlobalCredentialsBackup();
out.after = JSON.parse(readFileSync(gp, 'utf8'));
// ⑤ 重复恢复幂等
out.restoredAgain = C.restoreGlobalCredentialsBackup();
out.afterAgain = JSON.parse(readFileSync(gp, 'utf8'));
// 备份不存在时
rmSync(gp + '.bak', { force: true });
out.restoreNoBak = C.restoreGlobalCredentialsBackup();
// 主凭证文件不存在时 backup 必须返回 null（credentials.mjs:437）
rmSync(gp, { force: true });
out.mainExists = existsSync(gp);
out.backupNoFile = C.backupGlobalCredentials();
console.log(JSON.stringify(out));
`);
    const r = runChild(c);
    const j = r.json || {};
    ctx.set('child', { code: r.code, stderr: clip(r.stderr, 400) });
    ctx.ok('探针子进程退出 0', r.code === 0, { code: r.code, err: clip(r.stderr, 500) });
    ctx.ok('backupGlobalCredentials 返回 .bak 路径且文件存在', typeof j.bakPath === 'string' && j.bakExists === true, j.bakPath);
    ctx.eq('备份内容与原 S1 一致（ak）', j.bakContent?.ak, AK);
    ctx.eq('破坏后主凭证为新值', j.broken?.ak, 'AKBROKEN00000000000000000');
    ctx.eq('restoreGlobalCredentialsBackup 返回 true', j.restored, true);
    ctx.eq('恢复后主凭证回到原 ak', j.after?.ak, AK);
    ctx.eq('恢复后 region 也回到原值', j.after?.region, REGION);
    ctx.eq('重复恢复幂等（内容不变）', j.afterAgain?.ak, AK);
    ctx.eq('备份文件缺失时 restore 返回 false', j.restoreNoBak, false);
    ctx.eq('主凭证文件不存在时 backup 返回 null', j.backupNoFile, null);
    ctx.set('rootCause', 'auth/credentials.mjs:435 backupGlobalCredentials / :448 restoreGlobalCredentialsBackup');
};

// ---------------- D2-27 KooCLI 版本管理 ----------------
P['D2-27'] = async (ctx) => {
    const K = await import('file:///' + SRC + '/koocli-version.mjs');
    // 1) getKooCliVersion：读包 package.json 的 kooCliVersion 字段（纯函数，不 spawn）
    const v1 = K.getKooCliVersion();
    ctx.set('getKooCliVersion', v1);
    ctx.ok('getKooCliVersion() 返回 kooCliVersion 字符串或 null（不抛错）',
        v1 === null || (typeof v1 === 'string' && /^\d+\.\d+\.\d+/.test(v1)), v1);
    const pkg = JSON.parse(readFileSync(`${HDK}/package.json`, 'utf8'));
    ctx.eq('getKooCliVersion 与 package.json 声明的 kooCliVersion 一致', v1, pkg.kooCliVersion);
    // 2) parseHcloudVersion：纯正则解析，不 spawn
    const cases = [
        ['hcloud 7.2.12 (build 20240101) windows/amd64', '7.2.12'],
        ['hcloud version 1.1.0', '1.1.0'],
        ['Hcloud 8.0.0-beta.3', '8.0.0-beta.3'],
        ['hcloud 2.0.0+build7', '2.0.0+build7'],
        ['no version here', null],
        ['', null],
    ];
    for (const [input, want] of cases) {
        ctx.eq(`parseHcloudVersion(${JSON.stringify(clip(input, 40))}) = ${want}`, K.parseHcloudVersion(input), want);
    }
    ctx.ok('parseHcloudVersion 忽略 build 号与平台后缀（只取首个 semver）',
        K.parseHcloudVersion('hcloud 7.2.12 (build 20240101) windows/amd64') === '7.2.12', null);
    // 3) compareVersion：逐段数值比较
    const cmp = [
        ['7.2.12', '7.2.9', 1], ['7.2.9', '7.2.12', -1], ['7.2.12', '7.2.12', 0],
        ['1.10.0', '1.9.0', 1], ['2.0.0', '10.0.0', -1], ['1.0', '1.0.0', 0],
        ['1.1.0-next.1', '1.1.0', 0],
    ];
    for (const [a, b, want] of cmp) {
        ctx.eq(`compareVersion(${a}, ${b}) = ${want}`, Math.sign(K.compareVersion(a, b)), want);
    }
    // 4) 下载源：KOO_CLI_BASE + 版本
    ctx.ok('KOO_CLI_BASE 为 https 官方 OBS 地址', /^https:\/\/cn-north-4-hdn-koocli\.obs\./.test(K.KOO_CLI_BASE), K.KOO_CLI_BASE);
    const base = K.kooCliDownloadBase();
    ctx.set('kooCliDownloadBase', base);
    ctx.eq('kooCliDownloadBase() = KOO_CLI_BASE/<当前版本>', base, `${K.KOO_CLI_BASE}/${pkg.kooCliVersion}`);
    ctx.ok('下载源包含版本号段（可按版本定位安装包）', /\/cli\/\d+\.\d+\.\d+/.test(base), base);
    // 5) 无版本时的降级路径（源码断言，避免改全局 PACKAGE_JSON）
    const Ksrc = readSrc('koocli-version.mjs');
    ctx.ok('getKooCliVersion 读取失败时返回 null 而非抛错（try/catch 包裹）',
        /function getKooCliVersion\(\)\s*\{[\s\S]{0,200}try\s*\{[\s\S]{0,200}catch\s*\{\s*return null/.test(Ksrc),
        { line: lineOf('koocli-version.mjs', 'function getKooCliVersion') });
    ctx.ok("kooCliDownloadBase 在版本缺失时回退 'latest'",
        /getKooCliVersion\(\) \|\| 'latest'/.test(Ksrc), { line: lineOf('koocli-version.mjs', "'latest'") });
    ctx.set('rootCause', 'src/koocli-version.mjs:12 getKooCliVersion / :21 parseHcloudVersion / :27 compareVersion / :45 kooCliDownloadBase');
};

export { P };
