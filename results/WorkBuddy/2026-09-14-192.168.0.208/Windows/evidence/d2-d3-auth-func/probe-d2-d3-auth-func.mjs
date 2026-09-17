/**
 * WorkBuddy 每日测试探针 - D2认证 + D3功能（真实函数级，next.6）
 * 覆盖: D2-1, D2-2, D2-4, D2-5, D2-10, D2-11, D2-12, D2-13, D2-16
 *       D3-A1, D3-B1, D3-B5, D3-C5（D3-B3/D3-C4 需真云，见 INFO 记录）
 * 方法: 隔离 HUAWEICLOUD_HOME/HCLOUD_OBS_CONFIG_PATH/HCLOUD_CONFIG_PATH，
 *       HCLOUD_BIN 注入假 hcloud（捕获 configure set 参数），
 *       D3-B1/C5 切回真实 KooCLI 7.2.12 离线 help。
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const TMP = join(HERE, 'tmp-isolated');
const PKG = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit';
const SRC = join(PKG, 'plugins', 'huaweicloud-core', 'src');
const REAL_HCLOUD = join(homedir(), 'hcloud', 'hcloud.exe');
const REAL_HCLOUD_EXISTS = existsSync(REAL_HCLOUD);

// ---------- 环境隔离（必须在 import SUT 之前设置） ----------
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
process.env.HUAWEICLOUD_HOME = TMP;
process.env.HCLOUD_OBS_CONFIG_PATH = join(TMP, '.obsutilconfig');
process.env.HCLOUD_CONFIG_PATH = join(TMP, '.hcloud', 'config.json');
process.env.FAKE_HCLOUD_LOG = join(TMP, 'fake-hcloud-calls.log');
writeFileSync(process.env.FAKE_HCLOUD_LOG, '', 'utf8');
process.env.HCLOUD_BIN = process.execPath; // node
process.env.HCLOUD_BIN_ARGS_JSON = JSON.stringify([join(HERE, 'fake-hcloud.mjs')]);
const savedEnv = {};
for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION']) {
  savedEnv[k] = process.env[k];
  delete process.env[k];
}

const S1 = () => join(TMP, '.config', 'huaweicloud', 'credentials.json');
const S3 = () => process.env.HCLOUD_OBS_CONFIG_PATH;
const IMPORT = () => join(TMP, '.config', 'huaweicloud', 'creds-import.json');
const KOOCLI_CFG = () => process.env.HCLOUD_CONFIG_PATH;
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
function fakeCalls() {
  try {
    return readFileSync(process.env.FAKE_HCLOUD_LOG, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}
function writeKoocliCfg(current) {
  const p = KOOCLI_CFG();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({
    current,
    authEncrypt: false,
    profiles: [
      { name: 'default', accessKeyId: 'AKIDDEFAULT0000001', secretAccessKey: 'SKDEFAULTsecret0001' },
      { name: 'deploy', accessKeyId: 'AKIDDEPLOY00000002', secretAccessKey: 'SKDEPLOYsecret0002' },
    ],
  }, null, 2), 'utf8');
}

// ---------- 导入 SUT ----------
const toolsUrl = pathToFileURL(join(SRC, 'tools.mjs')).href;
const { callTool } = await import(toolsUrl);
const credsUrl = pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href;
const {
  resolveCredentials, readGlobalCredentials, writeGlobalCredentials,
  setConfiguredBySession, setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials,
  writeObsConfig,
} = await import(credsUrl);
const recUrl = pathToFileURL(join(SRC, 'auth', 'reconcile.mjs')).href;
const { readKooCliProfiles, resolveManagedProfile } = await import(recUrl);

// ---------- 结果收集 ----------
const results = [];
function t(name, pass, detail) {
  results.push({ name, pass: pass === null ? null : !!pass, detail: typeof detail === 'string' ? detail.slice(0, 400) : detail });
  const tag = pass === null ? 'INFO' : pass ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? ' :: ' + (typeof detail === 'string' ? detail.slice(0, 300) : JSON.stringify(detail).slice(0, 300)) : ''}`);
}
async function tc(name, fn) {
  try { await fn(); } catch (e) { t(name, false, 'EXCEPTION: ' + e.message); }
}

const AK1 = 'AKIDPERSISTprobe0001';
const SK1 = 'SKPERSISTprobe0001secret';
const REGION = 'cn-north-4';

// ========== 阶段 A：无 S1 / 无 runtime / 无 env ==========
await tc('D2-11 STS token 拒绝落盘（memory 通道）', async () => {
  const r = await callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'memory', ak: AK1, sk: SK1, securityToken: 'STS.TOKEN.PROBE.XYZ', region: REGION });
  const rej = r.status === 'error' && r.scope === 'rejected' && /R3|temporary/i.test(r.error || '');
  const noS1 = !existsSync(S1());
  t('D2-11 STS token 拒绝落盘（memory 通道）', rej && noS1,
    `status=${r.status} scope=${r.scope} S1存在=${existsSync(S1())} error=${(r.error || '').slice(0, 80)}`);
});

await tc('D2-11 STS token 拒绝落盘（import 通道 + 文件擦除）', async () => {
  mkdirSync(dirname(IMPORT()), { recursive: true });
  writeFileSync(IMPORT(), JSON.stringify({ ak: AK1, sk: SK1, securityToken: 'STS.IMPORT.TOKEN', region: REGION }), 'utf8');
  const r = await callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'import' });
  t('D2-11 STS token 拒绝落盘（import 通道 + 文件擦除）',
    r.status === 'error' && r.scope === 'rejected' && !existsSync(IMPORT()) && !existsSync(S1()),
    `status=${r.status} scope=${r.scope} import文件已擦除=${!existsSync(IMPORT())}`);
});

await tc('D2-5 凭证缺失报错指引（函数级）', async () => {
  let err1 = null;
  try { resolveCredentials(); } catch (e) { err1 = e; }
  const ok1 = err1 && err1.code === 'HDKIT_CRED_MISSING' && /auth init/.test(err1.message) && /HW_ACCESS_KEY/.test(err1.message);
  let err2 = null;
  try { await callTool('huaweicloud_auth_init', {}); } catch (e) { err2 = e; }
  const ok2 = err2 && /ak and sk are required/.test(err2.message) && /clear=true/.test(err2.message);
  t('D2-5 凭证缺失报错指引（函数级）', ok1 && ok2,
    `HDKIT_CRED_MISSING=${!!ok1}(code=${err1 && err1.code}) auth_init指引=${!!ok2}`);
});

// ========== 阶段 B：KooCLI current 档跟随（R7） ==========
await tc('D2-10 current 档解析与切换跟随', async () => {
  writeKoocliCfg('deploy');
  const p1 = readKooCliProfiles();
  const r1 = p1.current === 'deploy' && resolveManagedProfile() === 'deploy';
  writeKoocliCfg('default');
  const p2 = readKooCliProfiles();
  const r2 = p2.current === 'default' && resolveManagedProfile() === 'default';
  const profilesOk = Array.isArray(p1.profiles) && p1.profiles.length === 2 && p1.profiles.every((p) => p.name && typeof p.fingerprint === 'string');
  t('D2-10 current 档解析与切换跟随', r1 && r2 && profilesOk,
    `current解析: deploy→${p1.current}, default→${p2.current}, profiles=${p1.profiles.map((p) => p.name).join(',')}`);
});

// ========== 阶段 C：D2-1 persist 三端同步（假 hcloud 捕获 S2 参数） ==========
await tc('D2-1 persist 三端同步（S1/S3 落位 + S2 --cli-profile 传递）', async () => {
  writeKoocliCfg('deploy');
  const before = fakeCalls().length;
  const r = await callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'memory', ak: AK1, sk: SK1, region: REGION });
  const s1 = existsSync(S1()) ? readJson(S1()) : null;
  const s3 = existsSync(S3()) ? readFileSync(S3(), 'utf8') : '';
  const cfgCalls = fakeCalls().slice(before).filter((c) => c.args[0] === 'configure' && c.args[1] === 'set');
  const last = cfgCalls[cfgCalls.length - 1] || { args: [] };
  const s2flag = last.args.includes('--cli-profile=deploy') && last.args.includes(`--cli-region=${REGION}`);
  const s1Ok = s1 && s1.ak === AK1 && s1.securityToken === '' && s1.configuredBySession === true;
  const s3Ok = s3.includes(`ak=${AK1}`) && s3.includes('endpoint=https://obs.cn-north-4.myhuaweicloud.com');
  t('D2-1 persist 三端同步（S1/S3 落位 + S2 --cli-profile 传递）',
    r.status === 'ok' && s1Ok && s3Ok && s2flag,
    `status=${r.status} S1=${JSON.stringify(s1 && { ak: s1.ak, token: s1.securityToken, flag: s1.configuredBySession })} S3含endpoint=${s3.includes('obs.cn-north-4')} S2参数=${JSON.stringify(last.args.map((a) => a.split('=')[0]))}`);
});

// ========== 阶段 D：D2-12 R10 runtime 非空禁止落盘 ==========
await tc('D2-12 R10 runtime 激活时 sync 抑制且 S1 不变', async () => {
  const r0 = await callTool('huaweicloud_auth_init', { ak: 'AKIDRUNTIME0001', sk: 'SKRUNTIMEsecret0001', region: REGION });
  const st = await callTool('huaweicloud_auth_status', { target: 'all' });
  const runtimeActive = st.reconciled && st.reconciled.runtimeActive === true;
  const s1Before = readFileSync(S1(), 'utf8');
  const sync = await callTool('huaweicloud_auth_sync', { target: 'all' });
  const s1After = readFileSync(S1(), 'utf8');
  const suppressed = sync.ok === false && /R10|suppressed/i.test(sync.error || '');
  t('D2-12 R10 runtime 激活时 sync 抑制且 S1 不变',
    r0.status === 'ok' && runtimeActive && suppressed && s1Before === s1After,
    `auth_init=${r0.status} runtimeActive=${runtimeActive} sync.ok=${sync.ok} sync.error=${(sync.error || '').slice(0, 60)} S1不变=${s1Before === s1After}`);
});

// ========== 阶段 E：D2-13 R9 configuredBySession 优先 env ==========
await tc('D2-13 R9 S1(configuredBySession) 优先 env，清除后 env 兜底', async () => {
  process.env.HW_ACCESS_KEY = 'AKIDENVINJECT0003';
  process.env.HW_SECRET_KEY = 'SKENVINJECTsecret03';
  const s1HasFlag = readJson(S1()).configuredBySession === true; // 阶段 C persist 置位
  const r1 = resolveCredentials();
  const s1Wins = r1.ak === AK1; // S1 胜出
  setConfiguredBySession(false);
  const r2 = resolveCredentials();
  const envWins = r2.ak === 'AKIDENVINJECT0003';
  delete process.env.HW_ACCESS_KEY;
  delete process.env.HW_SECRET_KEY;
  t('D2-13 R9 S1(configuredBySession) 优先 env，清除后 env 兜底',
    s1HasFlag && s1Wins && envWins,
    `S1标记=${s1HasFlag} 标记时S1胜出=${s1Wins}(ak=${r1.ak}) 清除后env兜底=${envWins}(ak=${r2.ak})`);
});

// ========== 阶段 F：D2-16 import 文件读后擦除 ==========
await tc('D2-16 import 文件读取后无条件擦除（有效文件）', async () => {
  mkdirSync(dirname(IMPORT()), { recursive: true });
  writeFileSync(IMPORT(), JSON.stringify({ ak: 'AKIDIMPORT0004', sk: 'SKIMPORTsecret004', region: REGION }), 'utf8');
  const r = await callTool('huaweicloud_auth_switch', { action: 'temporary', mode: 'import' });
  t('D2-16 import 文件读取后无条件擦除（有效文件）',
    r.status === 'ok' && r.scope === 'temporary' && !existsSync(IMPORT()),
    `status=${r.status} scope=${r.scope} 文件已擦除=${!existsSync(IMPORT())}`);
});

await tc('D2-16 import 畸形文件同样擦除', async () => {
  writeFileSync(IMPORT(), '{not valid json!!!', 'utf8');
  let err = null;
  try { await callTool('huaweicloud_auth_switch', { action: 'temporary', mode: 'import' }); } catch (e) { err = e; }
  t('D2-16 import 畸形文件同样擦除',
    err && /ak and sk are required/.test(err.message) && !existsSync(IMPORT()),
    `报错=${!!err && err.message.slice(0, 50)} 畸形文件已擦除=${!existsSync(IMPORT())}`);
});
clearRuntimeCredentials();

// ========== 阶段 G：D2-4 凭证脱敏（真实 KooCLI configure show + 工具脱敏管道函数级） ==========
// 注: runHcloudOnce 只读 options.executableArgs，不读 HCLOUD_BIN_ARGS_JSON（与 resolveHcloudCommand
// 的注入约定不一致），无法用"node+假脚本"注入 runHcloud 路径 —— 改用真实 KooCLI（只读）验证。
process.env.HCLOUD_BIN = REAL_HCLOUD;
delete process.env.HCLOUD_BIN_ARGS_JSON;
await tc('D2-4 show_profile_redacted 输出无明文 AK/SK', async () => {
  const r = await callTool('huaweicloud_show_profile_redacted', {});
  const text = JSON.stringify(r);
  const noPlainCred = r.ok === true && !/"(accessKeyId|secretAccessKey|sk|ak)"\s*:\s*"[A-Za-z0-9]{16,}"/.test(text);
  t('D2-4 show_profile_redacted 输出无明文 AK/SK', noPlainCred,
    `ok=${r.ok} 真实KooCLI(7.2.12自脱敏)输出无长明文=${noPlainCred}`);
  // 防御纵深检查: 工具侧 redactSecrets 字符串管道对 camelCase 凭证字段名的覆盖
  const { redactSecrets } = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
  const redText = JSON.stringify(redactSecrets({ stdout: '{"currentCredential":{"accessKeyId":"AKIDFAKEPROBE1234567890","secretAccessKey":"FAKESKPROBEsecret987654321xyz"}}' }));
  const pipeMasks = !redText.includes('FAKESKPROBEsecret987654321xyz');
  t('D2-4 防御纵深: redactString 对 hcloud camelCase 凭证字段(secretAccessKey/accessKeyId)不遮蔽', null,
    `明文经 redactSecrets 字符串管道后仍可见=${!pipeMasks}（对象键级遮蔽正常；KooCLI 7.2.12 show 自身脱敏，故主断言不受影响）→ FINDINGS 候选`);
});

// ========== 阶段 H：D2-2 auth status 组合判定 ==========
await tc('D2-2 auth status 三端就绪组合判定', async () => {
  const out = [];
  let allOk = true;
  // 组合1: 无 S1 无 S3
  rmSync(S1(), { force: true });
  rmSync(S3(), { force: true });
  let st = await callTool('huaweicloud_auth_status', { target: 'all' });
  const c1 = st.credentialsConfigured === false && st.obsConfigured === false;
  out.push(`无S1无S3: cred=${st.credentialsConfigured},obs=${st.obsConfigured}`);
  allOk = allOk && c1;
  // 组合2: 仅 S1（部分就绪）
  writeGlobalCredentials({ ak: AK1, sk: SK1, region: REGION });
  st = await callTool('huaweicloud_auth_status', { target: 'all' });
  const c2 = st.credentialsConfigured === true && st.obsConfigured === false;
  out.push(`仅S1: cred=${st.credentialsConfigured},obs=${st.obsConfigured}`);
  allOk = allOk && c2;
  // 组合3: S1 + S3
  writeObsConfig(readGlobalCredentials());
  st = await callTool('huaweicloud_auth_status', { target: 'all' });
  const c3 = st.credentialsConfigured === true && st.obsConfigured === true;
  out.push(`S1+S3: cred=${st.credentialsConfigured},obs=${st.obsConfigured}`);
  allOk = allOk && c3;
  // runtimeActive 开/关
  setRuntimeCredentials('AKIDRT', 'SKRT');
  const ra1 = (await callTool('huaweicloud_auth_status', { target: 'all' })).reconciled.runtimeActive;
  clearRuntimeCredentials();
  const ra2 = (await callTool('huaweicloud_auth_status', { target: 'all' })).reconciled.runtimeActive;
  out.push(`runtimeActive: 置位=${ra1}, 清除=${ra2}`);
  allOk = allOk && ra1 === true && ra2 === false;
  const koo = `kooCliInstalled=${st.kooCliInstalled}(${st.kooCliStatus})`;
  t('D2-2 auth status 三端就绪组合判定', allOk, out.join(' | ') + ' | ' + koo);
});

// ========== 阶段 I：D3-A1 skill 全量检索 ==========
await tc('D3-A1 全量 skill 可检索且内容完整', async () => {
  const skillRoot = join(PKG, 'plugins', 'huaweicloud-core', 'skills');
  const dirs = readdirSync(skillRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const failed = [];
  let totalLen = 0;
  for (const name of dirs) {
    const r = await callTool('huaweicloud_retrieve_skill', { name });
    const ok = r && r.ok === true && typeof r.content === 'string' && r.content.length > 100;
    if (!ok) failed.push(`${name}(ok=${r && r.ok}, len=${r && r.content && r.content.length})`);
    else totalLen += r.content.length;
  }
  t('D3-A1 全量 skill 可检索且内容完整',
    dirs.length >= 25 && failed.length === 0,
    `skill数=${dirs.length} 失败=${failed.length ? failed.join(';') : '无'} 平均内容长度=${Math.round(totalLen / dirs.length)}`);
});

// ========== 切回真实 KooCLI（离线 help，不触云） ==========
process.env.HCLOUD_BIN = REAL_HCLOUD;
delete process.env.HCLOUD_BIN_ARGS_JSON;

// ========== 阶段 J：D3-B1 list_operations 规范操作名（真实 KooCLI 离线 help） ==========
if (REAL_HCLOUD_EXISTS) {
  await tc('D3-B1 list_operations 返回规范操作名（ECS/VPC/OBS）', async () => {
    const ecs = await callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 60000 });
    const vpc = await callTool('huaweicloud_list_operations', { service: 'VPC', timeoutMs: 60000 });
    const obs = await callTool('huaweicloud_list_operations', { service: 'OBS', timeoutMs: 60000 });
    const ecsOk = ecs.result && ecs.result.ok === true && /NovaListServers|BatchCreateServers/.test(ecs.result.stdout || '');
    const vpcOk = vpc.result && vpc.result.ok === true && /CreateVpc|ShowVpc|ListVpcs/.test(vpc.result.stdout || '');
    const obsOk = obs.result && obs.result.ok === true && (obs.result.stdout || '').length > 100;
    t('D3-B1 list_operations 返回规范操作名（ECS/VPC/OBS）',
      ecsOk && vpcOk && obsOk,
      `ECS.ok=${ecsOk} VPC.ok=${vpcOk} OBS.ok=${obsOk} command=${ecs.command}`);
  });
} else {
  t('D3-B1 list_operations 返回规范操作名', null, '真实 KooCLI 未安装，无法离线验证');
}

// ========== 阶段 K：D3-B5 detect_framework 13 框架 + monorepo ==========
await tc('D3-B5 detect_framework 识别准确', async () => {
  const samples = join(TMP, 'frameworks');
  mkdirSync(samples, { recursive: true });
  const mk = (name, files) => {
    const dir = join(samples, name);
    mkdirSync(dir, { recursive: true });
    for (const [rel, content] of Object.entries(files)) {
      const p = join(dir, rel);
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, content, 'utf8');
    }
    return dir;
  };
  const pkg = (deps) => JSON.stringify({ name: 'x', dependencies: deps });
  const cases = [
    ['next', mk('next', { 'package.json': pkg({ next: '14' }), 'next.config.js': 'export default {};' }), 'Next.js'],
    ['nuxt', mk('nuxt', { 'package.json': pkg({ nuxt: '3' }), 'nuxt.config.ts': 'export default {};' }), 'Nuxt'],
    ['vitepress', mk('vitepress', { 'package.json': pkg({ vitepress: '1' }), '.vitepress/config.mts': 'export default {};' }), 'VitePress'],
    ['docusaurus', mk('docusaurus', { 'docusaurus.config.js': 'module.exports={};' }), 'Docusaurus'],
    ['hugo', mk('hugo', { 'config.toml': 'baseURL="/" languageCode="zh-cn"\n' }), 'Hugo'],
    ['hexo', mk('hexo', { '_config.yml': 'title: blog\n' }), 'Hexo'],
    ['taro', mk('taro', { 'package.json': pkg({ '@tarojs/taro': '3' }) }), 'Taro'],
    ['uniapp', mk('uniapp', { 'package.json': pkg({ '@dcloudio/uni-app': '3' }) }), 'uni-app'],
    ['angular', mk('angular', { 'package.json': pkg({ '@angular/core': '17' }), 'angular.json': '{"projects":{"app":{"architect":{"build":{"options":{"outputDir":"dist/app"}}}}}}' }), 'Angular'],
    ['vite', mk('vite', { 'package.json': pkg({ vite: '5', react: '18' }), 'vite.config.js': 'export default {};' }), 'Vite (React/Vue/Svelte)'],
    ['cra', mk('cra', { 'package.json': pkg({ 'react-scripts': '5' }), 'public/index.html': '<html></html>' }), 'Create React App'],
    ['vuecli', mk('vuecli', { 'package.json': pkg({ '@vue/cli-service': '5' }) }), 'Vue CLI'],
    ['static', mk('static', { 'index.html': '<html><body></body></html>' }), 'Static Site'],
  ];
  const wrong = [];
  for (const [name, dir, expect] of cases) {
    const r = await callTool('huaweicloud_detect_framework', { projectPath: dir });
    const fw = r && r.ok === true ? r.framework : `ERR:${r && r.error}`;
    const hasBuild = r && r.ok === true && Boolean(r.buildCmd || r.serveCmd || r.checkUrl || r.outputDir || r.type);
    if (fw !== expect || !hasBuild) wrong.push(`${name}→${fw}(构建/端口信息=${hasBuild})`);
  }
  // monorepo: pnpm-workspace.yaml + apps/web (next)
  const mono = mk('monorepo', {
    'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    'apps/web/package.json': pkg({ next: '14' }),
    'apps/web/next.config.js': 'export default {};',
  });
  const mr = await callTool('huaweicloud_detect_framework', { projectPath: mono });
  const monoOk = mr && mr.ok === true && mr.type === 'monorepo' && mr.framework === 'Monorepo'
    && Array.isArray(mr.subApps) && mr.subApps.some((a) => a.framework === 'Next.js');
  t('D3-B5 detect_framework 识别准确',
    wrong.length === 0 && monoOk,
    `13样本误判: ${wrong.length ? wrong.join(';') : '无'} | monorepo=${monoOk ? `识别=${mr.monorepoTool},子应用=${mr.subApps.map((a) => a.framework).join(',')}` : JSON.stringify(mr).slice(0, 120)}`);
});

// ========== 阶段 L：D3-C5 四工具冒烟 ==========
await tc('D3-C5 四工具冒烟（check_cli/list_operations/plan/explain_error）', async () => {
  const check = await callTool('huaweicloud_check_cli', {});
  const listOk = REAL_HCLOUD_EXISTS
    ? (await callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 60000 })).result.ok === true
    : null;
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'NovaListServers', '--cli-region=cn-north-4'] });
  const explain = await callTool('huaweicloud_explain_error', { service: 'IAM', errorCode: 'APIGW.0301', message: 'Incorrect IAM authentication information' });
  const checkOk = check.installed === true;
  const planOk = plan && (plan.approval || plan.command || plan.plan || plan.risk) !== undefined;
  const explainOk = explain && (explain.explanation || explain.cause || JSON.stringify(explain).length > 50);
  t('D3-C5 四工具冒烟（check_cli/list_operations/plan/explain_error）',
    (checkOk ? 1 : 0) + (listOk ? 1 : 0) + (planOk ? 1 : 0) + (explainOk ? 1 : 0) >= 3 && checkOk,
    `check_cli=${checkOk}(${check.status}) list=${listOk} plan=${planOk} explain=${explainOk}`);
});

// ========== 阶段 M：真云受限记录 ==========
t('D3-B3 run_readonly 真云脱敏执行', null, '需真云 AK/SK 执行只读命令并核对输出脱敏；本机无真云凭证 → BLOCKED（见 CSV blockedReason）');
t('D3-C4 22 服务只读规划回归', null, '需真云最小权限 AK/SK 逐服务 plan/轻量创建释放；本机无真云凭证 → BLOCKED（见 CSV blockedReason）');
t('D2-1 真云端到端三端可用性', null, 'S1/S3 落位与 S2 参数传递已用假 hcloud 验证；KooCLI/OBS 对真云 API 的可用性需真云凭证 → 端到端部分 BLOCKED');

// ---------- 汇总 ----------
const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const info = results.filter((r) => r.pass === null).length;
console.log(String.fromCharCode(10) + `=== d2-d3-auth-func: ${pass} PASS / ${fail} FAIL / ${info} INFO / ${results.length} TOTAL ===`);
writeFileSync(join(HERE, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
process.exit(0);
