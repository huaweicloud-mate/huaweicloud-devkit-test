import { spawn } from 'node:child_process';
import { mcpSession, writeEvidence, writeProbe, PKG, DIST } from './lib.mjs';
import { join } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const HDK = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
const cases = [];
const frame = (o) => { const j = JSON.stringify(o); return 'Content-Length: ' + Buffer.byteLength(j, 'utf8') + '\r\n\r\n' + j; };
const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } };

function rawSession(frames, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [PKG + '/plugins/huaweicloud-core/src/mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env } });
    let out = ''; let done = false;
    const finish = () => { if (done) return; done = true; try { p.kill(); } catch {}; resolve(out); };
    p.stdout.on('data', (d) => { out += d.toString(); if (out.includes('"id":' + frames[frames.length - 1].id)) setTimeout(finish, 300); });
    p.stderr.on('data', () => {});
    frames.forEach((f, i) => setTimeout(() => { try { p.stdin.write(typeof f === 'string' ? f : frame(f)); } catch {} }, 200 + i * 120));
    setTimeout(finish, timeoutMs);
    p.on('exit', () => setTimeout(finish, 100));
  });
}
function parseFrames(s) { const parts = s.split(/Content-Length:\s*\d+\s*\r\n\r\n/).filter(Boolean); const rs = []; for (const p of parts) { try { rs.push(JSON.parse(p)); } catch {} } return rs; }
function errOf(raw, id) { const r = parseFrames(raw).find((x) => x.id === id); return r && r.error; }

cases.push({ id: 'D8-1', title: '文档与能力一致', fn: async () => {
  const files = [HDK + '/README.md', HDK + '/README.zh-CN.md'];
  const bad = [];
  for (const f of files) {
    if (!existsSync(f)) { bad.push({ file: f, reason: 'missing' }); continue; }
    const txt = readFileSync(f, 'utf8');
    const links = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).filter((l) => !/^https?:|^mailto:|^#/.test(l));
    for (const l of links) {
      const clean = l.split('#')[0].trim();
      if (!clean) continue;
      const p = join(f, '..', clean);
      if (!existsSync(p)) bad.push({ file: f.split('/').pop(), link: l });
    }
  }
  const ok = bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: '本地文档链接失效=' + bad.length, result: { bad: bad.slice(0, 20) } };
} });

cases.push({ id: 'D8-4', title: '引导步骤可机械执行', fn: async () => {
  const dir = PKG + '/plugins/huaweicloud-core/skills';
  const files = [];
  for (const n of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const f = join(dir, n.name, 'SKILL.md');
    if (existsSync(f)) files.push(f);
  }
  const vague = [];
  for (const f of files) { const t = readFileSync(f, 'utf8'); if (/TODO|FIXME|待补充|待完善|xxx placeholders/i.test(t)) vague.push(f.split('/').slice(-2)[0]); }
  const ok = files.length >= 20 && vague.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: 'SKILL.md=' + files.length + ' 含含糊标记=' + vague.length + (vague.length ? '：' + vague.join(',') : ''), result: { count: files.length, vague } };
} });

cases.push({ id: 'D8-6', title: '中英文文档一致', fn: async () => {
  const a = readFileSync(HDK + '/README.md', 'utf8');
  const b = readFileSync(HDK + '/README.zh-CN.md', 'utf8');
  const cmds = (t) => new Set([...t.matchAll(/(npx|npm|hcloud|huaweicloud-devkit)[^\n`]*/g)].map((m) => m[0].replace(/\s+/g, ' ').trim()).filter((x) => x.length > 5));
  const ca = cmds(a); const cb = cmds(b);
  const missing = [...ca].filter((x) => ![...cb].some((y) => y.includes(x.split(' ')[0]) && y.includes(x.split(' ')[1] || '')));
  const ok = ca.size > 0 && cb.size > 0 && missing.length <= Math.ceil(ca.size * 0.3);
  return { status: ok ? 'PASS' : 'FAIL', why: '英文命令=' + ca.size + ' 中文命中=' + (ca.size - missing.length) + ' 缺=' + missing.length, result: { english: [...ca].slice(0, 20), missing: missing.slice(0, 10) } };
} });

cases.push({ id: 'D9-1', title: 'tools/list 合规', fn: async () => {
  const s = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
  const tl = s.responses.find((r) => r.id === 2) || {};
  const tools = (tl.result && tl.result.tools) || [];
  const bad = tools.filter((t) => !t.name || !t.inputSchema || t.inputSchema.type !== 'object' || !t.description);
  const dup = tools.length - new Set(tools.map((t) => t.name)).size;
  const ok = tools.length >= 40 && bad.length === 0 && dup === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: '工具=' + tools.length + ' schema非法=' + bad.length + ' 重复=' + dup, result: { count: tools.length, bad: bad.map((x) => x.name), dup } };
} });

cases.push({ id: 'D9-2', title: 'JSON-RPC 错误码', fn: async () => {
  const s1 = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'unknown/method', params: {} }], 45000);
  const e1 = errOf(JSON.stringify(s1.responses), 2) || (s1.responses.find((r) => r.id === 2) || {}).error;
  const s2 = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_run_readonly_command', arguments: {} } }], 45000);
  const r2 = s2.responses.find((r) => r.id === 2) || {};
  const badArgs = !!(r2.error && r2.error.code === -32602) || !!(r2.result && r2.result.isError);
  const raw = await rawSession([init, 'Content-Length: 5\r\n\r\n{bad}'], 15000);
  const pe = parseFrames(raw).find((x) => x.error && x.error.code === -32700);
  const ok = e1 && e1.code === -32601 && badArgs;
  return { status: ok ? 'PASS' : 'FAIL', why: '未知方法=' + (e1 && e1.code) + ' 非法参数=' + (r2.error ? r2.error.code : (r2.result && r2.result.isError)) + ' 解析错误=' + (pe ? pe.error.code : '未响应'), result: { unknown: e1, invalidArgs: r2.error || r2.result, parseError: pe && pe.error } };
} });

cases.push({ id: 'D9-3', title: 'tools/call 响应格式', fn: async () => {
  const s = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } }, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_run_readonly_command', arguments: {} } }], 60000);
  const r2 = s.responses.find((r) => r.id === 2) || {};
  const r3 = s.responses.find((r) => r.id === 3) || {};
  const okSuccess = !!(r2.result && Array.isArray(r2.result.content));
  const okFail = !!(r3.result && (r3.result.isError === true || r3.error)) || !!(r3.error);
  const ok = okSuccess && okFail;
  return { status: ok ? 'PASS' : 'FAIL', why: '成功 content数组=' + okSuccess + ' 失败 isError/错误=' + okFail, result: { success: r2.result && { hasContent: Array.isArray(r2.result.content), isError: r2.result.isError }, fail: r3.result || r3.error } };
} });

cases.push({ id: 'D9-4', title: '协议生命周期', fn: async () => {
  const good = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 45000);
  const okStd = !!(good.responses.find((r) => r.id === 2) || {}).result;
  const bad = await rawSession([{ jsonrpc: '2.0', id: 9, method: 'tools/list', params: {} }], 15000);
  const badResp = parseFrames(bad).find((x) => x.id === 9);
  const rejected = !!(badResp && badResp.error && badResp.error.code === -32600);
  const ok = okStd && rejected;
  return { status: ok ? 'PASS' : 'FAIL', why: '标准时序正常=' + okStd + ' 非法时序被拒(-32600)=' + rejected, result: { standard: okStd, illegal: badResp } };
} });

cases.push({ id: 'D9-5', title: 'stdio 传输健壮', fn: async () => {
  const big = 'x'.repeat(20000);
  const msgs = [init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_search_docs', arguments: { query: big } } }];
  const raw = await rawSession(msgs, 60000);
  const rs = parseFrames(raw);
  const all = [1, 2, 3].every((id) => rs.some((r) => r.id === id));
  const pure = rs.length > 0 && !/^(?!Content-Length)/.test(raw || 'Content-Length:');
  const ok = all && rs[0].jsonrpc === '2.0';
  return { status: ok ? 'PASS' : 'FAIL', why: '大payload/超长输出三请求均响应=' + all + ' stdout纯协议=' + pure, result: { responses: rs.length, pure, ids: rs.map((r) => r.id) } };
} });

cases.push({ id: 'D9-7', title: '协议版本协商降级', fn: async () => {
  const s = await mcpSession([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-06-18', capabilities: {}, clientInfo: { name: 'old', version: '1' } } }], 30000);
  const r = s.responses.find((x) => x.id === 1) || {};
  const ver = r.result && r.result.protocolVersion;
  const ok = !!ver && (ver === '2024-11-05' || ver === '2024-06-18' || !!r.error);
  return { status: ok ? 'PASS' : 'FAIL', why: '旧版本客户端协商返回 protocolVersion=' + ver + ' 或明确错误=' + !!r.error, result: r };
} });

cases.push({ id: 'D9-8', title: 'inputSchema 版本合规', fn: async () => {
  const s = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
  const tools = ((s.responses.find((r) => r.id === 2) || {}).result || {}).tools || [];
  const bad = tools.filter((t) => t.inputSchema && t.inputSchema.$schema && !/2020-12|draft-07/.test(t.inputSchema.$schema));
  const mixed = new Set(tools.map((t) => t.inputSchema && t.inputSchema.$schema || 'none'));
  const ok = tools.length >= 40 && bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: 'schema $schema 取值集合=' + [...mixed].join(',') + ' 非法=' + bad.length, result: { count: tools.length, schemes: [...mixed], bad: bad.map((x) => x.name) } };
} });

cases.push({ id: 'D6-4', title: '并发调度正确性', fn: async () => {
  const msgs = [init];
  for (let i = 0; i < 30; i++) msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { vendorConfirmed: 'I confirm I am using Huawei Cloud', intent: '查询 ECS 实例 ' + i } } });
  const t0 = Date.now();
  const s = await mcpSession(msgs, 120000);
  const ids = s.responses.filter((r) => r.id >= 2).map((r) => r.id);
  const uniq = new Set(ids);
  const ok = ids.length === 30 && uniq.size === 30 && s.responses.every((r) => r.jsonrpc === '2.0');
  return { status: ok ? 'PASS' : 'FAIL', why: '并发30请求 响应=' + ids.length + ' 唯一=' + uniq.size + ' 耗时=' + (Date.now() - t0) + 'ms', result: { count: ids.length, unique: uniq.size } };
} });

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: { stack: String((e && e.stack) || '').slice(0, 700) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch {}
  console.log(c.id.padEnd(8), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 200));
}
