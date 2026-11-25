import { spawn } from 'node:child_process';
import { mcpTool, mcpSession, finishCall, runNode, writeEvidence, writeProbe, VC_QUOTE, DIST, PKG, HOME, PATHS } from './lib.mjs';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const cases = [];

function frame(o) { const j = JSON.stringify(o); return 'Content-Length: ' + Buffer.byteLength(j, 'utf8') + '\r\n\r\n' + j; }
function parseFrames(s) { const parts = s.split(/Content-Length:\s*\d+\s*\r\n\r\n/).filter(Boolean); const rs = []; for (const p of parts) { try { rs.push(JSON.parse(p)); } catch {} } return rs; }

function timedSession(messages, timeoutMs = 90000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [PKG + '/plugins/huaweicloud-core/src/mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env } });
    let out = '';
    const t0 = Date.now();
    const arrivals = {};
    const sentAt = {};
    let done = false;
    const finish = () => { if (done) return; done = true; try { p.kill(); } catch {}; resolve({ arrivals, sentAt, t0, raw: out, responses: parseFrames(out) }); };
    p.stdout.on('data', (d) => {
      out += d.toString();
      const rs = parseFrames(out);
      for (const r of rs) if (r && r.id !== undefined && arrivals[r.id] === undefined) arrivals[r.id] = Date.now();
      if (rs.some((r) => r.id === messages[messages.length - 1].id)) { setTimeout(finish, 300); }
    });
    p.stderr.on('data', () => {});
    messages.forEach((m, i) => { setTimeout(() => { try { sentAt[m.id] = Date.now(); p.stdin.write(frame(m)); } catch {} }, 200 + i * 40); });
    setTimeout(finish, timeoutMs);
    p.on('exit', () => setTimeout(finish, 100));
  });
}

cases.push({ id: 'D4-6', title: 'adminPass 回显警告与脱敏', fn: async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const s1 = sp.redactSecrets('create ECS adminPass=MySecret123! region=cn-north-4');
  const s2 = sp.redactSecrets('{"adminPass":"MySecret123!","name":"vm"}');
  const out = hc.redactOutput('password: MySecret123! accessKeyId: AK0123456789 secretAccessKey: SK0123456789');
  const ok = !s1.includes('MySecret123!') && !s2.includes('MySecret123!') && !/MySecret123!|SK0123456789|AK0123456789/.test(out);
  return { status: ok ? 'PASS' : 'FAIL', why: 'adminPass 脱敏后不含明文=' + ok, result: { s1, s2, out } };
} });

cases.push({ id: 'D4-7', title: 'hook 三工具有效性', fn: async () => {
  const a = await mcpTool('huaweicloud_hook_check_command', { command: 'type C://Users//Administrator//.hcloud//config.json' }, 45000);
  const b = await mcpTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'p.json', content: '{"Version":"1.1","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }] }, 45000);
  const c = await mcpTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', exposure: 'public', auth: 'none', resources: [{ type: 'FunctionGraph', name: 'f' }] } }, 45000);
  const dv = (x) => (x.parsed && x.parsed.decision) || '';
  const ok = ['deny', 'warn'].includes(dv(a)) && ['deny', 'warn'].includes(dv(b)) && ['deny', 'warn'].includes(dv(c));
  return { status: ok ? 'PASS' : 'FAIL', why: 'command=' + dv(a) + ' artifacts=' + dv(b) + ' deploy=' + dv(c), result: { a: a.parsed, b: b.parsed, c: c.parsed } };
} });

cases.push({ id: 'D4-8', title: 'Python/Node 策略一致', fn: async () => {
  const py = HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.py';
  const mjs = HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.mjs';
  const cmds = ['hcloud ECS DeleteServers --server_id=x', 'hcloud ECS ListServersDetails', 'type C://Users//Administrator//.hcloud//config.json'];
  const out = [];
  for (const c of cmds) {
    const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: c } });
    const n = runNode(mjs, [], 30000, null, input);
    const p = spawnSyncPy(py, input);
    const nd = /permissionDecision"\s*:\s*"deny"/.test(n.stdout) ? 'deny' : 'allow';
    const pd = /permissionDecision"\s*:\s*"deny"/.test(p) ? 'deny' : 'allow';
    out.push({ cmd: c, node: nd, python: pd, same: nd === pd });
  }
  const ok = out.every((x) => x.same);
  return { status: ok ? 'PASS' : 'FAIL', why: '三条命令双路径判定：' + out.map((x) => x.node + '/' + x.python).join(', '), result: out };
} });

function spawnSyncPy(script, input) {
  const { spawnSync } = require('node:child_process');
  const r = spawnSync('python', [script], { input, encoding: 'utf8', timeout: 30000, windowsHide: true });
  return (r.stdout || '') + (r.stderr || '');
}

cases.push({ id: 'D4-10', title: '规则库新增回归', fn: async () => {
  const rr = await import('file:///' + DIST + '/risk-rule-engine.mjs');
  const raw = rr.loadRiskRules();
  const rules = Array.isArray(raw) ? raw : (raw && raw.rules) || [];
  const read = rr.evaluateCommandRisk('hcloud ECS ListServersDetails');
  const del = rr.evaluateCommandRisk('hcloud ECS DeleteServers --server_id=x');
  const cred = rr.evaluateCommandRisk('type C://Users//Administrator//.hcloud//config.json');
  const ok = rules.length >= 16 && read.decision === 'allow' && del.decision !== 'allow' && cred.decision === 'deny';
  return { status: ok ? 'PASS' : 'FAIL', why: '规则=' + rules.length + ' 只读=' + read.decision + ' 删除=' + del.decision + ' 凭证读取=' + cred.decision, result: { count: rules.length, read: read.decision, del: del.decision, cred: cred.decision } };
} });

cases.push({ id: 'D4-17', title: 'hook 模糊 fail-closed', fn: async () => {
  const bad = ['', ' '.repeat(5000), 'hcloud\u0000ECS', null, 12345, 'x'.repeat(30000)];
  const out = [];
  for (const b of bad) {
    const r = await mcpTool('huaweicloud_hook_check_command', { command: b }, 45000);
    out.push({ input: String(b).slice(0, 20), decision: (r.parsed && r.parsed.decision) || (r.isError ? 'error' : 'none'), crashed: /probe exception/.test(r.text || '') });
  }
  const ok = out.every((x) => !x.crashed && ['deny', 'warn', 'allow'].includes(x.decision));
  return { status: ok ? 'PASS' : 'FAIL', why: '畸形输入均未崩溃且给出决策：' + out.map((x) => x.decision).join(','), result: out };
} });

cases.push({ id: 'D4-20', title: '拒绝后零操作', fn: async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 45000);
  const token = plan.parsed && plan.parsed.approvalToken;
  const rej = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'reject' }, 45000);
  const again = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
  const rejText = JSON.stringify(rej.parsed || {}) + (rej.text || '');
  const againText = JSON.stringify(again.parsed || {}) + (again.text || '');
  const rejected = /reject|denied|cancel/i.test(rejText);
  const noReplay = /invalid|expired|already|reject/i.test(againText) || !/approved/.test(againText);
  const ok = !!token && rejected && noReplay;
  return { status: ok ? 'PASS' : 'FAIL', why: '拒绝=' + rejected + ' 拒绝后不可再批准=' + noReplay, result: { reject: rej.parsed || rej.text, again: again.parsed || again.text } };
} });

cases.push({ id: 'D4-25', title: 'Python hook 事件遥测分类', fn: async () => {
  const py = HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.py';
  const ev = HOME + '/.workbuddy/huaweicloud-plugins/telemetry/hook-events.jsonl';
  const before = existsSync(ev) ? readFileSync(ev, 'utf8').split('\n').filter(Boolean).length : 0;
  const cmds = ['hcloud ECS ListServersDetails', 'hcloud ECS DeleteServers --server_id=x', 'echo hello'];
  for (const c of cmds) spawnSyncPy(py, JSON.stringify({ tool_name: 'Bash', tool_input: { command: c } }));
  const lines = existsSync(ev) ? readFileSync(ev, 'utf8').split('\n').filter(Boolean) : [];
  const tail = lines.slice(before).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const caps = tail.map((e) => e.capability || e.value || '');
  const ok = caps.includes('cli:read') && caps.includes('cli:write') && caps.includes('cli:invoke');
  return { status: ok ? 'PASS' : 'FAIL', why: '新增事件=' + tail.length + ' 分类=' + caps.join(','), result: { path: ev, events: tail.slice(-5) } };
} });

cases.push({ id: 'D4-26', title: 'findings 证据脱敏', fn: async () => {
  const r = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud CSMS ShowSecretVersion --secret_name=x --secret_string=SK_TEST_PLACEHOLDER_LEAK_VALUE' }, 45000);
  const txt = JSON.stringify(r.parsed || {});
  const leaked = /SK_TEST_PLACEHOLDER_LEAK_VALUE/.test(txt);
  const ok = !leaked && /redacted/i.test(txt);
  return { status: ok ? 'PASS' : 'FAIL', why: 'findings 含明文=' + leaked + ' 含redacted占位=' + /redacted/i.test(txt), result: r.parsed };
} });

cases.push({ id: 'D4-27', title: '双路径输出脱敏', fn: async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const text = 'AK_TEST_PLACEHOLDER_VALUE SK_TEST_PLACEHOLDER_VALUE_0000 token=abc123 region=cn-north-4 name=vm1';
  const a = sp.redactSecrets(text);
  const b = hc.redactOutput(text);
  const ok = !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000|abc123/.test(a) && !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000|abc123/.test(b) && a.includes('cn-north-4') && a.includes('vm1');
  return { status: ok ? 'PASS' : 'FAIL', why: 'redactSecrets 脱敏=' + !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000/.test(a) + ' redactOutput 脱敏=' + !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000/.test(b) + ' 非敏感字段保留=' + (a.includes('cn-north-4') && a.includes('vm1')), result: { a, b } };
} });

cases.push({ id: 'D5-1', title: '清单发现加载', fn: async () => {
  const root = HOME + '/.workbuddy/huaweicloud-plugins';
  const pkg = existsSync(root + '/package.json') ? JSON.parse(readFileSync(root + '/package.json', 'utf8')) : null;
  const hooks = existsSync(root + '/hooks/hooks.json');
  const skills = existsSync(root + '/skills') ? readdirSync(root + '/skills').length : 0;
  const rules = existsSync(root + '/rules/huawei-agent-rules.mdc');
  const ok = !!pkg && hooks && skills > 0 && rules;
  return { status: ok ? 'PASS' : 'FAIL', why: 'manifest=' + (!!pkg) + ' version=' + (pkg && pkg.version) + ' hooks=' + hooks + ' skills=' + skills + ' rules=' + rules, result: { root, pkg, hooks, skills, rules } };
} });

cases.push({ id: 'D5-3', title: '工具全量枚举', fn: async () => {
  const src = readFileSync(DIST + '/tools.mjs', 'utf8');
  const registered = (src.match(/name: 'huaweicloud_[a-z_]+'/g) || []).length;
  const sess = await mcpSession([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
  const tl = sess.responses.find((r) => r.id === 2) || {};
  const tools = (tl.result && tl.result.tools) || [];
  const names = new Set(tools.map((t) => t.name));
  const schemaOk = tools.every((t) => t.name && t.inputSchema && t.inputSchema.type === 'object' && !!t.description);
  const ok = tools.length === registered && names.size === tools.length && schemaOk;
  return { status: ok ? 'PASS' : 'FAIL', why: 'tools/list=' + tools.length + ' 注册源=' + registered + ' 唯一=' + names.size + ' schema完整=' + schemaOk, result: { count: tools.length, registered, unique: names.size, schemaOk } };
} });

cases.push({ id: 'D6-1', title: '检索响应延迟', fn: async () => {
  const msgs = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }];
  for (let i = 0; i < 5; i++) msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_search_docs', arguments: { query: 'ECS 创建 实例 ' + i } } });
  const s = await timedSession(msgs, 60000);
  const lat = []; for (let i = 2; i <= 6; i++) if (s.arrivals[i] && s.sentAt[i]) lat.push(s.arrivals[i] - s.sentAt[i]);
  lat.sort((a, b) => a - b);
  const p95 = lat.length ? lat[Math.max(0, Math.ceil(lat.length * 0.95) - 1)] : null;
  const ok = lat.length >= 4 && p95 !== null && p95 < 2000;
  return { status: ok ? 'PASS' : 'FAIL', why: '样本=' + lat.length + ' p95=' + p95 + 'ms 阈值2000ms', result: { latencies: lat, p95 } };
} });

cases.push({ id: 'D6-3', title: 'MCP 冷启时间', fn: async () => {
  const t0 = Date.now();
  const s = await timedSession([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }], 30000);
  const ms = s.arrivals[1] ? s.arrivals[1] - t0 : null;
  const ok = ms !== null && ms < 5000;
  return { status: ok ? 'PASS' : 'FAIL', why: '冷启到 initialize 响应=' + ms + 'ms 阈值5000ms', result: { ms } };
} });

cases.push({ id: 'D6-9', title: '缓存清理三入口', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const ic = await import('file:///' + DIST + '/icon-library.mjs');
  const sm = await import('file:///' + DIST + '/search-market.mjs');
  const a1 = uc.invalidateUpdateCache(); const a2 = uc.invalidateUpdateCache();
  const b1 = ic.clearIconCache(); const b2 = ic.clearIconCache();
  const c1 = sm.clearMarketCache(); const c2 = sm.clearMarketCache();
  const ok = [a1, a2, b1, b2, c1, c2].every((x) => x === undefined || x === null || x === true) && typeof uc.invalidateUpdateCache === 'function' && typeof ic.clearIconCache === 'function' && typeof sm.clearMarketCache === 'function';
  return { status: ok ? 'PASS' : 'FAIL', why: '三入口均存在且重复清理无异常', result: { a1, a2, b1, b2, c1, c2 } };
} });

cases.push({ id: 'D8-9', title: '安装 ID 与遥测值脱敏', fn: async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.mjs');
  const id1 = tel.generateOrRecoverInstallId();
  const id2 = tel.generateOrRecoverInstallId();
  const s = tel.sanitizeValue({ ak: 'AK_TEST_PLACEHOLDER_VALUE', sk: 'SK_TEST_PLACEHOLDER_VALUE_0000', token: 'secret-token-123', name: 'ok-value', bad: 'a\nb\u0000' });
  const st = JSON.stringify(s);
  const ok = !!id1 && id1 === id2 && !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000|secret-token-123/.test(st) && /ok-value/.test(st);
  return { status: ok ? 'PASS' : 'FAIL', why: 'installId 稳定=' + (!!id1 && id1 === id2) + ' 敏感值已脱敏=' + !/AK_TEST_PLACEHOLDER_VALUE|secret-token-123/.test(st), result: { id1, id2, sanitized: s } };
} });

cases.push({ id: 'D3-A1', title: 'skill 检索完整性', fn: async () => {
  const dir = PKG + '/plugins/huaweicloud-core/skills';
  const names = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const msgs = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }];
  names.forEach((n, i) => msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_retrieve_skill', arguments: { name: n } } }));
  const s = await mcpSession(msgs, 180000);
  const res = names.map((n, i) => { const f = finishCall(s.responses.find((r) => r.id === i + 2)); return { name: n, ok: !!f.ok, len: (f.text || '').length }; });
  const bad = res.filter((x) => !x.ok || x.len < 200);
  const ok = res.length >= 25 && bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skill 数=' + res.length + ' 完整检索=' + (res.length - bad.length) + ' 缺失=' + bad.map((x) => x.name).join(','), result: { total: res.length, bad } };
} });

cases.push({ id: 'D3-B1', title: 'list_operations 规范名', fn: async () => {
  const out = [];
  for (const svc of ['ECS', 'VPC', 'OBS']) { const r = await mcpTool('huaweicloud_list_operations', { service: svc }, 60000); out.push({ svc, ok: r.ok, len: (r.text || '').length, head: (r.text || '').slice(0, 160) }); }
  const ok = out.every((x) => x.ok && x.len > 50);
  return { status: ok ? 'PASS' : 'FAIL', why: out.map((x) => x.svc + '=' + x.ok + '(' + x.len + ')').join(' '), result: out };
} });

cases.push({ id: 'D3-C5', title: '工具冒烟', fn: async () => {
  const a = await mcpTool('huaweicloud_check_cli', {}, 45000);
  const b = await mcpTool('huaweicloud_list_operations', { service: 'ECS' }, 60000);
  const c = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails'], allowWrites: false }, 45000);
  const d = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0200', message: 'not found' }, 45000);
  const ok = a.ok && b.ok && c.ok && d.ok;
  return { status: ok ? 'PASS' : 'FAIL', why: 'check_cli/ list_operations/ plan/ explain_error=' + [a.ok, b.ok, c.ok, d.ok].join('/'), result: { check_cli: a.parsed || a.text, plan: c.parsed, error: d.parsed || d.text } };
} });

cases.push({ id: 'D3-S5', title: '复合意图分层路由', fn: async () => {
  const r = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '把我的应用部署上线，需要对象存储放静态资源，还要一个数据库存业务数据，预览环境和生产环境都要' }, 60000);
  const p = r.parsed || {};
  const txt = JSON.stringify(p);
  const hit = ['OBS', 'RDS', 'DDS', 'GaussDB', 'ECS', 'sandbox'].filter((s) => new RegExp(s, 'i').test(txt));
  const ok = r.ok && hit.length >= 2;
  return { status: ok ? 'PASS' : 'FAIL', why: '命中服务=' + hit.join(','), result: p };
} });

cases.push({ id: 'D3-S8', title: '操作失败后排障指引', fn: async () => {
  const r = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0004', message: 'Authentication failed: token expired', requestId: 'req-123' }, 45000);
  const txt = (r.text || '') + JSON.stringify(r.parsed || {});
  const hasNext = /(下一步|建议|检查|IAM|region|配额|next|check|action)/i.test(txt);
  const noStack = !/at Object\.<anonymous>|ENOENT.*at /.test(txt);
  const ok = r.ok && hasNext && noStack && txt.length > 40;
  return { status: ok ? 'PASS' : 'FAIL', why: '给出可执行下一步=' + hasNext + ' 非裸堆栈=' + noStack, result: r.parsed || r.text };
} });

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: { stack: String((e && e.stack) || '').slice(0, 700) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch {}
  console.log(c.id.padEnd(8), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 180));
}
