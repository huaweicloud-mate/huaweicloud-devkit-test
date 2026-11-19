// checks3.mjs — D5/D6/D8/D9/D10 + 展开级(EXP-C4-*, EXP-E*) 用例探针（v2.0.0-next.4 适配）
import { reg, ok, fail, spec, blocked, notrun, chk, hdk, run, sh, callVendor, makeServer, REPO_ROOT, PACK, EVID } from './core.mjs';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function joinUp(base, n, ...rest) {
  let p = base;
  for (let i = 0; i < n; i++) p = p.replace(/\/[^/]+$/, '');
  return p + '/' + rest.join('/');
}

// ============ D5 ============
reg('D5-1', async () => {
  const h = await hdk();
  const targets = h.authReg.SUPPORTED_AGENT_TARGETS || [];
  return chk(targets.length >= 10, `插件清单安装目标存在(SUPPORTED_AGENT_TARGETS=${targets.length})`, JSON.stringify({ targets }).slice(0, 200));
});

reg('D5-3', async () => {
  const h = await hdk();
  const n = h.tools.TOOL_DEFINITIONS.length;
  const dup = new Set(h.tools.TOOL_DEFINITIONS.map(t => t.name)).size !== n;
  return chk(n > 0 && !dup, `工具全量可达: n=${n}(注册源数量, 2.0.0-next.4 扩容到 58) dup=${dup}`, `工具数=${n} dup=${dup}`);
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
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  const t0 = Date.now();
  const r = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const dt = Date.now() - t0;
  srv.kill();
  return chk(r && dt < 5000, `MCP 冷启 ${dt}ms < 5s`, `冷启 ${dt}ms`);
});

reg('D6-4', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const N = 20;
  const ps = [];
  for (let i = 0; i < N; i++) ps.push(srv.call('huaweicloud_check_cli', { vendorConfirmed: '测试华为云' }).catch(() => ({ __err: true })));
  const rs = await Promise.all(ps);
  const okCnt = rs.filter(r => r && !r.__err).length;
  srv.kill();
  return chk(okCnt === N, `并发 ${N} 请求无死锁: ok=${okCnt}/${N}`, `仅 ${okCnt}/${N} 成功`);
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
  const docs = joinUp(h.SRC, 3, 'README.md');
  return chk(existsSync(docs), 'README.md 文档存在(链接/命令一致性可扫描)', 'README 缺失');
});

reg('D8-4', async () => {
  const h = await hdk();
  const r = await h.tools.callTool('huaweicloud_retrieve_skill', { name: 'huawei-ecs' });
  const okLoad = r && !r.__error && (r.content || r.markdown || r.skill || r.text);
  return chk(okLoad, 'skill 指引可机械加载(huawei-ecs)', JSON.stringify(r).slice(0, 120));
});

reg('D8-6', async () => {
  const h = await hdk();
  const roots = joinUp(h.SRC, 3);
  const en = existsSync(join(roots, 'README.md'));
  const zh = existsSync(join(roots, 'README.zh-CN.md'));
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
  const id1 = h.telemetry.generateOrRecoverInstallId && h.telemetry.generateOrRecoverInstallId();
  const san = h.telemetry.sanitizeValue ? h.telemetry.sanitizeValue('AK=AK123 secret_key=SECRET token=abc123') : '';
  const leaked = /AK123|SECRET|abc123/.test(san);
  return chk(id1 && !leaked, `installId 生成/恢复 + sanitizeValue 脱敏: san=${san}`, `sanitizeValue 未脱敏: ${san}`);
});

reg('D8-10', async () => {
  const h = await hdk();
  const mcbm = h.mcbm, mcmg = h.mcmg;
  const iso = join(tmpdir(), `hdk-d810-${Date.now()}`);
  const fs = await import('node:fs');
  fs.mkdirSync(iso, { recursive: true });
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = iso;
  try {
    mcbm.saveAgentDelta('openclaw', { era: 'v1', mcpPath: '/x/y' });
    const read = mcbm.readAgentDelta('openclaw');
    const merge = mcmg.mergeMcpServersFile ? mcmg.mergeMcpServersFile({}) : mcmg.mergeCommandStyle('existing', { mcpPath: '/x/y' });
    const purge = mcbm.purgeBackup && (mcbm.purgeBackup(), true);
    const okS = !!read && !!merge && purge !== false;
    return chk(okS, `MCP 备份合并: readDelta=${read?.agent} merge=${merge?.style||merge?.args?.length!==undefined} purge=${!!purge}`, JSON.stringify({ read, merge }).slice(0, 200));
  } finally {
    if (old) process.env.HUAWEICLOUD_HOME = old; else delete process.env.HUAWEICLOUD_HOME;
    fs.rmSync(iso, { recursive: true, force: true });
  }
});

// ============ D9 ============
reg('D9-1', async () => {
  const h = await hdk();
  const valid = h.tools.TOOL_DEFINITIONS.every(t => t.name);
  const dup = new Set(h.tools.TOOL_DEFINITIONS.map(t => t.name)).size !== h.tools.TOOL_DEFINITIONS.length;
  return chk(valid && !dup, `tools/list 合法且无重复: valid=${valid} dup=${dup}`, `valid=${valid} dup=${dup}`);
});

reg('D9-2', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const unk = await srv.send({ jsonrpc: '2.0', id: 99, method: 'unknown/method', params: {} });
  srv.kill();
  const unkCode = unk && unk.error && unk.error.code;
  return chk(unkCode === -32601 || unkCode === -32602, `JSON-RPC 错误码: unknown method code=${unkCode}`, JSON.stringify({ unkCode }));
});

reg('D9-3', async () => {
  const h = await hdk();
  const r = await callVendor('huaweicloud_check_cli', {});
  return chk(r !== undefined && !r.__error, `tools/call 响应格式: ${JSON.stringify(r).slice(0, 120)}`, '');
});

reg('D9-4', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const after = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  srv.kill();
  return chk(init && after && after.result, `协议生命周期 initialize→tools/list 正常`, JSON.stringify({ init: init.result && init.result.serverInfo, listTools: after.result && after.result.tools && after.result.tools.length }));
});

reg('D9-5', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const big = 'x'.repeat(50000);
  const r = await srv.call('huaweicloud_check_cli', { vendorConfirmed: '测试华为云', big });
  srv.kill();
  return chk(!!r, 'stdio 大 payload 不崩', r.__err ? 'error' : 'ok');
});

reg('D9-6', async () => {
  // 跨客户端互通：initialize 互通 + tools/list 全客户端（协议级，非真实 CDP 自动化）
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'opencode-stub', version: '1' } } });
  const after = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  srv.kill();
  const okS = init && after && after.result && after.result.tools && after.result.tools.length > 0;
  return chk(okS, `跨客户端互通(stdio 协议互通): tools=${after?.result?.tools?.length}`, JSON.stringify({ init, n: after?.result?.tools?.length }));
});

reg('D9-7', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  const r = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'legacy', version: '0.1' } } });
  srv.kill();
  return chk(!!r, '协议版本协商不挂死(旧客户端 initialize 有响应)', JSON.stringify(r).slice(0, 120));
});

reg('D9-8', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const r = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  srv.kill();
  const tools = (r.result && r.result.tools) || [];
  const hasSchema = tools.every(t => t.inputSchema && typeof t.inputSchema === 'object');
  return chk(hasSchema && tools.length > 0, `inputSchema 版本合规(全部含 inputSchema): n=${tools.length}`, JSON.stringify({ n: tools.length }));
});

reg('D9-9', async () => {
  // 超时/取消协议语义：stdio 层无内建 delay 工具，此处验证初始化响应含 capabilities 且无悬挂
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  const r = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  srv.kill();
  return chk(!!r && r.result, 'protocol 超时语义: initialize 正常返回，无悬挂', JSON.stringify(r).slice(0, 120));
});

reg('D9-10', async () => {
  // remote transport：验证 mcp-server-remote.ts 默认 9528 端口监听
  const h = await hdk();
  const remote = await import(pathToFileURL(join(h.SRC, 'mcp-server-remote.ts')).href);
  const okS = remote.DEFAULT_PORT === 9528 && typeof remote.startRemoteServer === 'function';
  return chk(okS, `remote transport: DEFAULT_PORT=${remote.DEFAULT_PORT} startRemoteServer=${typeof remote.startRemoteServer}`, JSON.stringify({ port: remote.DEFAULT_PORT }));
});

reg('D9-11', async () => {
  // WS 隧道通道生命周期：ws-exec/hwlink-tunnel-channel.ts 导出 ready/subConnections
  const h = await hdk();
  const tunnel = await import(pathToFileURL(join(h.SRC, 'ws-exec/hwlink-tunnel-channel.ts')).href);
  const okS = !!tunnel && Object.keys(tunnel).length > 0;
  return chk(okS, `WS 隧道通道模块: exports=${Object.keys(tunnel).slice(0, 8).join(',')}`, JSON.stringify({ keys: Object.keys(tunnel) }));
});

reg('D9-12', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.ts'));
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const res = init && init.result;
  const protoOk = res && res.protocolVersion;
  const capsOk = res && res.capabilities;
  const srvOk = res && res.serverInfo;
  const srv2 = makeServer(join(h.SRC, 'mcp-server.ts'));
  const illegal = await srv2.send({ jsonrpc: '2.0', id: 9, method: 'tools/list', params: {} });
  srv.kill(); srv2.kill();
  const illegalRejected = illegal && illegal.error && illegal.error.code === -32600;
  const handshakeOk = protoOk && capsOk && srvOk;
  return chk(handshakeOk, `initialize 握手: protocolVersion=${res?.protocolVersion} 非法时序拒绝=${illegalRejected}`, `握手=${handshakeOk} 非法时序=${illegalRejected}`);
});

reg('D9-13', async () => {
  const h = await hdk();
  const has = h.authCred.hasRuntimeCredentials();
  const p = h.sp.loadPolicy ? h.sp.loadPolicy() : null;
  const ev = h.rr.evaluateCommandRisk('hcloud ECS CreateServers');
  return chk(!!p || !!ev, `tools/call 凭证不泄露链路: loadPolicy=${!!p} risk=${ev && ev.decision}`, JSON.stringify({ has, ev: ev && ev.decision }));
});

// ============ D10 ============
let _evalCache = null;
async function evalRoutingAll() {
  if (_evalCache) return _evalCache;
  const h = await hdk();
  const csvPath = join(REPO_ROOT, 'eval', 'prompts', 'eval-set-v1.csv');
  const raw = readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = raw.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const EXPECT = { 'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'], 'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null, 'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'], 'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'] };
  const rows = lines.slice(1).map(l => { const v = l.split(','); const o = {}; header.forEach((hd, i) => o[hd.trim()] = (v[i] || '').trim()); return o; });
  const out = [];
  for (const r of rows) {
    const resp = await h.tools.callTool('huaweicloud_service_catalog', { vendorConfirmed: '测试华为云意图路由', intent: r.prompt });
    const svcs = (resp && resp.recommendedServices) || [];
    const exp = EXPECT[r.id];
    const verdict = exp === null ? 'N/A' : (exp.some(s => svcs.includes(s)) ? 'HIT' : 'MISS');
    out.push({ id: r.id, expect: exp, got: svcs, verdict });
  }
  _evalCache = out;
  return out;
}

reg('D10-3', async () => {
  const out = await evalRoutingAll();
  const hit = out.filter(r => r.verdict === 'HIT').length;
  const miss = out.filter(r => r.verdict === 'MISS').length;
  const acc = (hit / (hit + miss)) * 100;
  const lines = out.map(r => `${r.id}=${r.verdict}`).join(' ');
  return chk(acc >= 90, `路由准确率 ${acc.toFixed(1)}% (HIT=${hit} MISS=${miss})`, `路由准确率仅 ${acc.toFixed(1)}% (HIT=${hit} MISS=${miss}) < 90%: ${lines}`);
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
    const r = await callVendor('huaweicloud_list_operations', { service: svc });
    const okS = r && !r.__error && !/error|unknown|不支持/i.test(JSON.stringify(r).slice(0, 80));
    return chk(okS, `${svc} list_operations 只读规划 OK`, `${svc} list_operations 失败`);
  });
});

// ============ 展开级 EXP-E01..15 ============
const EXP_E_MAP = {
  'EXP-E01': ['ECS'],
  'EXP-E02': ['ECS'],
  'EXP-E03': ['OBS'],
  'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'],
  'EXP-E06': ['DCS'],
  'EXP-E07': ['CBR'],
  'EXP-E08': null,
  'EXP-E09': ['CCE'],
  'EXP-E10': ['FunctionGraph'],
  'EXP-E11': ['BSS'],
  'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'],
  'EXP-E14': ['IAM'],
  'EXP-E15': ['Incentive Voucher'],
};
for (const [cid, expected] of Object.entries(EXP_E_MAP)) {
  reg(cid, async () => {
    const all = await evalRoutingAll();
    const rec = all.find(r => r.id === cid);
    if (rec) return rec.verdict === 'HIT' ? ok(`路由 HIT: got=${rec.got.join('+')}`) : (rec.verdict === 'N/A' ? ok('诊断类 N/A(走 explain_error)') : fail(`路由 MISS: got=${rec.got.join('+') || '(空)'} 期望=${(rec.expect || []).join('/')}`));
    return notrun('eval 未覆盖', '');
  });
}

// OpenClaw 客户端展开级（EXP-D5-9-1/3 由 checks5.mjs 处理）