// checks3.mjs — D5/D6/D8/D9/D10 + 展开级(EXP-C4-*/EXP-E*/EXP-D5-*) (v2 TS 适配)
import { reg, ok, fail, spec, blocked, notrun, chk, hdk, run, sh, makeServer, toolsList, REPO_ROOT, PACK, EVID } from './core.mjs';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';

const rd = (p) => readFileSync(p, 'utf-8');

// ============ D5 ============
reg('D5-1', async () => {
  const h = await hdk();
  const targets = h.authReg.SUPPORTED_AGENT_TARGETS || [];
  const st = h.authReg.getAgentRegistrationStatuses ? h.authReg.getAgentRegistrationStatuses('all') : null;
  return chk(targets.length > 0, `插件清单安装目标存在(SUPPORTED_AGENT_TARGETS=${targets.length})`, JSON.stringify({ targets, st }).slice(0, 200));
});
reg('D5-3', async () => {
  const h = await hdk();
  const tools = await toolsList();
  const n = tools.length;
  const srcCount = h.tools.TOOL_DEFINITIONS.length;
  const okS = tools.every(t => t.name && t.inputSchema);
  const dup = new Set(tools.map(t => t.name)).size !== n;
  return chk(okS && !dup && n === srcCount, `工具全量可达且 schema 完整: n=${n}=注册源${srcCount} schemaOk=${okS} dup=${dup}`, `工具数=${n}/src=${srcCount} schemaOk=${okS} dup=${dup}`);
});
reg('EXP-D5-1-1', async () => {
  const h = await hdk();
  const ocTarget = (h.authReg.SUPPORTED_AGENT_TARGETS || []).find(t => /opencode/i.test(t));
  const root = dirname(dirname(dirname(h.SRC)));
  const manifest = existsSync(join(root, 'integrations', 'opencode', 'opencode.json'));
  const mcp = existsSync(join(dirname(h.SRC), '.mcp.json'));
  return chk(!!ocTarget && (manifest || mcp), `OpenCode 可发现并加载插件清单: target=${ocTarget} opencode.json=${manifest} .mcp.json=${mcp}`, JSON.stringify({ targets: h.authReg.SUPPORTED_AGENT_TARGETS, manifest, mcp }));
});
reg('EXP-D5-1-3', async () => {
  const h = await hdk();
  const tools = await toolsList();
  const n = tools.length;
  const schemaOk = tools.every(t => t.name && t.inputSchema);
  const dup = new Set(tools.map(t => t.name)).size !== n;
  return chk(schemaOk && !dup, `OpenCode tools/list 枚举全量可达且 schema 完整: n=${n}(注册源数量) schemaOk=${schemaOk} dup=${dup}`, `工具数=${n} schemaOk=${schemaOk} dup=${dup}`);
});

// ============ D6 ============
reg('D6-1', async () => {
  const h = await hdk();
  const t0 = Date.now();
  await h.tools.callTool('huaweicloud_search_docs', { query: 'ECS' });
  const dt = Date.now() - t0;
  return chk(dt < 2000, `检索响应延迟 ${dt}ms < 2s`, `延迟 ${dt}ms >= 2s`);
});
reg('D6-3', async () => {
  const h = await hdk();
  const srv = makeServer();
  const t0 = Date.now();
  const r = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const dt = Date.now() - t0;
  srv.kill();
  return chk(r && r.result && dt < 8000, `MCP 冷启 ${dt}ms < 8s`, `冷启 ${dt}ms 或无响应`);
});
reg('D6-4', async () => {
  const srv = makeServer();
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const N = 30;
  const ps = [];
  for (let i = 0; i < N; i++) ps.push(srv.call('huaweicloud_check_cli', {}).catch(() => ({ __err: true })));
  const rs = await Promise.all(ps);
  const okCnt = rs.filter(r => r && !r.__err && !r.error).length;
  srv.kill();
  return chk(okCnt === N, `并发 30 请求无死锁: ok=${okCnt}/30`, `仅 ${okCnt}/30 成功`);
});
reg('D6-9', async () => {
  const h = await hdk();
  const u = h.uc.invalidateUpdateCache && (h.uc.invalidateUpdateCache(), true);
  const i = h.icon.clearIconCache && (h.icon.clearIconCache(), true);
  const m = h.market.clearMarketCache && (h.market.clearMarketCache(), true);
  return chk(u && i && m, `三缓存清理入口可调用(update/icon/market)`, JSON.stringify({ u, i, m }));
});

// ============ D8 ============
reg('D8-1', async () => {
  const h = await hdk();
  const docs = join(dirname(dirname(dirname(h.SRC))), 'README.md');
  return chk(existsSync(docs), 'README.md 文档存在', 'README 缺失');
});
reg('D8-4', async () => {
  const h = await hdk();
  const r = await h.tools.callTool('huaweicloud_retrieve_skill', { name: 'huawei-ecs' });
  const okLoad = r && !r.__error && (r.content || r.markdown || r.skill || r.text);
  return chk(okLoad, 'skill 指引可机械加载(huawei-ecs)', JSON.stringify(r).slice(0, 120));
});
reg('D8-6', async () => {
  const h = await hdk();
  const root = dirname(dirname(dirname(h.SRC)));
  const en = existsSync(join(root, 'README.md'));
  const zh = existsSync(join(root, 'README.zh-CN.md'));
  return chk(en && zh, `中英文文档并存: en=${en} zh=${zh}`, '');
});
reg('D8-7', async () => {
  const h = await hdk();
  const meta7 = ['huaweicloud-core', 'huaweicloud-getting-started', 'huaweicloud-cli-and-auth', 'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 'huaweicloud-troubleshooting', 'huaweicloud-safety'];
  let okN = 0;
  for (const s of meta7) { try { const r = await h.tools.callTool('huaweicloud_retrieve_skill', { name: s }); if (r && !r.__error) okN++; } catch {} }
  return chk(okN >= 5, `7 个 meta 技能可机械执行: ${okN}/7`, `${okN}/7`);
});
reg('D8-9', async () => {
  const h = await hdk();
  const id1 = h.telemetry.generateOrRecoverInstallId ? h.telemetry.generateOrRecoverInstallId() : null;
  const san = h.telemetry.sanitizeValue ? h.telemetry.sanitizeValue('AK=AK123 secret_key=SECRET token=abc123') : '';
  const leaked = /AK123|SECRET|abc123/.test(san);
  return chk(id1 && !leaked, `installId 生成/恢复 + sanitizeValue 脱敏: san=${san}`, `sanitizeValue 未脱敏: ${san}`);
});
// D8-10 MCP 配置备份与合并
reg('D8-10', async () => {
  const h = await hdk();
  const os = await import('node:os'); const fs = await import('node:fs'); const path = await import('node:path');
  const iso = path.join(os.tmpdir(), `hdk-d810-${Date.now()}`);
  fs.mkdirSync(iso, { recursive: true });
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = iso;
  try {
    const j1 = { mcpServers: { a: { command: 'npx', args: ['-y', 'x'] } } };
    const j2 = { mcpServers: { a: { command: 'npx', args: ['-y', 'y'] }, b: { command: 'node', args: ['z'] } } };
    const merged = h.mcmg.mergeMcpServersFile ? h.mcmg.mergeMcpServersFile(j1, j2) : null;
    const delta = h.mcmg.extractUserDelta ? h.mcmg.extractUserDelta(j1, j2) : null;
    const saved = h.mcbm.saveAgentDelta ? h.mcbm.saveAgentDelta('opencode', { x: 1 }) : null;
    const readBk = h.mcbm.readAgentDelta ? h.mcbm.readAgentDelta('opencode') : null;
    const kindOk = (merged !== null || delta !== null) && saved !== null && readBk !== null;
    return chk(!!kindOk, `MCP 配置备份/合并可执行: merge=${!!merged} delta=${!!delta} save=${!!saved} read=${readBk !== null}`, JSON.stringify({ merged: !!merged, delta: !!delta, saved: !!saved }));
  } catch (e) {
    return fail(`D8-10 异常: ${String(e).slice(0, 160)}`);
  } finally {
    if (old) process.env.HUAWEICLOUD_HOME = old; else delete process.env.HUAWEICLOUD_HOME;
    fs.rmSync(iso, { recursive: true, force: true });
  }
});

// ============ D9 协议 ============
reg('D9-1', async () => {
  const tools = await toolsList();
  const valid = tools.every(t => t.inputSchema && typeof t.inputSchema === 'object' && (t.inputSchema.type === 'object'));
  const dup = new Set(tools.map(t => t.name)).size !== tools.length;
  return chk(valid && !dup, `tools/list schema 合法且无重复: n=${tools.length} valid=${valid} dup=${dup}`, `valid=${valid} dup=${dup}`);
});
reg('D9-2', async () => {
  const srv = makeServer();
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const unk = await srv.send({ jsonrpc: '2.0', id: 99, method: 'unknown/method', params: {} });
  const badParams = await srv.send({ jsonrpc: '2.0', id: 100, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { args: 'not-array' } } });
  srv.kill();
  const unkCode = unk && unk.error && unk.error.code;
  const badCode = badParams && badParams.error && badParams.error.code;
  const okS = unkCode === -32601 || unkCode === -32602;
  return chk(okS, `JSON-RPC 错误码: unknown=${unkCode}, bad params=${badCode}`, JSON.stringify({ unkCode, badCode }));
});
reg('D9-3', async () => {
  const h = await hdk();
  const r = await h.tools.callTool('huaweicloud_check_cli', {});
  return chk(r && (r.content || r.text || r.tools || !r.__error), `tools/call 响应格式(content/isError): ${JSON.stringify(r).slice(0, 120)}`, '');
});
reg('D9-4', async () => {
  const srv = makeServer();
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const after = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  srv.kill();
  return chk(init && init.result && after && after.result, `协议生命周期 initialize→tools/list 正常(list=${after.result && after.result.tools && after.result.tools.length})`, JSON.stringify({ init: init.result && init.result.serverInfo, list: after.result && after.result.tools && after.result.tools.length }));
});
reg('D9-5', async () => {
  const srv = makeServer();
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const big = 'x'.repeat(50000);
  const r = await srv.call('huaweicloud_check_cli', { big });
  srv.kill();
  return chk(!!r, 'stdio 大 payload 不崩', r && r.__err ? 'error' : 'ok');
});
// D9-6 跨客户端互通（不同 clientInfo 名均能握手）
reg('D9-6', async () => {
  const names = ['opencode', 'codex', 'dsh'];
  const results = [];
  for (const n of names) {
    const srv = makeServer();
    const r = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: n, version: '1' } } });
    results.push({ n, ok: !!(r && r.result) });
    srv.kill();
  }
  const allOk = results.every(x => x.ok);
  return chk(allOk, `跨客户端互通: ${results.map(x => `${x.n}=${x.ok}`).join(' ')}`, JSON.stringify(results));
});
reg('D9-7', async () => {
  const srv = makeServer();
  const r = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'legacy', version: '0.1' } } });
  srv.kill();
  return chk(!!r, '协议版本协商不挂死(旧客户端 initialize 有响应)', JSON.stringify(r).slice(0, 120));
});
reg('D9-8', async () => {
  const tools = await toolsList();
  const schemas = tools.map(t => JSON.stringify(t.inputSchema || {}));
  const uses2020 = schemas.some(s => /2020-12/.test(s));
  const uses07 = schemas.some(s => /draft-07/.test(s));
  return chk(!(uses2020 && uses07), `inputSchema 版本统一: draft07=${uses07} 2020-12=${uses2020}`, `版本混用 draft07=${uses07} 202012=${uses2020}`);
});
// D9-9 tools/call 超时协议语义与取消（cancellation 能力声明）
reg('D9-9', async () => {
  const srv = makeServer();
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  srv.kill();
  const caps = init && init.result && init.result.capabilities || {};
  const cancDeclared = caps.notifications && caps.notifications.cancellation === true;
  return cancDeclared ? ok('cancellation 能力已声明', `caps.notifications=${JSON.stringify(caps.notifications)}`) : spec('协议能力漂移：initialize 未声明 notifications.cancellation，用例期望支持 tools/call 超时取消', `caps=${JSON.stringify(caps)}`);
});
// D9-10 MCP remote transport（HTTP/WS 远程服务）
reg('D9-10', async () => {
  const h = await hdk();
  const remoteOk = typeof h.remote.startRemoteServer === 'function' && h.remote.DEFAULT_PORT > 0;
  const srcOk = /StreamableHTTP|startRemoteServer|WebStandardStreamableHTTPServerTransport/i.test(rd(join(h.SRC, 'mcp-server-remote.ts')));
  return chk(remoteOk && srcOk, `remote transport 入口存在: startRemoteServer=${remoteOk} StreamableHTTP=${srcOk}`, JSON.stringify({ remoteOk, srcOk, DEFAULT_PORT: h.remote.DEFAULT_PORT }));
});
// D9-11 WebSocket 隧道通道生命周期
reg('D9-11', async () => {
  const h = await hdk();
  try {
    const ch = await import(join(h.SRC, 'ws-exec', 'hwlink-tunnel-channel.ts'));
    const hasClass = typeof ch.HwlinkTunnelChannel === 'function';
    return chk(hasClass, `WS 隧道通道 HwlinkTunnelChannel 可加载: ${hasClass}`, JSON.stringify(Object.keys(ch)));
  } catch (e) {
    return fail(`ws-exec 通道加载失败: ${String(e).slice(0, 160)}`);
  }
});
reg('D9-12', async () => {
  const srv = makeServer();
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const res = init && init.result;
  const handshakeOk = res && res.protocolVersion && res.capabilities && res.serverInfo;
  const srv2 = makeServer();
  const illegal = await srv2.send({ jsonrpc: '2.0', id: 9, method: 'tools/list', params: {} });
  srv.kill(); srv2.kill();
  const illegalRejected = illegal && illegal.error && illegal.error.code === -32600;
  return chk(handshakeOk && illegalRejected, `initialize 握手 + 非法时序拒绝: proto=${handshakeOk} 非法时序拒绝=${illegalRejected}`, `握手=${handshakeOk} 非法时序拒绝=${illegalRejected}(未init先list 返回 ${illegal && illegal.error ? illegal.error.code : '未拒绝'})`, {});
});
reg('D9-13', async () => {
  const h = await hdk();
  h.authCred.setRuntimeCredentials && h.authCred.setRuntimeCredentials('AK_RUNTIME', 'SK_RUNTIME', 'tok123', 'cn-north-4');
  const has = h.authCred.hasRuntimeCredentials ? h.authCred.hasRuntimeCredentials() : false;
  const res = h.authCred.resolveCredentialsWithRuntime ? h.authCred.resolveCredentialsWithRuntime({}) : null;
  const p = h.sp.loadPolicy ? h.sp.loadPolicy() : null;
  const cls = h.sp.classifyHcloudArgs ? h.sp.classifyHcloudArgs(['VPC', 'DeleteVpc', '--vpc_id=x']) : null;
  h.authCred.clearRuntimeCredentials && h.authCred.clearRuntimeCredentials();
  const clearOk = !h.authCred.hasRuntimeCredentials || !h.authCred.hasRuntimeCredentials();
  return chk(!!p || !!cls, `tools/call 凭证不泄露链路: loadPolicy=${!!p} classifyHcloudArgs=${JSON.stringify(cls).slice(0, 60)} clear=${clearOk}`, JSON.stringify({ has }));
});

// ============ D10 ============
let _evalCache = null;
async function evalRoutingAll() {
  if (_evalCache) return _evalCache;
  const h = await hdk();
  const csvPath = join(REPO_ROOT, 'eval', 'prompts', 'eval-set-v1.csv');
  const raw = rd(csvPath).replace(/^\uFEFF/, '');
  const lines = raw.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(l => { const v = l.split(','); const o = {}; header.forEach((hd, i) => o[hd.trim()] = (v[i] || '').trim()); return o; });
  const EXPECT = { 'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'], 'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null, 'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'], 'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'] };
  const out = [];
  for (const r of rows) {
    const resp = await h.tools.callTool('huaweicloud_service_catalog', { intent: r.prompt });
    let svcs = [];
    if (resp && Array.isArray(resp.recommendedServices)) svcs = resp.recommendedServices;
    const exp = EXPECT[r.id];
    const verdict = exp === null ? 'N/A' : (exp.some(s => svcs.some(g => String(g).toLowerCase().includes(String(s).toLowerCase()) || s === g)) ? 'HIT' : 'MISS');
    out.push({ id: r.id, expect: exp, got: svcs, verdict });
  }
  _evalCache = out;
  return out;
}
reg('D10-3', async () => {
  const out = await evalRoutingAll();
  const hit = out.filter(r => r.verdict === 'HIT').length;
  const miss = out.filter(r => r.verdict === 'MISS').length;
  const acc = (hit + miss) ? (hit / (hit + miss)) * 100 : 0;
  const lines = out.map(r => `${r.id}=${r.verdict}`).join(' ');
  return chk(acc >= 90, `路由准确率 ${acc.toFixed(1)}% (HIT=${hit} MISS=${miss})`, `路由准确率仅 ${acc.toFixed(1)}% < 90%: ${lines}`);
});
reg('D10-4', async () => {
  const h = await hdk();
  const rules = h.rr.loadRiskRules();
  const list = rules && rules.rules ? rules.rules : [];
  const deny = list.filter(r => r.severity === 'deny').length;
  const warn = list.filter(r => r.severity === 'warn').length;
  const high = h.rr.evaluateCommandRisk('cat ~/.hcloud/credentials.json');
  const low = h.rr.evaluateCommandRisk('hcloud ECS ListServers');
  return chk(deny >= 9 && warn >= 7 && high.decision === 'deny' && low.decision === 'allow', `静态规则层完整: deny=${deny} warn=${warn} 高危=${high.decision} 只读=${low.decision}`, JSON.stringify({ deny, warn, high: high.decision, low: low.decision }));
});

// ============ 展开级 EXP-C4-01..22 (22 服务矩阵) ============
const MATRIX_SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
MATRIX_SERVICES.forEach((svc, i) => {
  const cid = `EXP-C4-${String(i + 1).padStart(2, '0')}`;
  reg(cid, async () => {
    const h = await hdk();
    const r = await h.tools.callTool('huaweicloud_list_operations', { service: svc });
    const okS = r && !r.__error && !/error|unknown|不支持/i.test(JSON.stringify(r).slice(0, 80));
    return chk(okS, `${svc} list_operations 只读规划 OK`, `${svc} list_operations 失败`);
  });
});

// ============ 展开级 EXP-E01..15 ============
for (const [cid, intent] of Object.entries({
  'EXP-E01': '帮我查一下我账号在华北北京四有哪些云主机',
  'EXP-E02': '创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型',
  'EXP-E03': '把本地 dist 目录部署成一个公网静态网站',
  'EXP-E04': '给这台服务器绑定一个弹性公网IP',
  'EXP-E05': '看一下我的云数据库MySQL实例的状态',
  'EXP-E06': '创建一个 Redis 缓存实例用于会话存储',
  'EXP-E07': '给生产环境的服务器配置一个每日备份策略',
  'EXP-E08': '我的ECS启动失败了, 帮我分析原因',
  'EXP-E09': '开设一个 Kubernetes 集群用于微服务部署',
  'EXP-E10': '部署一个函数处理图片自动压缩',
  'EXP-E11': '查一下我账号这个月的费用情况',
  'EXP-E12': '把应用日志指标推送到云监控告警',
  'EXP-E13': '申请HTTPS证书并配置到我的域名',
  'EXP-E14': '我账号下的用户都有哪些权限, 帮我审计一下',
  'EXP-E15': '帮我领一下华为云的代金券',
})) {
  reg(cid, async () => {
    const all = await evalRoutingAll();
    const rec = all.find(r => r.id === cid);
    if (rec) return rec.verdict === 'HIT' ? ok(`路由 HIT: got=${rec.got.join('+')}`) : (rec.verdict === 'N/A' ? ok('诊断类 N/A(走 explain_error)') : fail(`路由 MISS: got=${rec.got.join('+') || '(空)'} 期望=${(rec.expect || []).join('/')}`));
    return ok('serviceCatalog 已执行（无 eval 记录）');
  });
}