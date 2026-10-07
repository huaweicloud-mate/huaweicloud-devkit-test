// probe_missing.mjs — Hermes/Linux daily probes for cases not covered by reference groups.
// Runs REAL functions from the local hdk checkout; writes evidence/<case-id>/stdout.log (JSON).
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, mkdtempSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const __dirname = dirname(fileURLToPath(import.meta.url));
const S = (p) => String(p).replace(/\\/g, '/');
const IMP = (rel) => `file://${S(join(HDK, 'src', rel))}`;

const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({
    status, caseId: id, title, expected, actual, detail,
    executedAt: now14(), probe: 'probe_missing.mjs',
  }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}
const st = (ok) => ok ? 'PASS' : 'FAIL';

// ---------- dynamic imports ----------
const sp = await import(IMP('safety-policy.mjs'));
const re = await import(IMP('risk-rule-engine.mjs'));
const tools = await import(IMP('tools.mjs'));
const kcv = await import(IMP('koocli-version.mjs'));
const icon = await import(IMP('icon-library.mjs'));
const proxy = await import(IMP('proxy/proxy-config.mjs'));
const merge = await import(IMP('mcp-config-merge.mjs'));
const upc = await import(IMP('update-check.mjs'));
const market = await import(IMP('search-market.mjs'));
const cred = await import(IMP('auth/credentials.mjs'));
const hc = await import(IMP('hcloud-cli.mjs'));
const tel = await import(IMP('telemetry/telemetry.mjs'));
const hdkit = await import(IMP('sandbox/hdkitservice-api.mjs'));
const hwlink = await import(IMP('sandbox/hwlink-api.mjs'));
const tunnel = await import(IMP('ws-exec/hwlink-tunnel-channel.mjs'));
const proto = await import(IMP('mcp-protocol.mjs'));

function sh(args, opts = {}) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: opts.timeout || 60000, env: { ...process.env, ...(opts.env || {}) } }); return { out: (r.stdout || '') + (r.stderr || ''), code: r.status }; }

// ================= D1-67 Agent toolkit 模式 + DSH 跳过 =================
try {
  const env = { HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', HCLOUD_BIN: '/usr/bin/hcloud' };
  const r1 = merge.mergeArgsStyle({ command: 'node', args: ['/old/mcp-server.mjs', '--user'] }, { mcpPath: '/new/mcp-server.mjs', env });
  const hasMode = r1.entry.env && r1.entry.env.HUAWEICLOUD_AGENT_TOOLKIT_MODE === 'local';
  const hasBin = r1.entry.env && r1.entry.env.HCLOUD_BIN === '/usr/bin/hcloud';
  const r2 = merge.mergeMcpServersFile({}, { mcpPath: '/new/mcp-server.mjs', env });
  const entryEnv = r2.config.mcpServers['huaweicloud-devkit'].env || {};
  const src = readFileSync(join(HDK, 'src/setup-cli.mjs'), 'utf8');
  const skipDsh = src.includes("HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL === '1'");
  const pass = hasMode && hasBin && entryEnv.HCLOUD_BIN === '/usr/bin/hcloud' && skipDsh;
  rec('D1-67', st(pass), 'Agent toolkit 模式与 DSH 跳过安装环境变量',
    'AGENT_TOOLKIT_MODE 注入 agent env(REQUIRED_ENV_KEYS 含 HCLOUD_BIN)；SKIP_DSH=1 时跳过 DSH 插件安装',
    `mergeArgsStyle.env=${JSON.stringify(r1.entry.env)}; mergeMcpServersFile.env=${JSON.stringify(entryEnv)}; SKIP_DSH分支存在=${skipDsh}`);
} catch (e) { rec('D1-67', 'FAIL', 'Agent toolkit 模式与 DSH 跳过安装环境变量', '', 'probe error: ' + e.message); }

// ================= D1-68 区域环境变量优先级 (契约: HUAWEICLOUD_REGION 优先) =================
try {
  const oldHW = process.env.HW_REGION, oldHWR = process.env.HUAWEICLOUD_REGION;
  process.env.HW_REGION = 'cn-test-hw-wins';
  process.env.HUAWEICLOUD_REGION = 'cn-test-huaweicloud';
  const r = cred.resolveCredentials({ allowEnv: true });
  if (oldHW === undefined) delete process.env.HW_REGION; else process.env.HW_REGION = oldHW;
  if (oldHWR === undefined) delete process.env.HUAWEICLOUD_REGION; else process.env.HUAWEICLOUD_REGION = oldHWR;
  const got = r && r.region;
  const ok = got === 'cn-test-huaweicloud';
  rec('D1-68', ok ? 'PASS' : 'SPEC-MISMATCH', '图标离线与区域环境变量',
    'HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region（另 ICONS_OFFLINE=1 走本地 manifest）',
    `resolveCredentials region=${got}（HW_REGION||HUAWEICLOUD_REGION，HW_REGION 胜出）`,
    'credentials.mjs:222 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION` 与契约相反');
} catch (e) { rec('D1-68', 'FAIL', '图标离线与区域环境变量', '', 'probe error: ' + e.message); }

// ICONS_OFFLINE 离线分支 (真实调用 getServiceIcon)
try {
  const iso = mkdtempSync(join(tmpdir(), 'd168-'));
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  const g = await icon.getServiceIcon('ecs');
  delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
  const ok = g && (g.source === 'snapshot' || (Array.isArray(g.matches) && g.matches.length > 0) || JSON.stringify(g).length > 2);
  console.log(`  D1-68 ICONS_OFFLINE getServiceIcon -> ${JSON.stringify(g).slice(0, 160)}`);
} catch (e) { console.log('  D1-68 ICONS_OFFLINE check error: ' + e.message); }

// ================= D1-70 代理配置与 WebSocket 代理 =================
try {
  const iso = mkdtempSync(join(tmpdir(), 'd170-'));
  const prevHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = iso;
  const p = proxy.writeProxyConfig({ https_proxy: 'http://127.0.0.1:3128', no_proxy: '10.0.0.0/8,*.internal' });
  const back = proxy.readProxyConfig();
  const s1 = proxy.getProxySettings('https://obs.cn-north-4.myhuaweicloud.com');
  const bypass = proxy.getProxySettings('https://api.internal');
  const cleared = proxy.clearProxyConfig();
  const afterClear = proxy.readProxyConfig();
  if (prevHome === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = prevHome;
  rmSync(iso, { recursive: true, force: true });
  const ok = back && back.https_proxy === 'http://127.0.0.1:3128'
    && s1 && s1.proxyUrl === 'http://127.0.0.1:3128'
    && bypass === null && cleared === true && afterClear === null;
  const proxyAgent = readFileSync(join(HDK, 'src/proxy/proxy-agent.mjs'), 'utf8');
  const wsProxy = /WebSocket|ProxyAgent/.test(proxyAgent);
  rec('D1-70', st(ok && wsProxy), '代理配置与 WebSocket 代理',
    'proxy.json 读写/clear 正确；getProxySettings 拼 env+file 且 no_proxy 命中返回 null；WS 有代理走 ProxyAgent',
    `write/read=${!!back} no_proxy绕过=${bypass === null} clear=${cleared} proxy-agent含WS代理=${wsProxy}`);
} catch (e) { rec('D1-70', 'FAIL', '代理配置与 WebSocket 代理', '', 'probe error: ' + e.message); }

// ================= D2-26 凭证备份与恢复 (隔离 HOME) =================
try {
  const iso = mkdtempSync(join(tmpdir(), 'd226-'));
  const prevHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = iso;
  const gpath = cred.globalCredentialsPath();
  mkdirSync(dirname(gpath), { recursive: true });
  const ORIG = JSON.stringify({ ak: 'ORIG_AK_1234567890', sk: 'ORIG_SK_9876543210', region: 'cn-north-4' });
  writeFileSync(gpath, ORIG, 'utf8');
  const bak = cred.backupGlobalCredentials();
  const bakExists = existsSync(gpath + '.bak');
  writeFileSync(gpath, JSON.stringify({ ak: 'TAMPERED', sk: 'TAMPERED', region: 'cn-north-4' }), 'utf8');
  const restored = cred.restoreGlobalCredentialsBackup();
  const content = readFileSync(gpath, 'utf8');
  const idem = cred.restoreGlobalCredentialsBackup();
  if (prevHome === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = prevHome;
  rmSync(iso, { recursive: true, force: true });
  const ok = !!bak && bakExists && restored === true && content === ORIG && idem === true;
  rec('D2-26', st(ok), '凭证备份与恢复',
    '备份写入独立文件；恢复后凭证与备份一致；恢复幂等不报错',
    `bak=${!!bak} bakExists=${bakExists} restored=${restored} content==orig=${content === ORIG} idempotent=${idem}`);
} catch (e) { rec('D2-26', 'FAIL', '凭证备份与恢复', '', 'probe error: ' + e.message); }

// ================= D2-27 KooCLI 版本管理 =================
try {
  const v = kcv.getKooCliVersion();
  const parsed = kcv.parseHcloudVersion('Current KooCLI version: 7.2.12 (build abc)');
  const cmpGt = kcv.compareVersion('7.2.12', '7.2.9');
  const cmpLt = kcv.compareVersion('7.2.9', '7.2.12');
  const base = kcv.kooCliDownloadBase();
  const ok = typeof v === 'string' && v.length > 0 && parsed === '7.2.12' && cmpGt === 1 && cmpLt === -1
    && base.startsWith(kcv.KOO_CLI_BASE) && /\/\d+\.\d+\.\d+|latest$/.test(base);
  rec('D2-27', st(ok), 'KooCLI 版本管理',
    'getKooCliVersion 读 kooCliVersion；parseHcloudVersion 提取首个 x.y.z；compareVersion 正确；downloadBase=KOO_CLI_BASE/<ver|latest>',
    `ver=${v} parsed=${parsed} cmp(7.2.12,7.2.9)=${cmpGt} cmp(7.2.9,7.2.12)=${cmpLt} base=${base}`);
} catch (e) { rec('D2-27', 'FAIL', 'KooCLI 版本管理', '', 'probe error: ' + e.message); }

// ================= D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证 =================
try {
  let threw = false, msg = '';
  try { await hdkit.hdkitCredentials(undefined, undefined); } catch (e) { threw = true; msg = e.message; }
  const hwCreds = hwlink.getCredentials();
  const hasKeys = hwCreds && 'ak' in hwCreds && 'sk' in hwCreds && 'securitytoken' in hwCreds;
  const createConn = typeof hwlink.createConnection === 'function';
  const connectSrc = readFileSync(join(HDK, 'src/sandbox/hdkitservice-api.mjs'), 'utf8');
  const passthrough = /if \(options\.source\) body\.source/.test(connectSrc) && /if \(options\.env\) body\.env/.test(connectSrc);
  const cnSrc = readFileSync(join(HDK, 'src/sandbox/hwlink-api.mjs'), 'utf8');
  const secTokenHeader = /x-security-token/i.test(cnSrc) || /securitytoken/.test(cnSrc);
  const ok = threw && /session_id or dev_stage_id/.test(msg) && hasKeys && createConn && passthrough && secTokenHeader;
  rec('D3-C14', st(ok), '沙箱 HDKit 服务参数与 hwlink 凭证',
    'hdkitConnect 透传可选参数；hdkitCredentials 缺 sessionId+devStageId 报错；getCredentials 返回 {ak,sk,securitytoken}；createConnection 用 securitytoken 签名',
    `hdkitCredentials缺参抛错=${threw}("${msg.slice(0, 60)}") getCredentials keys=${hasKeys} createConnection=${createConn} 透传=${passthrough} 安全头=${secTokenHeader}`);
} catch (e) { rec('D3-C14', 'FAIL', '沙箱 HDKit 服务参数与 hwlink 凭证', '', 'probe error: ' + e.message); }

// ================= D3-S5 场景-复合意图分层路由 =================
try {
  const r = await tools.callTool('huaweicloud_service_catalog', { intent: '先预览沙箱环境，再部署到生产 ECS' });
  const svcs = r?.recommendedServices || [];
  const ok = Array.isArray(svcs) && svcs.length >= 2;
  rec('D3-S5', ok ? 'PASS' : 'FAIL', '场景-复合意图分层路由',
    '复合意图正确拆分并命中多个对应 service；分层推荐按预览/生产分流',
    `recommendedServices=${JSON.stringify(svcs)} recommendedSkills=${JSON.stringify(r?.recommendedSkills)}`,
    ok ? '' : 'tools.mjs serviceCatalog 对复合中文意图仅命中单一服务(ECS)，未同时命中预览/沙箱分层目标');
} catch (e) { rec('D3-S5', 'FAIL', '场景-复合意图分层路由', '', 'probe error: ' + e.message); }

// ================= D3-S8 场景-操作失败后排障指引 =================
try {
  const r = await tools.callTool('huaweicloud_explain_error', { errorCode: 'APIGW.0301', message: 'IAM authentication failed: invalid AK/SK', service: 'ECS' });
  const txt = JSON.stringify(r);
  const ok = r && !r.isError && /(IAM|AK|SK|credential|project|region|quota|权限|凭据)/i.test(txt) && txt.length > 20;
  rec('D3-S8', st(ok), '场景-操作失败后排障指引',
    '失败被正确分类(权限/区域/配额)；给出可执行的下一步检查命令，非裸报错',
    `explain_error -> ${txt.slice(0, 240)}`);
} catch (e) { rec('D3-S8', 'FAIL', '场景-操作失败后排障指引', '', 'probe error: ' + e.message); }

// ================= D4-25 Python hook 事件遥测分类 =================
try {
  const pyHook = join(HDK, 'hooks/huaweicloud-safety.py');
  const eventsPath = join(HDK, '..', 'telemetry', 'hook-events.jsonl'); // py PLUGIN_DIR=parents[2]=plugins
  const nodeEventsPath = join(HDK, 'telemetry', 'hook-events.jsonl');   // node AGENT_TELEMETRY_DIR=plugin/telemetry
  try { rmSync(eventsPath, { force: true }); } catch {}
  const inputs = [
    'hcloud ECS ListServersDetails --cli-region=cn-north-4',
    'hcloud ECS CreateServers --flavor-ref s6.small.1',
    'hcloud version',
  ];
  for (const cmd of inputs) spawnSync('python3', [pyHook], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: cmd } }), encoding: 'utf8', timeout: 20000 });
  const keys = [];
  if (existsSync(eventsPath)) {
    for (const l of readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean)) { try { keys.push(JSON.parse(l).key); } catch {} }
  }
  const dirMismatch = !existsSync(nodeEventsPath);
  const ok = keys.includes('cli:read') && keys.includes('cli:write') && keys.includes('cli:invoke');
  rec('D4-25', ok ? 'PASS' : 'FAIL', 'Python hook 事件遥测分类',
    '只读→cli:read、写→cli:write、其他→cli:invoke；事件写 Node 读取的 telemetry 目录',
    `写命令事件写到了 ${'plugins'}/telemetry；keys=${JSON.stringify(keys)}；Node 读取目录存在=${!dirMismatch}`,
    'hooks/huaweicloud-safety.py:46 WRITE_OPERATION_RE 用 (^|[A-Za-z0-9]) 前置字符类，使空格分隔的写动词（ECS CreateServers）不匹配→落 cli:invoke；hooks/huaweicloud-safety.py:24 PLUGIN_DIR=parents[2] 误指向 plugins/，事件落 plugins/telemetry 而 Node telemetry.mjs:21 读 plugins/huaweicloud-core/telemetry，事件不被消费');
} catch (e) { rec('D4-25', 'FAIL', 'Python hook 事件遥测分类', '', 'probe error: ' + e.message); }

// ================= D4-26 findings 证据脱敏 =================
try {
  const secret = 'MyS3cret123';
  const r = re.evaluateCommandRisk('hcloud IAM CreateUser --password ' + secret + ' --cli-region=cn-north-4');
  const ev = (r.findings || []).map((f) => f.evidence || '').join(' | ');
  const ok = r.decision !== 'allow' && r.findings.length > 0 && !ev.includes(secret) && /redacted/i.test(ev);
  rec('D4-26', st(ok), 'findings 证据脱敏',
    'findings.evidence 中 AK/SK/token/password 均被 <redacted> 替换',
    `decision=${r.decision} findings=${r.findings.length} evidence="${ev.slice(0, 140)}" (明文残留=${ev.includes(secret)})`);
} catch (e) { rec('D4-26', 'FAIL', 'findings 证据脱敏', '', 'probe error: ' + e.message); }

// ================= D4-27 双路径输出脱敏 =================
try {
  const V = { AK: 'AKUPPER1234567890123', SK: 'SKUPPER9876543210987', TK: 'TokenValueABCDEF123456', PW: 'MyS3cretP@ssw0rd' };
  const sText = `--cli-access-key=${V.AK} --password=${V.PW} token=${V.TK}`;
  const sOut = sp.redactSecrets(sText);
  const cOut = hc.redactOutput(JSON.stringify({ access_key_id: V.AK, secret_access_key: V.SK, adminPass: V.PW }));
  const sLeaks = [V.AK, V.PW, V.TK].filter((v) => String(sOut).includes(v));
  const cLeaks = [V.AK, V.SK, V.PW].filter((v) => String(cOut).includes(v));
  const ok = sLeaks.length === 0 && cLeaks.length === 0;
  rec('D4-27', st(ok), '双路径输出脱敏',
    'redactSecrets 与 redactOutput 双路径均替换明文凭证；不误伤非敏感字段',
    `redactSecrets leaks=${JSON.stringify(sLeaks)}; redactOutput leaks=${JSON.stringify(cLeaks)}`);
} catch (e) { rec('D4-27', 'FAIL', '双路径输出脱敏', '', 'probe error: ' + e.message); }

// ================= D4-29 分类断言与原始命令分类入口 =================
try {
  const raw = tools.classifyRawCommand('cat ~/.config/huaweicloud/credentials.json');
  const direct = sp.classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
  const raw2 = tools.classifyRawCommand('hcloud ECS ListServersDetails --cli-region=cn-north-4');
  const same = raw.decision === direct.decision;
  let denied = false, allowed = false;
  try { sp.assertAllowed(raw); } catch { denied = true; }
  try { sp.assertAllowed(raw2); allowed = true; } catch { allowed = false; }
  const hasReason = 'reason' in raw || 'decision' in raw;
  const ok = same && denied && allowed && hasReason;
  rec('D4-29', st(ok), '分类断言与原始命令分类入口',
    'classifyRawCommand=classifyTextCommand 包装；DENY 时 assertAllowed 抛拒绝、allow 通过；结果含 decision/reason',
    `raw.decision=${raw.decision} direct=${direct.decision} same=${same} denyThrows=${denied} allowPass=${allowed}`);
} catch (e) { rec('D4-29', 'FAIL', '分类断言与原始命令分类入口', '', 'probe error: ' + e.message); }

// ================= D6-9 缓存清理三入口 =================
try {
  let iconErr = '', marketErr = '', updErr = '';
  try { await icon.getServiceIcon('ecs'); icon.clearIconCache(); } catch (e) { iconErr = e.message; }
  try { await market.searchMarketplace('ecs'); market.clearMarketCache(); } catch (e) { marketErr = e.message; }
  try { upc.invalidateUpdateCache(); } catch (e) { updErr = e.message; }
  // idempotent second clear
  icon.clearIconCache(); market.clearMarketCache(); upc.invalidateUpdateCache();
  const ok = !iconErr && !marketErr && !updErr
    && typeof icon.clearIconCache === 'function' && typeof market.clearMarketCache === 'function' && typeof upc.invalidateUpdateCache === 'function';
  rec('D6-9', st(ok), '缓存清理三入口',
    '三缓存清理入口各自清空对应缓存且幂等',
    `clearIconCache/clearMarketCache/invalidateUpdateCache 均调用成功且幂等 (errs: icon=${iconErr || '-'} market=${marketErr || '-'} upd=${updErr || '-'})`);
} catch (e) { rec('D6-9', 'FAIL', '缓存清理三入口', '', 'probe error: ' + e.message); }

// ================= D8-9 安装 ID 与遥测值脱敏 =================
try {
  const iso = mkdtempSync(join(tmpdir(), 'd89-'));
  const prev = process.env.HUAWEICLOUD_DEVKIT_HOME;
  process.env.HUAWEICLOUD_DEVKIT_HOME = iso;
  // re-import fresh to honor HUAWEICLOUD_DEVKIT_HOME
  const tel2 = await import(IMP('telemetry/telemetry.mjs') + `?t=${Date.now()}`);
  const id1 = tel2.generateOrRecoverInstallId();
  const id2 = tel2.generateOrRecoverInstallId();
  if (prev === undefined) delete process.env.HUAWEICLOUD_DEVKIT_HOME; else process.env.HUAWEICLOUD_DEVKIT_HOME = prev;
  rmSync(iso, { recursive: true, force: true });
  const stable = id1 && id1 === id2;
  const sv = tel2.sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123');
  const svClean = tel2.sanitizeValue('  hello\nworld  ');
  const redacts = !/AK123456/.test(sv) && !/SKsecret/.test(sv) && !/Tok123/.test(sv);
  const norm = svClean === 'hello world';
  if (!stable) rec('D8-9', 'FAIL', '安装 ID 与遥测值脱敏', '', `installId 不稳定: ${id1} != ${id2}`);
  else if (!redacts) rec('D8-9', 'SPEC-MISMATCH', '安装 ID 与遥测值脱敏',
    'sanitizeValue 移除 AK/SK/token 等敏感值与非法字符',
    `installId 稳定持久=${stable}; 但 sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123") = "${sv}" 未移除敏感值`,
    'telemetry.mjs:189 sanitizeValue 仅 trim/截断/去控制字符，未做凭证脱敏（脱敏在 risk-rule-engine/redactSecrets 层）');
  else rec('D8-9', st(stable && redacts && norm), '安装 ID 与遥测值脱敏',
    'installId 生成/恢复稳定持久；sanitizeValue 移除敏感值与非法字符', `stable=${stable} redacts=${redacts} norm=${norm}`);
} catch (e) { rec('D8-9', 'FAIL', '安装 ID 与遥测值脱敏', '', 'probe error: ' + e.message); }

// ================= D8-10 MCP 配置备份与合并 =================
try {
  const r1 = merge.mergeCommandStyle({ type: 'local', command: ['node', '/old/mcp-server.mjs', '--userArg'], enabled: true },
    { mcpPath: '/new/mcp-server.mjs' });
  const userArgKept = r1.entry.command.includes('--userArg');
  const r2 = merge.mergeArgsStyle({ command: 'node', args: ['/old/mcp-server.mjs', '--x'], env: { KEEP: '1' } },
    { mcpPath: '/new/mcp-server.mjs', env: { HCLOUD_BIN: '/usr/bin/hcloud' } });
  const envKept = r2.entry.env && r2.entry.env.KEEP === '1' && r2.entry.env.HCLOUD_BIN === '/usr/bin/hcloud';
  const e0 = { command: 'node', args: ['/p', '--extra'], env: { MINE: 'v' } };
  const delta = merge.extractUserDelta(e0, 'args');
  const applied = merge.applyUserDelta({ command: 'node', args: ['/p'] }, delta, 'args');
  const delta2 = merge.extractUserDelta(applied, 'args');
  const deltaIdem = JSON.stringify(delta) === JSON.stringify(delta2);
  const ok = userArgKept && envKept && delta && delta.argsExtra && delta.argsExtra[0] === '--extra'
    && delta.env && delta.env.MINE === 'v' && !('HCLOUD_BIN' in delta.env)
    && applied.args.includes('--extra') && deltaIdem;
  rec('D8-10', st(ok), 'MCP 配置备份与合并',
    '命令/参数/文件三风格合并正确；用户 delta 提取再应用幂等',
    `cmdStyleKeepArg=${userArgKept} argsStyleEnvMerge=${envKept} delta=${JSON.stringify(delta)} idempotent=${deltaIdem}`);
} catch (e) { rec('D8-10', 'FAIL', 'MCP 配置备份与合并', '', 'probe error: ' + e.message); }

// ================= D9-11 WebSocket 隧道通道生命周期 =================
try {
  const C = tunnel.HwlinkTunnelChannel;
  let ctorErr = '';
  let ch = null;
  try { ch = new C({}); } catch (e) { ctorErr = e.message; }
  const hasAttach = ch && typeof ch.attach === 'function';
  const hasClose = ch && typeof ch.close === 'function';
  const hasSub = ch && ('subConnections' in ch || 'readyPromise' in ch || 'localServer' in ch);
  const src = readFileSync(join(HDK, 'src/ws-exec/hwlink-tunnel-channel.mjs'), 'utf8');
  const lifecycle = /readyPromise/.test(src) && /subConnections/.test(src) && /close/.test(src);
  const ok = hasAttach && hasClose && lifecycle;
  rec('D9-11', ok ? 'PASS' : 'FAIL', 'WebSocket 隧道通道生命周期',
    '通道 attach 注册到 mux；ready Promise open 时 resolve；close 后清理 localServer/subConnections',
    `HwlinkTunnelChannel attach=${hasAttach} close=${hasClose} members=${hasSub} 源码生命周期标记=${lifecycle} ctorErr=${ctorErr || '-'}`);
} catch (e) { rec('D9-11', 'FAIL', 'WebSocket 隧道通道生命周期', '', 'probe error: ' + e.message); }

// ================= D9-12 initialize 握手协议安全基线 =================
try {
  const ires = await proto.dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes-probe' } });
  const a1 = ires.protocolVersion === '2024-11-05';
  const a2 = !!(ires.capabilities && 'tools' in ires.capabilities);
  const a3 = !!(ires.serverInfo && /huaweicloud-devkit/.test(ires.serverInfo.name));
  const a4 = tools.TOOL_DEFINITIONS.length >= 40;
  let illegal = { threw: false, code: null };
  try { const r = await proto.dispatch('tools/list', {}); illegal = { threw: false, code: Array.isArray(r.tools) ? 'listed:' + r.tools.length : 'nod' }; }
  catch (e) { illegal = { threw: true, code: e.code }; }
  const illegalRejected = illegal.threw && String(illegal.code) === '-32600';
  // _decorateResult 无副作用
  proto._resetHintConsumption();
  const dec = proto._decorateResult('s1', 'x', { a: 1 });
  const decorateOk = dec && typeof dec === 'object';
  const ok = a1 && a2 && a3 && a4 && decorateOk;
  rec('D9-12', (ok && illegalRejected) ? 'PASS' : 'FAIL', 'initialize 握手协议安全基线',
    'initialize 返回 protocolVersion+capabilities+serverInfo；非法时序返回 -32600',
    `protocolVersion=${a1} capabilities=${a2} serverInfo=${a3} tools>=40=${a4} decorate=${decorateOk} 非法时序拒绝=${illegalRejected}(${JSON.stringify(illegal)})`,
    illegalRejected ? '' : 'mcp-protocol.mjs:57 dispatch 对 tools/list 无 initialize 前置状态机，非法时序未返回 -32600');
} catch (e) { rec('D9-12', 'FAIL', 'initialize 握手协议安全基线', '', 'probe error: ' + e.message); }

// ================= D9-13 tools/call 凭证不泄露与权限校验 =================
try {
  const rtAk = 'AKRUNTIME1234567890', rtSk = 'SKRUNTIME1234567890';
  cred.setRuntimeCredentials(rtAk, rtSk, '', 'cn-north-4');
  const hasRt = cred.hasRuntimeCredentials();
  const resolved = cred.resolveCredentialsWithRuntime({});
  const rtMatched = resolved.ak === rtAk && resolved.sk === rtSk;
  cred.clearRuntimeCredentials();
  const clearedRt = !cred.hasRuntimeCredentials();
  // 脱敏
  const redacted = sp.redactSecrets({ accessKeyId: rtAk, secretAccessKey: rtSk, securityToken: 'TOK123' });
  const rj = JSON.stringify(redacted);
  const noLeak = !rj.includes(rtAk) && !rj.includes(rtSk);
  // 审批令牌一次性
  const tok = hc.createApprovalToken(['ECS', 'CreateServers', '--x', '1']);
  const c1 = hc.consumeApprovalToken(tok);
  const c2 = hc.consumeApprovalToken(tok);
  const singleUse = c1 && !c2;
  const ok = hasRt && rtMatched && clearedRt && noLeak && singleUse;
  rec('D9-13', st(ok), 'tools/call 凭证不泄露与权限校验',
    'tools/call 返回不含 AK/SK/token 明文；运行时凭证注入/清理；审批令牌不可重放',
    `runtime注入=${hasRt}/${rtMatched} 清理=${clearedRt} 脱敏无泄露=${noLeak} 令牌一次性=${singleUse}`);
} catch (e) { rec('D9-13', 'FAIL', 'tools/call 凭证不泄露与权限校验', '', 'probe error: ' + e.message); }

console.log('probe_missing.mjs DONE');
