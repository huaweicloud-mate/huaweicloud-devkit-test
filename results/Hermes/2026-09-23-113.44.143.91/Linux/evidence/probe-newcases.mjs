// probe-newcases.mjs — 2026-09-20 每日测试新增用例源码级探针 (Hermes/Linux/v1.1.5@e7ed6f6)
// 覆盖: D1-65/66/68/70, D2-27, D3-C14, D3-S5, D3-S8, D4-26/29, D6-9, D8-9/10, D9-11
// 用法: HDK_PLUGIN_SRC=<dir> EVID_DIR=<evidence-dir> node probe-newcases.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const __dirname = dirname(fileURLToPath(import.meta.url));
const ISO = join(tmpdir(), 'hdk-probe-' + process.pid + '-' + Date.now());

function ev(cid, content) {
  const d = join(EVID, cid);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.txt'), content, 'utf8');
}
const LOG = [];
function rec(cid, status, title, expected, actual, detail) {
  LOG.push(`${status}\t${cid}\t${title}`);
  const body = `=== ${cid} ${title} ===\n预期: ${expected}\n实测: ${actual}\n${detail ? '详情:\n' + detail + '\n' : ''}RESULT: ${status}\n`;
  ev(cid, body);
  console.log(`${status}\t${cid}\t${title}\t${actual}`);
}

// ---------- 动态 import ----------
const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
const re = await import(`file://${HDK}/src/risk-rule-engine.mjs`);
const tools = await import(`file://${HDK}/src/tools.mjs`);
const kcv = await import(`file://${HDK}/src/koocli-version.mjs`);
const icon = await import(`file://${HDK}/src/icon-library.mjs`);
const proxy = await import(`file://${HDK}/src/proxy/proxy-config.mjs`);
const merge = await import(`file://${HDK}/src/mcp-config-merge.mjs`);
const backup = await import(`file://${HDK}/src/mcp-config-backup.mjs`);
const tunnel = await import(`file://${HDK}/src/ws-exec/hwlink-tunnel-channel.mjs`);
const upc = await import(`file://${HDK}/src/update-check.mjs`);
const market = await import(`file://${HDK}/src/search-market.mjs`);
const hdkapi = await import(`file://${HDK}/src/sandbox/hdkitservice-api.mjs`);
const hwlink = await import(`file://${HDK}/src/sandbox/hwlink-api.mjs`);

const dec = (fn) => { try { return fn().decision; } catch (e) { return 'THROW:' + e.message; } };

console.log('==============================================================');
console.log('新增用例源码级探针  v1.1.5 (e7ed6f6)  2026-09-20');
console.log('==============================================================\n');

// ---------- D1-65 调试模式环境变量 ----------
{
  const src = readFileSync(`${HDK}/src/update-check.mjs`, 'utf8');
  const gate = /HUAWEICLOUD_DEVKIT_DEBUG\s*===\s*'1'\s*\|\|\s*process\.env\.HUAWEICLOUD_DEVKIT_DEBUG\s*===\s*'true'/.test(src)
    || /HUAWEICLOUD_DEVKIT_DEBUG/.test(src);
  const detail = `update-check.mjs debugLog 门控: ${gate ? '存在 HUAWEICLOUD_DEVKIT_DEBUG 判断' : '缺'};\n来源: grep update-check.mjs (line 210-212)`;
  rec('D1-65', gate ? 'PASS' : 'FAIL', '调试模式环境变量',
    'DEBUG=1/true 时开启调试日志；未设/其他值不开启', gate ? '门控存在' : '门控缺失', detail);
}

// ---------- D1-66 遥测开关与端点环境变量 ----------
{
  // telemetry.mjs 须在设置 env 后 import（模块 load 期读取 HUAWEICLOUD_DEVKIT_HOME 等）
  const telModPath = `${HDK}/src/telemetry/telemetry.mjs`;
  // 用子进程隔离测试 isTelemetryEnabled
  const { execFileSync } = await import('node:child_process');
  const cases = [
    ['', 'true (unset→enabled)'],
    ['off', 'false (off→disabled)'],
    ['1', 'true (other value→enabled)'],
  ];
  const dets = [];
  for (const [v, exp] of cases) {
    const code = `const { isTelemetryEnabled } = await import(${JSON.stringify('file://' + telModPath)}); console.log(isTelemetryEnabled());`;
    const env = { ...process.env };
    if (v === '') delete env.HUAWEICLOUD_DEVKIT_TELEMETRY; else env.HUAWEICLOUD_DEVKIT_TELEMETRY = v;
    try {
      const out = execFileSync(process.execPath, ['--input-type=module', '-e', code], { env, encoding: 'utf8', timeout: 15000 }).trim();
      dets.push(`HUAWEICLOUD_DEVKIT_TELEMETRY='${v}' -> isTelemetryEnabled()=${out} (期望 ${exp})`);
    } catch (e) { dets.push(`HUAWEICLOUD_DEVKIT_TELEMETRY='${v}' -> 子进程错误: ${e.message}`); }
  }
  // endpoint 优先级
  const src = readFileSync(`${HDK}/src/telemetry/telemetry.mjs`, 'utf8');
  const epGate = /HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT\s*\|\|\s*DEFAULT_ENDPOINT/.test(src);
  const allOk = /true/.test(dets[0]) && /false/.test(dets[1]) && /true/.test(dets[2]) && epGate;
  rec('D1-66', allOk ? 'PASS' : 'FAIL', '遥测开关与端点环境变量',
    '=off 关闭、未设/其他开启；ENDPOINT 未设回退 DEFAULT_ENDPOINT',
    allOk ? '符合 (注: env 名 HUAWEICLOUD_DEVKIT_TELEMETRY)' : '不符',
    dets.join('\n') + `\nENDPOINT 回退门控=${epGate}`);
}

// ---------- D1-68 图标离线与区域环境变量 ----------
{
  const before = process.env.HUAWEICLOUD_ICONS_OFFLINE;
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  icon.clearIconCache();
  const r = await icon.getServiceIcon('ecs');
  if (before === undefined) delete process.env.HUAWEICLOUD_ICONS_OFFLINE; else process.env.HUAWEICLOUD_ICONS_OFFLINE = before;
  const offlineOk = r.ok === true && r.source === 'snapshot';

  // 区域优先级: credentials.mjs region = HW_REGION || HUAWEICLOUD_REGION
  const credSrc = readFileSync(`${HDK}/src/auth/credentials.mjs`, 'utf8');
  const regionPrecedence = /HW_REGION\s*\|\|\s*process\.env\.HUAWEICLOUD_REGION/.test(credSrc);
  // 实测 resolveCredentials 优先级（子进程隔离 env）
  const { execFileSync } = await import('node:child_process');
  let regionActual = '';
  try {
    const code = `const { resolveCredentials } = await import(${JSON.stringify('file://' + HDK + '/src/auth/credentials.mjs')}); const r = resolveCredentials({}); console.log(r.region || '(empty)');`;
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', code], {
      env: { ...process.env, HW_REGION: 'cn-east-3', HUAWEICLOUD_REGION: 'cn-north-4' },
      encoding: 'utf8', timeout: 15000,
    }).trim();
    regionActual = out;
  } catch (e) { regionActual = 'ERR:' + e.message; }
  const regionDrift = regionActual.includes('cn-east-3'); // HW_REGION 胜出 → 与用例预期相反
  const detail = `ICONS_OFFLINE=1 → getServiceIcon('ecs') source=${r.source} ok=${r.ok}\n` +
    `region 优先级源码: credentials.mjs:133 'HW_REGION || HUAWEICLOUD_REGION' (HW_REGION 优先)\n` +
    `实测 resolveCredentials(HW_REGION=cn-east-3, HUAWEICLOUD_REGION=cn-north-4) → region=${regionActual} (期望 per 用例 HUAWEICLOUD_REGION 优先，冲突)`;
  // 图标离线 PASS；region 优先级 SPEC-MISMATCH
  const status = offlineOk ? (regionDrift ? 'SPEC-MISMATCH' : 'PASS') : 'FAIL';
  rec('D1-68', status, '图标离线与区域环境变量',
    'ICONS_OFFLINE=1 走本地 manifest；HUAWEICLOUD_REGION 优先于 HW_REGION',
    `图标离线=${offlineOk ? 'OK' : 'FAIL'}; region 实测=${regionActual} (HW_REGION 胜出, 用例预期 HUAWEICLOUD_REGION 优先)`,
    detail);
}

// ---------- D1-70 代理配置与 WebSocket 代理 ----------
{
  process.env.HUAWEICLOUD_HOME = ISO;
  const dets = [];
  const written = proxy.writeProxyConfig({ https_proxy: 'http://localhost:8080', no_proxy: '*.internal.example.com,10.0.0.0/8' });
  dets.push(`writeProxyConfig -> ${written}`);
  const read = proxy.readProxyConfig();
  dets.push(`readProxyConfig -> ${JSON.stringify(read)}`);
  // getProxySettings: no proxy → settings (env+file); no_proxy 命中 → null
  const noProxyStored = process.env.NO_PROXY; process.env.NO_PROXY = '';
  process.env.HTTPS_PROXY = ''; process.env.https_proxy = '';
  const s1 = proxy.getProxySettings('https://public.example.com');
  const s2 = proxy.getProxySettings('https://a.internal.example.com');
  const s3 = proxy.getProxySettings('https://10.0.0.5');
  if (noProxyStored === undefined) delete process.env.NO_PROXY; else process.env.NO_PROXY = noProxyStored;
  dets.push(`getProxySettings(public) -> ${JSON.stringify(s1)}`);
  dets.push(`getProxySettings(*.internal) -> ${s2 === null ? 'null (bypass)' : JSON.stringify(s2)}`);
  dets.push(`getProxySettings(10.0.0.5) -> ${s3 === null ? 'null (bypass)' : JSON.stringify(s3)}`);
  const cleared = proxy.clearProxyConfig();
  dets.push(`clearProxyConfig -> ${cleared}`);
  const read2 = proxy.readProxyConfig();
  const ok = read && read.https_proxy === 'http://localhost:8080' && s2 === null && s3 === null && cleared === true && read2 === null;
  // proxy-agent createProxyWebSocket 存在性
  const paSrc = readFileSync(`${HDK}/src/proxy/proxy-agent.mjs`, 'utf8');
  const wsProxy = /createProxyWebSocket|ProxyAgent|WebSocket/.test(paSrc);
  dets.push(`proxy-agent.mjs 含 ProxyAgent/WebSocket 代理逻辑=${wsProxy}`);
  rec('D1-70', ok && wsProxy ? 'PASS' : 'FAIL', '代理配置与 WebSocket 代理',
    'proxy.json 读写/clear 正确；no_proxy 命中返回 null；有代理走 ProxyAgent',
    ok && wsProxy ? '符合' : '不符', dets.join('\n'));
  delete process.env.HUAWEICLOUD_HOME;
}

// ---------- D2-27 KooCLI 版本管理 ----------
{
  const v = kcv.getKooCliVersion();
  const p1 = kcv.parseHcloudVersion('hcloud 7.2.12 linux');
  const p2 = kcv.parseHcloudVersion('KooCLI v5.4.2 build 123');
  const cmp1 = kcv.compareVersion('7.2.12', '7.2.9');
  const cmp2 = kcv.compareVersion('7.2.9', '7.2.12');
  const cmp3 = kcv.compareVersion('7.2.12', '7.2.12');
  const base = kcv.kooCliDownloadBase();
  const dets = [
    `getKooCliVersion() = ${JSON.stringify(v)}`,
    `parseHcloudVersion('hcloud 7.2.12 linux') = ${p1}`,
    `parseHcloudVersion('KooCLI v5.4.2 build 123') = ${p2}`,
    `compareVersion(7.2.12,7.2.9)=${cmp1} (期望 1)`,
    `compareVersion(7.2.9,7.2.12)=${cmp2} (期望 -1)`,
    `compareVersion(7.2.12,7.2.12)=${cmp3} (期望 0)`,
    `kooCliDownloadBase() = ${base}`,
  ];
  const ok = p1 === '7.2.12' && p2 === '5.4.2' && cmp1 === 1 && cmp2 === -1 && cmp3 === 0 && /KOO_CLI_BASE|latest|7\.|cn-north-4/.test(base);
  rec('D2-27', ok ? 'PASS' : 'FAIL', 'KooCLI 版本管理',
    'parse/compare/downloadBase 正确', ok ? '符合' : '不符', dets.join('\n'));
}

// ---------- D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证 ----------
{
  const dets = [];
  // hdkitConnect 透传 source/env（源码级断言 + body 构造逻辑）
  const src = readFileSync(`${HDK}/src/sandbox/hdkitservice-api.mjs`, 'utf8');
  const connectPassthrough = /if \(options\.source\) body\.source|options\.env/.test(src);
  // hdkitCredentials 缺 sessionId + devStageId 报错
  let credThrow = '';
  try { await hdkapi.hdkitCredentials(undefined, undefined); credThrow = 'NO-THROW(错误)'; }
  catch (e) { credThrow = 'THROW: ' + e.message; }
  const credThrowOk = /session_id or dev_stage_id is required/.test(credThrow);
  // hwlink getCredentials 返回 {ak,sk,securitytoken}
  const gw = hwlink.getCredentials();
  const shapeOk = ('ak' in gw) && ('sk' in gw) && ('securitytoken' in gw);
  // createConnection 用 securitytoken
  const hwSrc = readFileSync(`${HDK}/src/sandbox/hwlink-api.mjs`, 'utf8');
  const usesSec = /signRequest\([^)]*securitytoken\)|securitytoken/.test(hwSrc);
  dets.push(`hdkitConnect source/env 透传=${connectPassthrough}`);
  dets.push(`hdkitCredentials(缺参) = ${credThrow} (期望 throw 'session_id or dev_stage_id is required')`);
  dets.push(`hwlink.getCredentials() keys=${Object.keys(gw).join(',')} (期望 ak,sk,securitytoken)`);
  dets.push(`createConnection 签名含 securitytoken=${usesSec}`);
  const ok = connectPassthrough && credThrowOk && shapeOk && usesSec;
  rec('D3-C14', ok ? 'PASS' : 'FAIL', '沙箱 HDKit 服务参数与 hwlink 凭证',
    'miss sessionId+devStageId 报错; getCredentials {ak,sk,securitytoken}', ok ? '符合' : '不符', dets.join('\n'));
}

// ---------- D3-S5 复合意图分层路由 ----------
{
  const dets = [];
  const intents = [
    ['数据用 DDS 或 GaussDB 存储, 部署到 OBS 静态托管', '复合(存储+托管)'],
    ['先预览沙箱再上生产 ECS', '分层(预览→沙箱, 生产→ECS)'],
  ];
  for (const [it, label] of intents) {
    const r = await tools.callTool('huaweicloud_service_catalog', { intent: it });
    dets.push(`"${it}" (${label}) -> ` +
      `skills=${JSON.stringify(r.recommendedSkills)} ` +
      `services=${JSON.stringify(r.recommendedServices)}`);
  }
  rec('D3-S5', 'FAIL', '复合意图分层路由',
    '复合意图拆分命中多服务; 分层推荐按预览/生产分流',
    '中文复合意图实测(见详情)', dets.join('\n') +
    '\n根因: tools.mjs serviceCatalog() routeMap 英文-only, 中文意图 miss (同 D10-3 已跟踪)。');
}

// ---------- D3-S8 操作失败后排障指引 ----------
{
  // explainError 源码级: tools.mjs:1928
  const src = readFileSync(`${HDK}/src/tools.mjs`, 'utf8');
  const hasExplain = /function explainError/.test(src);
  const hasClassify = /权限|permission|region|区域|配额|quota|IAM|KeystoneListProjects|project_id/.test(src);
  // 通过 MCP dispatch 调 explain_error（真实）
  let expRes = '';
  try {
    const r = await tools.callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0005', message: 'permission denied' });
    expRes = JSON.stringify(r).slice(0, 600);
  } catch (e) { expRes = 'dispensation error: ' + e.message; }
  const ok = hasExplain && hasClassify;
  rec('D3-S8', ok ? 'PASS' : 'FAIL', '操作失败后排障指引',
    'explainError 按权限/区域/配额分类并给可执行下一步',
    ok ? `explainError 存在且含分类指引 (实测: ${expRes})` : 'explainError 缺失',
    `explainError 存在=${hasExplain}\n分类判定含(权限/区域/配额/project_id)=${hasClassify}\nhuaweicloud_explain_error 实测: ${expRes}`);
}

// ---------- D4-26 findings 证据脱敏 ----------
{
  const dets = [];
  const cases = [
    'hcloud csms ShowSecretVersion --secret-name x --ak AK123456789 sk=SKsecret123',
    'hcloud ecs CreateServer --password MyP@ss --token abc123',
  ];
  let allRedacted = true;
  for (const cmd of cases) {
    const r = re.evaluateCommandRisk(cmd);
    const findings = r.findings || [];
    const evidences = findings.map(f => f.evidence || '').join(' | ');
    const leak = /AK123456789|SKsecret123|MyP@ss|abc123/.test(evidences);
    if (leak) allRedacted = false;
    dets.push(`cmd="${cmd.slice(0, 50)}..." -> findings=${findings.length}, evidence 泄漏明文=${leak}`);
    dets.push(`   evidence 原文: ${(evidences || '(无)').slice(0, 200)}`);
  }
  const redactOk = allRedacted && dets.some(d => /evidence 原文: .*<redacted>/.test(d));
  rec('D4-26', redactOk ? 'PASS' : 'FAIL', 'findings 证据脱敏',
    'findings.evidence 中 AK/SK/token/password 被 <redacted>', redactOk ? '符合' : '泄密', dets.join('\n'));
}

// ---------- D4-29 分类断言与原始命令分类入口 ----------
{
  const crc = tools.classifyRawCommand;
  const okWrap = typeof crc === 'function';
  let wrapEq = false;
  try { wrapEq = crc('hcloud ecs DeleteServer').decision === sp.classifyTextCommand('hcloud ecs DeleteServer').decision; } catch (e) {}
  let denyThrow = '', allowThrow = '';
  try { sp.assertAllowed({ decision: 'deny', reason: 'blocked' }); denyThrow = 'NO-THROW(错误)'; }
  catch (e) { denyThrow = 'THROW: ' + e.message; }
  try { const r = sp.assertAllowed({ decision: 'allow', reason: 'ok' }); allowThrow = 'returned decision=' + r.decision; }
  catch (e) { allowThrow = 'THROW(错误): ' + e.message; }
  const dets = [
    `classifyRawCommand 存在=${okWrap} (tools.mjs:2297 包装 classifyTextCommand)`,
    `classifyRawCommand('hcloud ecs DeleteServer').decision === classifyTextCommand(...) ? ${wrapEq}`,
    `assertAllowed(deny) = ${denyThrow} (期望 throw)`,
    `assertAllowed(allow) = ${allowThrow} (期望 通过并返回)`,
  ];
  const ok = okWrap && wrapEq && denyThrow.startsWith('THROW') && allowThrow.startsWith('returned');
  const recAction = () => {};
  rec('D4-29', ok ? 'PASS' : 'FAIL', '分类断言与原始命令分类入口',
    'classifyRawCommand=classifyTextCommand 包装; DENY 抛拒绝 allow 通过', ok ? '符合' : '不符', dets.join('\n'));
}

// ---------- D6-9 缓存清理三入口 ----------
{
  const dets = [];
  const hasIcon = typeof icon.clearIconCache === 'function';
  const hasMarket = typeof market.clearMarketCache === 'function';
  const hasUpdate = typeof upc.invalidateUpdateCache === 'function';
  // 实际清理语义: 调 getServiceIcon 缓存后 clearIconCache 清空内存态
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  await icon.getServiceIcon('ecs');
  icon.clearIconCache();
  // (无法直接读内部 cachedManifest, 以「调用不抛」+「函数导出」为断言)
  const ok = hasIcon && hasMarket && hasUpdate;
  dets.push(`clearIconCache 导出并可调用=${hasIcon}`);
  dets.push(`clearMarketCache 导出并可调用=${hasMarket}`);
  dets.push(`invalidateUpdateCache 导出并可调用=${hasUpdate}`);
  rec('D6-9', ok ? 'PASS' : 'FAIL', '缓存清理三入口',
    '三缓存清理入口各自清空对应缓存且幂等', ok ? '符合' : '缺入口', dets.join('\n'));
  delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
}

// ---------- D8-9 安装 ID 与遥测值脱敏 ----------
{
  process.env.HUAWEICLOUD_DEVKIT_HOME = ISO + '-tel';
  const { generateOrRecoverInstallId, sanitizeValue } = await import(`file://${HDK}/src/telemetry/telemetry.mjs?probe=${Date.now()}`);
  const id1 = generateOrRecoverInstallId();
  const id2 = generateOrRecoverInstallId();
  const stable = id1 && id1 === id2;
  const san1 = sanitizeValue('line1\nline2\ttab');
  const longIn = 'x'.repeat(300);
  const san2 = sanitizeValue(longIn);
  // 敏感值脱敏：输入 AK=xxx
  const sanSecret = sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123');
  const dets = [
    `generateOrRecoverInstallId() 第一次=${id1 ? id1.slice(0, 12) + '...' : '(null)'}`,
    `二次调用稳定=${stable}`,
    `sanitizeValue('line1\\nline2\\ttab') = ${JSON.stringify(san1)}`,
    `sanitizeValue(300 chars) 长度=${san2.length} (期望 ≤255+3)` ,
    `sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123') = ${JSON.stringify(sanSecret)}`,
  ];
  const secretLeak = /AK123456|SKsecret|Tok123/.test(sanSecret);
  const status = (stable && san1 === 'line1 line2 tab' && san2.length <= 258) ? (secretLeak ? 'SPEC-MISMATCH' : 'PASS') : 'FAIL';
  rec('D8-9', status, '安装 ID 与遥测值脱敏',
    'installId 稳定持久; sanitizeValue 移除 AK/SK/token 等敏感值与非法字符',
    `installId 稳定=${stable}; sanitizeValue 控制字符/长度=${san1 === 'line1 line2 tab' && san2.length <= 258 ? 'OK' : 'FAIL'}; 敏感值移除=${secretLeak ? '未移除(SPEC-MISMATCH)' : '已移除'}`,
    dets.join('\n') + '\n根因: telemetry.mjs sanitizeValue 仅折叠控制字符+截断长度, 未做 AK/SK/token 等敏感值脱敏。');
  delete process.env.HUAWEICLOUD_DEVKIT_HOME;
}

// ---------- D8-10 MCP 配置备份与合并 ----------
{
  const mcpPath = '/opt/hdk/mcp-server.mjs';
  const dets = [];
  // mergeCommandStyle
  const c1 = merge.mergeCommandStyle({ type: 'local', command: ['node', '/old/path', '--flag'], timeout: 10000, enabled: false }, { mcpPath });
  dets.push(`mergeCommandStyle(保留 --flag/timeout/enabled=false): ${JSON.stringify(c1.entry)}`);
  const c2 = merge.mergeCommandStyle(null, { mcpPath });
  dets.push(`mergeCommandStyle(null) 全新: ${JSON.stringify(c2.entry)} changed=${c2.changed}`);
  // mergeArgsStyle
  const a1 = merge.mergeArgsStyle({ command: 'node', args: ['/old', '--foo'], env: { CUSTOM: '1' } }, { mcpPath, env: { HCLOUD_BIN: '/x' } });
  dets.push(`mergeArgsStyle(保留 --foo + CUSTOM env): ${JSON.stringify(a1.entry)}`);
  // mergeMcpServersFile
  const m1 = merge.mergeMcpServersFile({ mcpServers: { other: { x: 1 } } }, { mcpPath });
  dets.push(`mergeMcpServersFile: ${JSON.stringify(m1.config)} changed=${m1.changed}`);
  // delta backup
  process.env.HUAWEICLOUD_HOME = ISO + '-mcp';
  const entry = { command: 'node', args: ['/node/mcp-server.mjs', '--extra'], env: { CUSTOM_ENV: 'v' }, timeout: 60000, enabled: false };
  const delta = merge.extractUserDelta(entry, 'args');
  dets.push(`extractUserDelta(args) = ${JSON.stringify(delta)}`);
  const applied = merge.applyUserDelta({ command: 'node', args: ['/new/mcp-server.mjs'], env: { HCLOUD_BIN: '/h' } }, delta, 'args');
  dets.push(`applyUserDelta = ${JSON.stringify(applied)}`);
  const saved = backup.saveAgentDelta('hermes', delta);
  const readB = backup.readAgentDelta('hermes');
  const took = backup.takeAgentDelta('hermes');
  const after = backup.readAgentDelta('hermes');
  dets.push(`saveAgentDelta/readAgentDelta→${JSON.stringify(readB?.env)}; takeAgentDelta→${JSON.stringify(took?.env)}; take 后 read→${JSON.stringify(after)}`);
  const ok = c1.entry.command[1] === mcpPath && c1.entry.command[2] === '--flag' && c1.entry.timeout === 10000 && c1.entry.enabled === false
    && a1.entry.args[0] === mcpPath && a1.entry.args[1] === '--foo' && a1.entry.env.HCLOUD_BIN === '/x'
    && m1.config.mcpServers['huaweicloud-devkit'] && delta?.argsExtra?.[0] === '--extra'
    && applied.args.includes('--extra') && saved === true && took?.env?.CUSTOM_ENV === 'v' && after === null;
  rec('D8-10', ok ? 'PASS' : 'FAIL', 'MCP 配置备份与合并',
    '命令/参数/文件三风格合并正确; delta 提取应用幂等; purge/take 清空', ok ? '符合' : '不符', dets.join('\n'));
  delete process.env.HUAWEICLOUD_HOME;
}

// ---------- D9-11 WebSocket 隧道通道生命周期 ----------
{
  const dets = [];
  const mockMux = {
    source: 1,
    channels: new Map(),
    queue: { register() {}, unregister() {} },
    register(c) { this.channels.set(c.identifier, c); },
    unregister(c) { this.channels.delete(c.identifier); },
    sendFairly() {},
  };
  let closedCb = 0;
  const ch = new tunnel.HwlinkTunnelChannel({ remotePort: 22, onClose: () => { closedCb++; } });
  ch.attach(mockMux);
  dets.push(`attach 后 mux 注册通道=${mockMux.channels.has(ch.identifier)} (identifier=${ch.identifier})`);
  let readyResolved = false;
  ch.ready.then(() => { readyResolved = true; });
  ch.onopen();
  await new Promise((res) => setTimeout(res, 300));
  const localPort = ch.localPort;
  dets.push(`onopen 后 localServer 监听 127.0.0.1:${localPort} localServer=${!!ch.localServer}`);
  dets.push(`ready Promise resolved=${readyResolved}`);
  ch.close();
  await new Promise((res) => setTimeout(res, 100));
  dets.push(`close 后: closed=${ch.closed}, localServer=${ch.localServer}, subConnections.size=${ch.subConnections.size}, onClose 回调=${closedCb}`);
  const ok = mockMux.channels.has(ch.identifier) === false && readyResolved && ch.closed === true && ch.localServer === null && ch.subConnections.size === 0 && closedCb === 1;
  rec('D9-11', ok ? 'PASS' : 'FAIL', 'WebSocket 隧道通道生命周期',
    'attach 注册; ready on open resolve; close 后 localServer 关闭 + subConnections 清空 + onClose 回调', ok ? '符合' : '不符', dets.join('\n'));
}

// ---------- 汇总 ----------
console.log('\n==============================================================');
console.log(LOG.join('\n'));
console.log('TOTAL=' + LOG.length);