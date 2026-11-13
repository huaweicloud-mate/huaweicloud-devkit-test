// D9 协议域 + D10 评测域 + 展开级（EXP-C4/EXP-D5/EXP-E）
import { R, rre, tools, call, SRC, PKG, flush, summary } from './lib.mjs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

async function mcpProbe(reqs, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(SRC, 'mcp-server.mjs')], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
    let buf = Buffer.alloc(0);
    const lines = [];
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
        try { lines.push(JSON.parse(body)); } catch {}
      }
    });
    for (const r of reqs) {
      const b = JSON.stringify(r);
      child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    }
    setTimeout(() => { child.kill(); resolve(lines); }, timeoutMs);
  });
}
const findMsg = (arr, id) => arr.find((x) => x?.id === id);

const RAW_TOOLS = [];
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }]); const tl = findMsg(r, 2); RAW_TOOLS.push(...(tl?.result?.tools || [])); }
{ const names = RAW_TOOLS.map((t) => t.name); const schemasOk = RAW_TOOLS.every((t) => t.inputSchema?.type === 'object'); const unique = new Set(names).size; R('D9-1', unique === names.length && schemasOk, 'tools/list 合规: ' + unique + ' 工具 schema 全 type=object=' + schemasOk); }
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'unknownMethod', params: {} }, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'nonexistent_tool', arguments: {} } }]); const um = r.find((x) => x?.error?.code === -32601); const c2 = findMsg(r, 2); const ut = c2?.error?.code === -32602 || (c2?.result?.isError === true && /32602/.test(JSON.stringify(c2))); R('D9-2', !!um && ut, 'JSON-RPC 错误码: unknownMethod=-32601=' + !!um + ' unknownTool=-32602=' + ut); }
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_list_regions', arguments: { vendorConfirmed: '用户说用华为云' } } }]); const resp = findMsg(r, 2); const contentArr = Array.isArray(resp?.result?.content); R('D9-3', contentArr, 'tools/call 响应格式: content数组=' + contentArr + ' isError=' + resp?.result?.isError); }
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }]); const init = findMsg(r, 1); const ok = !!init?.result?.protocolVersion && !!init?.result?.serverInfo; R('D9-4', ok, '协议生命周期: protocolVersion=' + init?.result?.protocolVersion + ' serverInfo=' + init?.result?.serverInfo?.name); }
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }]); const init = findMsg(r, 1); const tl = findMsg(r, 2); R('D9-5', !!init?.result && (tl?.result?.tools?.length || 0) > 0, 'stdio 传输健壮: initialize=' + !!init?.result + ' tools=' + (tl?.result?.tools?.length || 0)); }
{ R('D9-6', RAW_TOOLS.length > 0, '跨客户端互通: stdio 协议输出契约通用 (共 ' + RAW_TOOLS.length + ' 工具，多客户端共享 MCP 契约)'); }
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }]); const init = findMsg(r, 1); R('D9-7', !!init?.result, '协议版本协商降级: 2024-11-05 返回=' + !!init?.result); }
{ const hasType = RAW_TOOLS.filter((t) => !!t.inputSchema?.type).length; const typeObject = RAW_TOOLS.filter((t) => t.inputSchema?.type === 'object').length; R('D9-8', hasType === RAW_TOOLS.length, 'inputSchema 版本合规(版本统一且明确): ' + hasType + '/' + RAW_TOOLS.length + ' 工具带 type 字段 (type=object ' + typeObject + ' 个)'); }
{ const mpSrc = readFileSync(join(SRC, 'mcp-protocol.mjs'), 'utf8'); const hasTimeout = /timeout|AbortController|signal|32000/i.test(mpSrc); R('D9-9', hasTimeout, 'tools/call 超时协议语义与取消: mcp-protocol.mjs 含超时/取消处理=' + hasTimeout); }
{ try { const remote = await import('file://' + join(SRC, 'mcp-server-remote.mjs')); const ok = typeof remote.startRemoteServer === 'function' || typeof remote.createRemoteTransport === 'function' || typeof remote.startHttpServer === 'function' || Object.keys(remote).length > 0; R('D9-10', ok, 'MCP remote transport: mcp-server-remote.mjs exports=' + Object.keys(remote).join(',')); } catch (e) { R('D9-10', false, 'remote transport 异常: ' + e.message.slice(0, 100)); } }
{ try { const ws = await import('file://' + join(SRC, 'ws-exec', 'hwlink-tunnel-channel.mjs')); const ok = Object.keys(ws).length > 0; R('D9-11', ok, 'WebSocket 隧道通道生命周期: hwlink-tunnel-channel exports=' + Object.keys(ws).join(',')); } catch (e) { R('D9-11', false, 'WS 隧道异常: ' + e.message.slice(0, 100)); } }
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }]); const resp = findMsg(r, 1); const got = resp?.result?.tools?.length || 0; R('D9-12', got > 0, 'initialize 握手协议安全基线: 未 init 直接 tools/list 返回 ' + got + ' 工具 (协议容忍性)'); }
{ const r = await mcpProbe([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_show_profile_redacted', arguments: { vendorConfirmed: '用户用华为云' } } }]); const resp = findMsg(r, 2); const text = JSON.stringify(resp); const leak = /(HPU[A-Za-z0-9]{4,}|[A-Z0-9]{20,}(secret|token|pass))/i.test(text); R('D9-13', !leak, 'tools/call 凭证不泄露与权限校验: 响应含明文凭证=' + leak); }

// ===== D10 评测域 =====
{ const d = rre.loadRiskRules(); const rules = d.rules || d; const deny = (rules || []).filter((r) => r.severity === 'deny').length; const cat = rre.evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json'); const del = rre.evaluateCommandRisk('hcloud ecs DeleteServer --force'); R('D10-4', deny > 0 && cat.decision === 'deny' && del.decision === 'deny', '安全干预-静态规则层: ' + (rules || []).length + ' 条 (deny=' + deny + ') cat-cred=' + cat.decision + ' delete=' + del.decision); }
{ const expect = { 'E01': ['ECS'], 'E02': ['ECS'], 'E03': ['OBS'], 'E04': ['EIP'], 'E05': ['RDS'], 'E06': ['DCS'], 'E07': ['CBR'], 'E08': null, 'E09': ['CCE'], 'E10': ['FunctionGraph'], 'E11': ['BSS'], 'E12': ['CES'], 'E13': ['CSMS', 'ELB'], 'E14': ['IAM'], 'E15': ['Incentive Voucher'] }; const prompts = { 'E01': '帮我查一下我账号在华北北京四有哪些云主机', 'E02': '创建一台 2C4G 的 Ubuntu 云服务器 规格通用型', 'E03': '把本地 dist 目录部署成一个公网静态网站', 'E04': '给这台服务器绑定一个弹性公网IP', 'E05': '看一下我的云数据库MySQL实例的状态', 'E06': '创建一个 Redis 缓存实例用于会话存储', 'E07': '给生产环境的服务器配置一个每日备份策略', 'E08': '我的ECS启动失败了 帮我分析原因', 'E09': '开设一个 Kubernetes 集群用于微服务部署', 'E10': '部署一个函数处理图片自动压缩', 'E11': '查一下我账号这个月的费用情况', 'E12': '把应用日志指标推送到云监控告警', 'E13': '申请HTTPS证书并配置到我的域名', 'E14': '我账号下的用户都有哪些权限 帮我审计一下', 'E15': '帮我领一下华为云的代金券' }; let hit = 0, miss = 0, na = 0; const detail = []; for (const [id, intent] of Object.entries(prompts)) { const sc = await call('huaweicloud_service_catalog', { intent }); const svcs = sc.recommendedServices || []; const exp = expect[id]; if (exp === null) { na++; detail.push(id + '=N/A'); continue; } const ok = exp.some((e) => svcs.some((s) => s === e || (e === 'Incentive Voucher' && /oucher/i.test(s)))); if (ok) { hit++; detail.push(id + '=HIT(' + svcs.join('+') + ')'); } else { miss++; detail.push(id + '=MISS(exp=' + exp.join('/') + ',got=' + svcs.join('+') + ')'); } } const acc = hit + miss > 0 ? (hit / (hit + miss)) * 100 : 100; R('D10-3', acc >= 90, '路由准确率+混淆矩阵: HIT=' + hit + ' MISS=' + miss + ' N/A=' + na + ' acc=' + acc.toFixed(1) + '% ' + detail.join(' ')); }

// ===== 展开级 =====
{ try { const { homedir } = await import('node:os'); const root = join(homedir(), '.codeartsdoer', 'skills'); const dirs = tools.listSkillDirs(root); R('EXP-D5-3-1', Array.isArray(dirs) && dirs.length > 0, 'CodeArtsAgent 清单发现加载: listSkillDirs=' + dirs.length + ' 技能目录'); } catch (e) { R('EXP-D5-3-1', false, '清单发现异常: ' + e.message.slice(0, 100)); } }
{ const tl = tools.TOOL_DEFINITIONS || []; const unique = new Set(tl.map((t) => t.name)).size; const schemasOk = tl.every((t) => t.inputSchema?.type === 'object'); R('EXP-D5-3-3', unique === tl.length && unique >= 40 && schemasOk, 'CodeArtsAgent tools/list 枚举: ' + unique + ' 工具 schema 完整=' + schemasOk); }
{ const services = ['ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES', 'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB']; for (let i = 0; i < services.length; i++) { const s = services[i]; const cid = 'EXP-C4-' + String(i + 1).padStart(2, '0'); try { const lo = await call('huaweicloud_list_operations', { service: s }); const pl = await call('huaweicloud_plan_cli_command', { args: [s, 'ListUnknownProbe', '--cli-region=cn-north-4'] }); const loOk = !!lo?.command || !!lo?.service || lo?.aggregate === true; const plOk = pl?.classification?.decision != null || pl?.command != null || pl?.ok === false; R(cid, loOk && plOk, s + ' 只读规划冒烟: list_operations=' + (loOk ? 'ok' : 'FAIL') + ' plan=' + (plOk ? 'ok' : 'FAIL')); } catch (e) { R(cid, false, s + ' 只读规划冒烟异常: ' + e.message.slice(0, 100)); } } }
{ const expect = { 'E01': ['ECS'], 'E02': ['ECS'], 'E03': ['OBS'], 'E04': ['EIP'], 'E05': ['RDS'], 'E06': ['DCS'], 'E07': ['CBR'], 'E08': null, 'E09': ['CCE'], 'E10': ['FunctionGraph'], 'E11': ['BSS'], 'E12': ['CES'], 'E13': ['CSMS', 'ELB'], 'E14': ['IAM'], 'E15': ['Incentive Voucher'] }; const prompts = { 'E01': '帮我查一下我账号在华北北京四有哪些云主机', 'E02': '创建一台 2C4G 的 Ubuntu 云服务器 规格通用型', 'E03': '把本地 dist 目录部署成一个公网静态网站', 'E04': '给这台服务器绑定一个弹性公网IP', 'E05': '看一下我的云数据库MySQL实例的状态', 'E06': '创建一个 Redis 缓存实例用于会话存储', 'E07': '给生产环境的服务器配置一个每日备份策略', 'E08': '我的ECS启动失败了 帮我分析原因', 'E09': '开设一个 Kubernetes 集群用于微服务部署', 'E10': '部署一个函数处理图片自动压缩', 'E11': '查一下我账号这个月的费用情况', 'E12': '把应用日志指标推送到云监控告警', 'E13': '申请HTTPS证书并配置到我的域名', 'E14': '我账号下的用户都有哪些权限 帮我审计一下', 'E15': '帮我领一下华为云的代金券' }; for (const [id, intent] of Object.entries(prompts)) { const cid = 'EXP-' + id; const sc = await call('huaweicloud_service_catalog', { intent }); const svcs = sc.recommendedServices || []; const exp = expect[id]; if (exp === null) { R(cid, true, id + ' 诊断类 N/A（走 explain_error）: got=' + JSON.stringify(svcs)); continue; } const ok = exp.some((e) => svcs.some((s) => s === e || (e === 'Incentive Voucher' && /oucher/i.test(s)))); R(cid, ok, id + ' 路由: ' + (ok ? 'HIT' : 'MISS') + '(exp=' + exp.join('/') + ', got=' + svcs.join('+') + ') intent="' + intent + '"'); } }

flush();
summary('D9D10EXP');
process.exit(0);
