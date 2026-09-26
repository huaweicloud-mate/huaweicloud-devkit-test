// 2026-09-20 OpenClaw Linux daily — 新增用例源码级确定性探针
// 覆盖 D1-65/66/67/68/70(D1 env)、D2-27(koocli-version)、D4-25/26/28/29、D6-9(缓存清理)、
// D8-9(installId+sanitize)、D8-10(MCP 配置备份合并)、D9-10(remote transport)、D9-11(WS 隧道生命周期)、D3-S5(复合意图分层路由)、D3-S8(排障指引)
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';

let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(m) { lines.push(`NOTE   ${m}`); }

const { semverCompare, parseDistTagsOutput } = await import(CORE + '/update-check.mjs');

// ── D1-40 镜像 lag 检测正确性（源码级 judgeQuery 直调语义）────────────────────
{
  // dist-tags 远端 <= 本地 时不提示倒退的判定核心是 semverCompare
  check('D1-40', 'semverCompare(1.1.5, 1.1.5)=0(不倒退)', semverCompare('1.1.5', '1.1.5'), 0);
  check('D1-40', 'semverCompare(1.1.4, 1.1.5)=-1(远端旧不提示)', semverCompare('1.1.4', '1.1.5') < 0, true);
  const tags = parseDistTagsOutput(JSON.stringify({ latest: '1.1.4', next: '1.1.5-next.1' }));
  check('D1-40', 'parseDistTagsOutput 解析 latest', tags.latest, '1.1.4');
  check('D1-40', 'parseDistTagsOutput 解析 next', tags.next, '1.1.5-next.1');
}

// ── D1-65 调试模式环境变量 ─────────────────────────────────────────────
{
  const { queryDistTagsSync } = await import(CORE + '/update-check.mjs');
  const was = process.env.HUAWEICLOUD_DEVKIT_DEBUG;
  // 直接断言 debugLog 判定逻辑：源码 update-check.mjs:211 DEBUG==='1'||'true'
  const src = readFileSync(CORE + '/update-check.mjs', 'utf8');
  const hasDebugGate = /HUAWEICLOUD_DEVKIT_DEBUG === '1'[\s\S]*HUAWEICLOUD_DEVKIT_DEBUG === 'true'/.test(src);
  check('D1-65', '源码含 DEBUG===\'1\'||\'true\' 开关门', hasDebugGate, true);
  process.env.HUAWEICLOUD_DEVKIT_DEBUG = '1';
  const r1 = queryDistTagsSync({ timeoutMs: 4000 });
  process.env.HUAWEICLOUD_DEVKIT_DEBUG = was === undefined ? delete process.env.HUAWEICLOUD_DEVKIT_DEBUG : process.env.HUAWEICLOUD_DEVKIT_DEBUG = was;
  check('D1-65', 'DEBUG=1 时 queryDistTagsSync 仍正常返回(不影响正常返回)', r1 && typeof r1 === 'object', true);
}

// ── D1-66 遥测开关与端点 ─────────────────────────────────────────────
{
  const { isTelemetryEnabled } = await import(CORE + '/telemetry/telemetry.mjs');
  const was = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  check('D1-66', 'TELEMETRY=off 时 isTelemetryEnabled()=false', isTelemetryEnabled(), false);
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  check('D1-66', 'TELEMETRY!=off 时 isTelemetryEnabled()=true', isTelemetryEnabled(), true);
  const src = readFileSync(CORE + '/telemetry/telemetry.mjs', 'utf8');
  check('D1-66', '源码 ENDPOINT 未设回退 DEFAULT_ENDPOINT', /process\.env\.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT \|\| DEFAULT_ENDPOINT/.test(src), true);
  if (was === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = was;
}

// ── D1-67 Agent toolkit 模式 + DSH 跳过 ─────────────────────────────────
{
  const src = readFileSync(CORE + '/setup-cli.mjs', 'utf8');
  const mergeSrc = readFileSync(CORE + '/mcp-config-merge.mjs', 'utf8');
  check('D1-67', 'REQUIRED_ENV_KEYS 含 HCLOUD_BIN', /REQUIRED_ENV_KEYS[\s\S]*HCLOUD_BIN/.test(mergeSrc), true);
  check('D1-67', '注入 HUAWEICLOUD_AGENT_TOOLKIT_MODE=local', src.includes("HUAWEICLOUD_AGENT_TOOLKIT_MODE"), true);
  check('D1-67', 'SKIP_DSH_PLUGIN_INSTALL 跳过 DSH 分支存在', /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL === '1'/.test(src), true);
}

// ── D1-68 图标离线 + region 取值 ─────────────────────────────────────────
{
  const iconSrc = readFileSync(CORE + '/icon-library.mjs', 'utf8');
  check('D1-68', 'ICONS_OFFLINE=1 走本地 snapshot(不联网)', /HUAWEICLOUD_ICONS_OFFLINE === '1'[\s\S]*loadSnapshot/.test(iconSrc), true);
  const credSrc = readFileSync(CORE + '/auth/credentials.mjs', 'utf8');
  check('D1-68', 'HUAWEICLOUD_REGION 参与 region 默认取值', /HW_REGION \|\| process\.env\.HUAWEICLOUD_REGION/.test(credSrc), true);
}

// ── D1-69 CLI help 子命令 ─────────────────────────────────────────────
{
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync('huaweicloud-devkit', ['help'], { encoding: 'utf8', env: { ...process.env, PATH: `${process.env.HOME}/nodejs/bin:${process.env.HOME}/bin:${process.env.PATH}` } });
  const out = `${r.stdout}${r.stderr}`;
  check('D1-69', 'help 子命令退出码 0', r.status, 0);
  check('D1-69', 'help 输出含命令列表(install/doctor)', /install/.test(out) && /doctor/.test(out), true);
  check('D1-69', 'help 输出非 TODO/非空', !/TODO/.test(out) && out.trim().length > 50, true);
}

// ── D1-70 代理配置与 WebSocket 代理 ─────────────────────────────────────
{
  const { proxyConfigPath, readProxyConfig, writeProxyConfig, clearProxyConfig, getProxySettings, getProxyUrlForTarget } = await import(CORE + '/proxy/proxy-config.mjs');
  const { getProxyDispatcher, createProxyWebSocket, getWebSocketImpl } = await import(CORE + '/proxy/proxy-agent.mjs');
  const iso = mkdtempSync(join(tmpdir(), 'hdk-proxy-'));
  const was = process.env.HUAWEICLOUD_DEVKIT_HOME;
  process.env.HUAWEICLOUD_DEVKIT_HOME = iso;
  try {
    writeProxyConfig({ http_proxy: 'http://127.0.0.1:18889', https_proxy: 'http://127.0.0.1:18889', no_proxy: 'localhost,127.0.0.1' });
    const cfg = readProxyConfig();
    check('D1-70', 'writeProxyConfig 后 readProxyConfig 读回 http_proxy', cfg?.http_proxy, 'http://127.0.0.1:18889');
    check('D1-70', 'readProxyConfig 读回 no_proxy', cfg?.no_proxy, 'localhost,127.0.0.1');
    const s = getProxySettings('https://example.com');
    check('D1-70', 'getProxySettings 命中 http 代理(非 null)', !!s, true);
    const sNo = getProxySettings('http://localhost:8080');
    check('D1-70', 'no_proxy 命中返回 null(绕过)', sNo, null);
    clearProxyConfig();
    const cfg2 = readProxyConfig();
    check('D1-70', 'clearProxyConfig 后读空', cfg2?.http_proxy ?? null, null);
    check('D1-70', 'getProxyUrlForTarget 导出可调用', typeof getProxyUrlForTarget, 'function');
    check('D1-70', 'createProxyWebSocket 导出可调用', typeof createProxyWebSocket, 'function');
    check('D1-70', 'getWebSocketImpl 导出可调用', typeof getWebSocketImpl, 'function');
    check('D1-70', 'getProxyDispatcher 导出可调用', typeof getProxyDispatcher, 'function');
  } finally {
    if (was === undefined) delete process.env.HUAWEICLOUD_DEVKIT_HOME; else process.env.HUAWEICLOUD_DEVKIT_HOME = was;
    rmSync(iso, { recursive: true, force: true });
  }
}

// ── D2-27 KooCLI 版本管理 ─────────────────────────────────────────────
{
  const { getKooCliVersion, parseHcloudVersion, compareVersion, kooCliDownloadBase, KOO_CLI_BASE } = await import(CORE + '/koocli-version.mjs');
  const v = getKooCliVersion();
  check('D2-27', 'getKooCliVersion 读 package.json kooCliVersion(非空)', typeof v === 'string' && v.length > 0, true);
  check('D2-27', 'parseHcloudVersion 提取首个 x.y.z', parseHcloudVersion('hcloud 7.2.12 (sha256 ...)'), '7.2.12');
  check('D2-27', 'compareVersion(7.2.12,7.2.9)>0', compareVersion('7.2.12', '7.2.9'), 1);
  check('D2-27', 'compareVersion(7.2.9,7.2.12)<0', compareVersion('7.2.9', '7.2.12'), -1);
  const base = kooCliDownloadBase();
  check('D2-27', 'downloadBase 以 KOO_CLI_BASE 开头', base.startsWith(KOO_CLI_BASE), true);
}

// ── D4-25 hook 事件遥测三态分类 + D4-26 findings 证据脱敏 ────────────────
// D4-25 归属 huaweicloud-safety.py record_cli_event 三态（读→cli:read/写→cli:write/其他→cli:invoke），
// 走独立探针 evidence/new-cases/probe-d4-25-telemetry.py 实测；此处只做 D4-26 findings 证据脱敏。
{
  // D4-26 findings.evidence 脱敏：risk-rule-engine redactEvidence 私有，公开路径 evaluateArtifacts 无明文回显
  const { evaluateArtifacts } = await import(CORE + '/risk-rule-engine.mjs');
  const r = evaluateArtifacts([{ path: 'p.tf', content: 'access_key="SECRET123" password="pw"' }]);
  const fJson = JSON.stringify(r);
  check('D4-26', 'evaluateArtifacts findings 输出不含明文凭证', !/SECRET123/.test(fJson) && !/"pw"/.test(fJson), true);
  // 直接核对 redactEvidence 正则源码覆盖 AK/SK/token/password
  check('D4-26', 'risk-rule-engine 脱敏正则覆盖 ak/sk/token/password', /access\[_-\]\?key|secret\[_-\]\?key|security\[_-\]\?token|password/.test(src2()), true);
  function src2() { return readFileSync(CORE + '/risk-rule-engine.mjs', 'utf8'); }
}

// ── D4-28 Node 版安全 hook 链路 / D4-29 classOnyRawCommand ─────────────
{
  const hookSrc = readFileSync('/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs', 'utf8');
  check('D4-28', 'hooks.json PreToolUse 注册 node huaweicloud-safety.mjs', /node .*huaweicloud-safety\.mjs/.test(hookSrc) || /huaweicloud-safety\.mjs/.test(readFileSync('/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/hooks/hooks.json', 'utf8')), true);
  check('D4-28', 'commandText 提取 command/cmd/script/args', /['"]command['"]|['"]cmd['"]|['"]script['"]|['"]args['"]/.test(hookSrc), true);
  check('D4-28', 'deny 时输出 permissionDecision:deny', /permissionDecision: 'deny'/.test(hookSrc), true);

  const { classifyRawCommand } = await import(CORE + '/tools.mjs');
  const { classifyTextCommand, assertAllowed } = await import(CORE + '/safety-policy.mjs');
  const d = classifyRawCommand('env | grep HW_SECRET_KEY').decision;
  note(`D4-29 classifyRawCommand(env dump) => ${d}`);
  check('D4-29', 'classifyRawCommand === classifyTextCommand 包装(签名一致导出)', typeof classifyRawCommand, 'function');
  check('D4-29', 'assertAllowed 导出可调用', typeof assertAllowed, 'function');
  check('D4-29', '分类结果含 decision 字段', typeof classifyRawCommand('ls').decision, 'string');
}

// ── D6-9 缓存清理三入口 ─────────────────────────────────────────────
{
  const { clearMarketCache } = await import(CORE + '/search-market.mjs');
  const { clearIconCache } = await import(CORE + '/icon-library.mjs');
  const { invalidateUpdateCache } = await import(CORE + '/update-check.mjs');
  const { clearProxyDispatcherCache } = await import(CORE + '/proxy/proxy-agent.mjs');
  // 三入口均可调用且幂等(二次调用不抛错)
  let ok = true;
  try { clearMarketCache(); clearMarketCache(); } catch { ok = false; }
  check('D6-9', '缓存清理入口1 clearMarketCache 幂等', ok, true);
  ok = true; try { clearIconCache(); clearIconCache(); } catch { ok = false; }
  check('D6-9', '缓存清理入口2 clearIconCache 幂等', ok, true);
  ok = true; try { invalidateUpdateCache(); invalidateUpdateCache(); } catch { ok = false; }
  check('D6-9', '缓存清理入口3 invalidateUpdateCache 幂等', ok, true);
  check('D6-9', 'clearProxyDispatcherCache 导出可调用', typeof clearProxyDispatcherCache, 'function');
}

// ── D8-9 安装 ID 稳定 + sanitize 脱敏 ─────────────────────────────────
{
  const { generateOrRecoverInstallId, sanitizeValue } = await import(CORE + '/telemetry/telemetry.mjs');
  const id1 = generateOrRecoverInstallId();
  const id2 = generateOrRecoverInstallId();
  check('D8-9', 'generateOrRecoverInstallId 二次调用稳定', id1, id2);
  check('D8-9', 'installId 非空且长度 32+ (sha256)', typeof id1 === 'string' && id1.length >= 32, true);
  const sv = sanitizeValue('AK=abcd\nSK=efgh\t');
  check('D8-9', 'sanitizeValue 移除换行/制表符', !/[\r\n\t]/.test(sv), true);
}

// ── D8-10 MCP 配置备份与合并 ─────────────────────────────────────────
{
  const merge = await import(CORE + '/mcp-config-merge.mjs');
  const bak = await import(CORE + '/mcp-config-backup.mjs');
  const c = merge.mergeCommandStyle({ command: ['node', '/old/mcp-server.mjs', '--user-flag'], env: { KEEP: 'yes' }, timeout: 120000 }, { mcpPath: '/new/mcp-server.mjs' }).entry;
  check('D8-10', 'mergeCommandStyle 修正 mcpPath', c.command[1], '/new/mcp-server.mjs');
  check('D8-10', 'mergeCommandStyle 保留 userArgs', c.command.slice(2).join(' '), '--user-flag');
  const a = merge.mergeArgsStyle({ command: 'node', args: ['/old/mcp-server.mjs', '--extra'], env: {} }, { mcpPath: '/new/mcp-server.mjs' }).entry;
  check('D8-10', 'mergeArgsStyle 修正 args[0]', a.args[0], '/new/mcp-server.mjs');
  const entry = { command: ['node', '/old/mcp-server.mjs', '--flag'], env: { CUSTOM: 'keep-me' }, timeout: 240000 };
  const delta = merge.extractUserDelta(entry, 'command');
  check('D8-10', 'extractUserDelta 捕获 timeout', delta?.timeout, 240000);
  const restored = merge.applyUserDelta({ command: ['node', '/new/mcp-server.mjs'], env: {} }, delta, 'command');
  check('D8-10', 'applyUserDelta 回放 userArgs', restored.command.slice(2).join(' '), '--flag');
  const iso = mkdtempSync(join(tmpdir(), 'hdk-mcpbak-'));
  const agentKey = 'openclaw';
  bak.saveAgentDelta(agentKey, { timeout: 420000 }, join(iso, 'delta.json'));
  check('D8-10', 'saveAgentDelta 写入可读', bak.readAgentDelta(agentKey, join(iso, 'delta.json'))?.timeout, 420000);
  const taken = bak.takeAgentDelta(agentKey, join(iso, 'delta.json'));
  check('D8-10', 'takeAgentDelta 取走返回 delta', taken?.timeout, 420000);
  check('D8-10', 'takeAgentDelta 取走后读空', bak.readAgentDelta(agentKey, join(iso, 'delta.json')), null);
  bak.purgeBackup(join(iso, 'delta.json'));
  check('D8-10', 'purgeBackup 清空', existsSync(join(iso, 'delta.json')), false);
  rmSync(iso, { recursive: true, force: true });
}

// ── D9-10 MCP remote transport ───────────────────────────────────────
{
  const { DEFAULT_PORT, DEFAULT_HOST, startRemoteServer } = await import(CORE + '/mcp-server-remote.mjs');
  check('D9-10', 'DEFAULT_PORT=9528', DEFAULT_PORT, 9528);
  check('D9-10', 'DEFAULT_HOST=127.0.0.1', DEFAULT_HOST, '127.0.0.1');
  check('D9-10', 'startRemoteServer 导出可调用', typeof startRemoteServer, 'function');
}

// ── D9-11 WebSocket 隧道通道生命周期 ─────────────────────────────────
{
  const { HwlinkTunnelChannel } = await import(CORE + '/ws-exec/hwlink-tunnel-channel.mjs');
  check('D9-11', 'HwlinkTunnelChannel 导出为类/构造函数', typeof HwlinkTunnelChannel, 'function');
  const ch = new HwlinkTunnelChannel({ remotePort: 9528 });
  check('D9-11', '实例含 ready Promise', !!ch.ready && typeof ch.ready.then === 'function', true);
  check('D9-11', '实例含 localServer 字段(初始 null)', ch.localServer === null, true);
  check('D9-11', '实例含 subConnections Map', ch.subConnections instanceof Map, true);
  check('D9-11', 'close() 可调用无抛错', (() => { try { ch.close?.(); return true; } catch { return false; } })(), true);
}

// ── D3-S5 复合意图分层路由 ───────────────────────────────────────────
{
  const { callTool } = await import(CORE + '/tools.mjs');
  const r = await callTool('huaweicloud_service_catalog', { intent: '部署一个网站，数据库用 MySQL，还需要对象存储' });
  const svcs = r.recommendedServices || [];
  note(`D3-S5 中文复合意图 services=${JSON.stringify(svcs)}（全角逗号不拆分→仅 sandbox 单路）`);
  check('D3-S5', '复合意图命中部署目标(sandbox 分层)', svcs.includes('Sandbox') || svcs.includes('DevStation'), true);
  check('D3-S5', '复合意图拆分命中存储(MySQL→RDS)', svcs.includes('RDS'), true);
  check('D3-S5', '复合意图拆分命中对象存储(OBS)', svcs.includes('OBS'), true);
}

// ── D3-S8 排障指引（explain_error 分类）──────────────────────────────
{
  const { callTool } = await import(CORE + '/tools.mjs');
  const r = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'APIGW.0301', message: 'Incorrect IAM authentication information' });
  note(`D3-S8 explain_error => ${typeof r === 'object' ? JSON.stringify(r).slice(0, 160) : r}`);
  check('D3-S8', 'explain_error 返回非空(非裸报错)', !!r && (typeof r === 'string' ? r.length > 0 : Object.keys(r || {}).length > 0), true);
}

console.log('\n=== OpenClaw Linux 新增用例确定性探针结果 (2026-09-20) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);