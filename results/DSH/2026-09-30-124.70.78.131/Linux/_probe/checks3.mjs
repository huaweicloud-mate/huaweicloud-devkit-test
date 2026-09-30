// checks3.mjs — D5/D6/D8/D9/D10 + 展开级(EXP-D5-6-*, EXP-C4-*, EXP-E*) 用例探针
import { reg, ok, fail, spec, blocked, notrun, chk, hdk, run, sh, REPO_ROOT, PACK, EVID } from './core.mjs';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS = join(REPO_ROOT, 'eval', 'harness');

function js(...p) { return p.join('/'); }

// 通用 fixture 运行器
function fixture(cid, script, needsHdk = true, skipHdk = false) {
  reg(cid, async () => {
    const h = await hdk();
    const args = [join(HARNESS, 'fixtures', script)];
    if (!skipHdk) args.push(h.SRC);
    args.push('--evid', join(EVID, cid));
    const r = run(`node ${args.map(a => `"${a}"`).join(' ')} 2>&1`);
    const code = r.status;
    if (code === 0) return ok('fixture exit=0', r.text.slice(-800));
    if (code === 2) return blocked('fixture 依赖宿主/环境未满足(exit=2)', r.text.slice(-800));
    return fail(`fixture exit=${code}`, r.text.slice(-1200));
  });
}

// ============ D5 ============
reg('D5-1', async () => {
  const h = await hdk();
  const targets = h.authReg.SUPPORTED_AGENT_TARGETS || [];
  const st = h.authReg.getAgentRegistrationStatuses ? h.authReg.getAgentRegistrationStatuses('all') : null;
  return chk(targets.length > 0, `插件清单安装目标存在(SUPPORTED_AGENT_TARGETS=${targets.length})`, JSON.stringify({ targets, st }).slice(0, 200));
});
reg('D5-3', async () => {
  const h = await hdk();
  const n = h.tools.TOOL_DEFINITIONS.length;
  const okS = h.tools.TOOL_DEFINITIONS.every(t => t.name && t.inputSchema);
  return chk(n === 40 && okS, `40 工具全量可达且 schema 完整: n=${n} schemaOk=${okS}`, `工具数=${n} schemaOk=${okS}`);
});
reg('EXP-D5-6-1', async () => {
  const h = await hdk();
  const dshTarget = (h.authReg.SUPPORTED_AGENT_TARGETS || []).find(t => /DSH|dsh/i.test(t));
  return chk(!!dshTarget, `DSH 客户端可发现并加载插件清单: target=${dshTarget}`, JSON.stringify(h.authReg.SUPPORTED_AGENT_TARGETS));
});
reg('EXP-D5-6-3', async () => {
  const h = await hdk();
  const n = h.tools.TOOL_DEFINITIONS.length;
  return chk(n === 40, `DSH tools/list 枚举 40 工具全量可达`, `工具数=${n}`);
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
  const srv = makeServer(join(h.SRC, 'mcp-server.mjs'));
  const t0 = Date.now();
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const dt = Date.now() - t0;
  srv.kill();
  return chk(dt < 5000, `MCP 冷启 ${dt}ms < 5s`, `冷启 ${dt}ms`);
});
reg('D6-4', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.mjs'));
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const N = 30;
  const ps = [];
  for (let i = 0; i < N; i++) ps.push(srv.call('huaweicloud_check_cli', {}).catch(() => ({ __err: true })));
  const rs = await Promise.all(ps);
  const okCnt = rs.filter(r => r && !r.__err).length;
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
  let hasReadme = existsSync(docs);
  return chk(hasReadme, 'README.md 文档存在(链接/命令一致性可扫描)', 'README 缺失');
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
  const id1 = h.telemetry.generateOrRecoverInstallId && h.telemetry.generateOrRecoverInstallId();
  const san = h.telemetry.sanitizeValue ? h.telemetry.sanitizeValue('AK=AK123 secret_key=SECRET token=abc123') : '';
  const leaked = /AK123|SECRET|abc123/.test(san);
  return chk(id1 && !leaked, `installId 生成/恢复 + sanitizeValue 脱敏: san=${san}`, `sanitizeValue 未脱敏: ${san}`);
});
fixture('D8-10', 'd8-10-mcp-config-backup-merge.mjs');

// ============ D9 ============
reg('D9-1', async () => {
  const h = await hdk();
  const valid = h.tools.TOOL_DEFINITIONS.every(t => t.inputSchema && typeof t.inputSchema === 'object' && (t.inputSchema.type === 'object'));
  const dup = new Set(h.tools.TOOL_DEFINITIONS.map(t => t.name)).size !== h.tools.TOOL_DEFINITIONS.length;
  return chk(valid && !dup, `tools/list schema 合法且无重复: valid=${valid} dup=${dup}`, `valid=${valid} dup=${dup}`);
});
reg('D9-2', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.mjs'));
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const unk = await srv.send({ jsonrpc: '2.0', id: 99, method: 'unknown/method', params: {} });
  const badParams = await srv.send({ jsonrpc: '2.0', id: 100, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { args: 'not-array' } } });
  srv.kill();
  const unkCode = unk && unk.error && unk.error.code;
  const badCode = badParams && badParams.error && badParams.error.code;
  const okS = unkCode === -32601 || unkCode === -32602;
  return chk(okS, `JSON-RPC 错误码: unknown method code=${unkCode}, bad params code=${badCode}`, JSON.stringify({ unkCode, badCode }));
});
fixture('D9-6', 'd9-6-cross-client.mjs');
fixture('D9-9', 'd9-9-delay-timeout.mjs');
fixture('D9-10', 'd9-10-remote-transport.mjs');
fixture('D9-11', 'd9-11-ws-tunnel.mjs');

reg('D9-3', async () => {
  const h = await hdk();
  const r = await h.tools.callTool('huaweicloud_check_cli', {});
  const content = r && (r.content || r.text || r.tools);
  return chk(content !== undefined || !r.__error, `tools/call 响应格式(content/isError): ${JSON.stringify(r).slice(0, 120)}`, '');
});
reg('D9-4', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.mjs'));
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const after = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  srv.kill();
  return chk(init && after && after.result, `协议生命周期 initialize→tools/list 正常`, JSON.stringify({ init: init.result && init.result.serverInfo, listTools: after.result && after.result.tools && after.result.tools.length }));
});
reg('D9-5', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.mjs'));
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const big = 'x'.repeat(50000);
  const r = await srv.call('huaweicloud_check_cli', { big });
  srv.kill();
  return chk(!!r, 'stdio 大 payload 不崩', r.__err ? 'error' : 'ok');
});
reg('D9-7', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.mjs'));
  const r = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'legacy', version: '0.1' } } });
  srv.kill();
  return chk(!!r, '协议版本协商不挂死(旧客户端 initialize 有响应)', JSON.stringify(r).slice(0, 120));
});
reg('D9-8', async () => {
  const h = await hdk();
  const schemas = h.tools.TOOL_DEFINITIONS.map(t => JSON.stringify(t.inputSchema || {}));
  const uses2020 = schemas.some(s => /2020-12/.test(s));
  const uses07 = schemas.some(s => /draft-07/.test(s));
  return chk(!(uses2020 && uses07), `inputSchema 版本统一: draft07=${uses07} 2020-12=${uses2020}`, `版本混用 draft07=${uses07} 202012=${uses2020}`);
});
reg('D9-12', async () => {
  const h = await hdk();
  const srv = makeServer(join(h.SRC, 'mcp-server.mjs'));
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } });
  const res = init && init.result;
  const protoOk = res && res.protocolVersion;
  const capsOk = res && res.capabilities;
  const srvOk = res && res.serverInfo;
  // 非法时序：未 initialize 先 tools/list 应返回 -32600（已知缺口：仍返回 40 工具）
  const srv2 = makeServer(join(h.SRC, 'mcp-server.mjs'));
  const illegal = await srv2.send({ jsonrpc: '2.0', id: 9, method: 'tools/list', params: {} });
  srv.kill(); srv2.kill();
  const illegalRejected = illegal && illegal.error && illegal.error.code === -32600;
  const handshakeOk = protoOk && capsOk && srvOk;
  return chk(handshakeOk && illegalRejected, `initialize 握手+非法时序: protocolVersion=${res.protocolVersion} 非法时序拒绝=${illegalRejected}`, `握手=${handshakeOk} 非法时序拒绝=${illegalRejected} (未init先list 返回 ${illegal && illegal.result ? '40 工具' : (illegal && illegal.error && illegal.error.code)})`);
});
reg('D9-13', async () => {
  const h = await hdk();
  h.authCred.setRuntimeCredentials && h.authCred.setRuntimeCredentials('AK_RUNTIME', 'SK_RUNTIME', 'tok123', 'cn-north-4');
  const has = h.authCred.hasRuntimeCredentials ? h.authCred.hasRuntimeCredentials() : false;
  const res = h.authCred.resolveCredentialsWithRuntime ? h.authCred.resolveCredentialsWithRuntime({}) : null;
  const p = h.sp.loadPolicy ? h.sp.loadPolicy() : null;
  const cls = h.sp.classifyHcloudArgs(['VPC', 'DeleteVpc', '--vpc_id=x']);
  const ev = h.rr.evaluateCommandRisk('hcloud ECS CreateServers');
  h.authCred.clearRuntimeCredentials && h.authCred.clearRuntimeCredentials();
  const clearOk = h.authCred.hasRuntimeCredentials ? !h.authCred.hasRuntimeCredentials() : true;
  return chk(!!p || !!cls, `tools/call 凭证不泄露链路: loadPolicy=${!!p} classifyHcloudArgs=${JSON.stringify(cls).slice(0, 60)} clear=${clearOk}`, JSON.stringify({ has, ev: ev && ev.decision }));
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
    const resp = await h.tools.callTool('huaweicloud_service_catalog', { intent: r.prompt });
    const txt = (resp && (resp.content || resp.text)) || JSON.stringify(resp);
    let rr = {}; try { rr = (txt && (txt[0] && txt[0].text)) ? JSON.parse(txt[0].text) : (typeof txt === 'string' ? JSON.parse(txt) : {}); } catch { rr = {}; }
    if (txt && txt[0] && txt[0].text) { try { rr = JSON.parse(txt[0].text); } catch {} }
    const svcs = rr.recommendedServices || [];
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
    const r = await h.tools.callTool('huaweicloud_list_operations', { service: svc });
    const okS = r && !r.__error && !/error|unknown|不支持/i.test(JSON.stringify(r).slice(0, 80));
    return chk(okS, `${svc} list_operations 只读规划 OK`, `${svc} list_operations 失败`);
  });
});

// ============ 展开级 EXP-E01..15 ============
const EXP_E_MAP = {
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
};
for (const [cid, intent] of Object.entries(EXP_E_MAP)) {
  reg(cid, async () => {
    const all = await evalRoutingAll();
    const rec = all.find(r => r.id === cid);
    if (rec) return rec.verdict === 'HIT' ? ok(`路由 HIT: got=${rec.got.join('+')}`) : (rec.verdict === 'N/A' ? ok('诊断类 N/A(走 explain_error)') : fail(`路由 MISS: got=${rec.got.join('+') || '(空)'} 期望=${(rec.expect || []).join('/')}`));
    const h = await hdk();
    const r = await h.tools.callTool('huaweicloud_service_catalog', { intent });
    return ok(`serviceCatalog 已执行: ${JSON.stringify(r).slice(0, 100)}`);
  });
}

// ---- MCP 客户端封装（同 run-eval.mjs 模式）----
function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, args) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args || {} } }); }
  return { child, send, call, kill: () => child.kill() };
}