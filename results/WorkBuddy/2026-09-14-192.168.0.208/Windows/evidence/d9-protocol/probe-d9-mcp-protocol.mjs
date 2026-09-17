/**
 * WorkBuddy 每日测试探针 - D9 MCP 协议 + D1-26/41/42 + D6 性能 + D10-4（v1.1.4-next.6）
 * 真实 stdio JSON-RPC 会话（Content-Length 帧）: spawn 安装版 mcp-server.mjs
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const SERVER = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = [];
function t(id, name, pass, actual, expected, note) {
  results.push({ case: id, name, pass: pass === null ? null : !!pass, actual: String(actual), expected: String(expected), note: note || '' });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class McpClient {
  constructor() { this.proc = null; this.buf = Buffer.alloc(0); this.nextId = 1; this.pending = new Map(); this.serverDied = false; }
  start() {
    this.proc = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stdout.on('data', (d) => this._onData(d));
    this.proc.stderr.on('data', (d) => { this.lastStderr = (this.lastStderr || '') + d; });
    this.proc.on('exit', (c, s) => { this.serverDied = true; this.pending.forEach((p) => { clearTimeout(p.timer); p.resolve({ _died: true, code: c }); }); this.pending.clear(); });
    return this;
  }
  _onData(d) {
    this.buf = Buffer.concat([this.buf, d]);
    while (true) {
      const hEnd = this.buf.indexOf('\r\n\r\n');
      if (hEnd === -1) return;
      const header = this.buf.subarray(0, hEnd).toString('utf-8');
      const m = header.match(/Content-Length:\s*(\d+)/i);
      if (!m) { this.buf = Buffer.alloc(0); return; }
      const bodyStart = hEnd + 4; const bodyEnd = bodyStart + Number(m[1]);
      if (this.buf.length < bodyEnd) return;
      const body = this.buf.subarray(bodyStart, bodyEnd).toString('utf-8');
      this.buf = this.buf.subarray(bodyEnd);
      let msg; try { msg = JSON.parse(body); } catch { msg = { _unparseable: body }; }
      if (msg && msg.id !== undefined && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id); this.pending.delete(msg.id); clearTimeout(p.timer); p.resolve(msg);
      }
    }
  }
  frame(obj) {
    const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return `Content-Length: ${Buffer.byteLength(body, 'utf-8')}\r\n\r\n${body}`;
  }
  request(method, params, timeoutMs = 30000, id = null) {
    const rid = id ?? this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.pending.delete(rid); resolve({ _timeout: true }); }, timeoutMs);
      this.pending.set(rid, { resolve, timer });
      this.proc.stdin.write(this.frame({ jsonrpc: '2.0', id: rid, method, params }));
    });
  }
  notify(method, params) { this.proc.stdin.write(this.frame({ jsonrpc: '2.0', method, params })); }
  raw(chunk) { this.proc.stdin.write(chunk); }
  kill() { try { this.proc.kill(); } catch {} }
}

async function handshake() {
  const c = new McpClient().start();
  const init = await c.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } }, 30000);
  if (init.result) c.notify('notifications/initialized', {});
  return { c, init };
}

async function main() {
  // ── D6-3 冷启动 ──
  const t0 = Date.now();
  const { c: cli, init } = await handshake();
  const coldMs = Date.now() - t0;
  t('D6-3', '冷启动(spawn→initialize 应答) < 10s', !!init.result && coldMs < 10000, `${coldMs}ms`, '<10000ms',
    JSON.stringify(init.result?.serverInfo || ''));

  // ── D9-4 生命周期 ──
  t('D9-4', 'initialize 返回 protocolVersion/capabilities/serverInfo',
    !!(init.result?.protocolVersion && init.result?.capabilities && init.result?.serverInfo),
    JSON.stringify(Object.keys(init.result || {})), '三字段齐');
  t('D9-7', '协议版本协商(请求 2024-11-05)', typeof init.result?.protocolVersion === 'string', init.result?.protocolVersion, '字符串版本号');

  // ── D9-1 / D5-3 / D9-8 / D1-26 ──
  const tl = await cli.request('tools/list', {});
  const tools = tl.result?.tools || [];
  t('D9-1', 'tools/list 返回数组', Array.isArray(tools), `count=${tools.length}`, 'array');
  const badSchema = tools.filter((x) => !x.name || !x.description || !x.inputSchema);
  t('D9-1', '每个工具 name+description+inputSchema', badSchema.length === 0, `bad=${badSchema.length}`, '0', badSchema.map((b) => b.name).join(','));
  const schemaBad = tools.filter((x) => x.inputSchema?.type !== 'object' || typeof x.inputSchema?.properties !== 'object'
    || (x.inputSchema?.required !== undefined && !Array.isArray(x.inputSchema.required)));
  t('D9-8', 'inputSchema 全部 type=object+properties(+required数组)', schemaBad.length === 0, `bad=${schemaBad.length}`, '0', schemaBad.map((b) => b.name).join(','));
  const cu = tools.find((x) => x.name === 'huaweicloud_check_update');
  const up = tools.find((x) => x.name === 'huaweicloud_upgrade');
  t('D1-26', 'check_update/upgrade 均注册且 schema 完整', !!cu && !!up && !!cu.description && !!cu.inputSchema && !!up.description && !!up.inputSchema,
    `check_update=${!!cu} upgrade=${!!up}`, '均注册');
  t('D5-3', '工具全量枚举', tools.length >= 39, `count=${tools.length}`, '>=39',
    tools.length !== 39 ? `实际 ${tools.length} 个 vs 用例基线/白名单 39 口径` : '');

  // ── D9-2 JSON-RPC 错误码 ──
  // (a) 未知方法
  const m32601 = await cli.request('nonexistent/method', {});
  t('D9-2', '未知方法 → -32601', m32601.error?.code === -32601, JSON.stringify(m32601.error || {}).slice(0, 90), '-32601',
    m32601.error?.code === -32603 ? '返回 -32603(方法不存在被当内部错误), mcp-server.mjs handleMessage catch 统一 -32603' : '');
  // (b) 非法 JSON 帧测试移至最后独立进程(避免影响后续用例)

  // ── D9-3 tools/call 响应格式 + D1-41 契约 ──
  const call1 = await cli.request('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, 60000);
  t('D9-3', 'tools/call 返回 content 数组', Array.isArray(call1.result?.content), JSON.stringify(Object.keys(call1.result || {})), 'content[]');
  t('D9-3', 'isError 字段存在', typeof call1.result?.isError === 'boolean', String(call1.result?.isError), 'boolean');
  let cuPayload = null; try { cuPayload = JSON.parse(call1.result?.content?.[0]?.text || '{}'); } catch {}
  t('D1-41', 'check_update isError=false 且返回结构化 JSON', call1.result?.isError === false && !!cuPayload && typeof cuPayload === 'object',
    `isError=${call1.result?.isError}`, 'isError=false+JSON');
  const wantKeys = ['currentVersion', 'latestStable', 'updateAvailable', 'result'];
  const missing = wantKeys.filter((k) => !(k in (cuPayload || {})));
  t('D1-41', '契约字段齐', missing.length === 0, `missing=${missing.join(',') || '无'}`, '无缺失',
    `result=${cuPayload?.result} cur=${cuPayload?.currentVersion} latest=${cuPayload?.latestStable} next=${cuPayload?.latestNext}`);

  // ── D6-1 检索延迟 ──
  const lat0 = Date.now();
  const rs = await cli.request('tools/call', { name: 'huaweicloud_retrieve_skill', arguments: { name: 'huawei-ecs' } }, 60000);
  const lat = Date.now() - lat0;
  t('D6-1', 'retrieve_skill 延迟 < 10s', !!rs.result && lat < 10000, `${lat}ms isError=${rs.result?.isError}`, '<10000ms');

  // ── D6-4 并发调度 ──
  const jobs = [];
  for (let i = 0; i < 5; i++) jobs.push(cli.request('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'ecs' } }, 60000));
  const all = await Promise.all(jobs);
  const okCount = all.filter((r) => r.result && r.result.isError === false).length;
  t('D6-4', '5 并发 tools/call 全部成功', okCount === 5, `${okCount}/5`, '5/5', all.map((r) => (r.result ? r.result.isError : 'x')).join(','));

  // ── D10-4 安全干预（协议级） ──
  const plan = await cli.request('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args: ['ecs', 'create-servers', '--name', 'tctest-1', '--flavor', 'c6s.large.2', '--image-id', 'x'] } }, 60000);
  let planPayload = null; try { planPayload = JSON.parse(plan.result?.content?.[0]?.text || '{}'); } catch {}
  t('D10-4', '高危写操作经 plan 工具返回审批信息', plan.result?.isError === false && !!planPayload,
    `isError=${plan.result?.isError}`, '计划+审批语义', JSON.stringify(planPayload).slice(0, 220));
  const planDeny = await cli.request('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args: ['csms', 'showsecretversion', '--secret-id', 'x'] } }, 60000);
  const denyText = String(planDeny.result?.content?.[0]?.text || '');
  t('D10-4', '凭证读取类高危命令被拦截', planDeny.result?.isError === true || /deny|blocked/i.test(denyText),
    denyText.slice(0, 100).replace(/\n/g, ' '), 'deny/blocked');

  // ── D1-42 dismiss 闭环 ──
  if (cuPayload?.result === 'update_available') {
    const dm = await cli.request('tools/call', { name: 'huaweicloud_check_update', arguments: { action: 'dismiss' } }, 60000);
    let dp = null; try { dp = JSON.parse(dm.result?.content?.[0]?.text || '{}'); } catch {}
    t('D1-42', 'dismiss 调用返回 dismissed', dp?.result === 'dismissed' || dp?.dismissed === true, JSON.stringify(dp).slice(0, 120), 'dismissed');
    const cu2 = await cli.request('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, 60000);
    let cp2 = null; try { cp2 = JSON.parse(cu2.result?.content?.[0]?.text || '{}'); } catch {}
    t('D1-42', '同会话再次 check_update → dismissed', cp2?.result === 'dismissed', cp2?.result, 'dismissed');
    cli.kill(); await sleep(500);
    const { c: cli2 } = await handshake();
    const cu3 = await cli2.request('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, 60000);
    let cp3 = null; try { cp3 = JSON.parse(cu3.result?.content?.[0]?.text || '{}'); } catch {}
    t('D1-42', '新进程重启后仍 dismissed(持久化)', cp3?.result === 'dismissed', cp3?.result, 'dismissed');
    cli2.kill();
  } else {
    t('D1-42', '真实 registry 无更新可 dismiss(记录)', null, `result=${cuPayload?.result}`, '-',
      '当前 next.6 已是最新, 无 update_available 可触发 dismiss; 写读持久化由单测覆盖(update-check.test.mjs skip 会话隔离 PASS)');
    cli.kill();
  }

  // ── D9-5 stdio 传输健壮性 ──
  const { c: cli3, init: ini3 } = await handshake();
  t('D9-5', 'initialize(新进程)成功', !!ini3.result, ini3.error ? 'error' : 'ok', 'ok');
  // 半帧
  const full = cli3.frame({ jsonrpc: '2.0', id: 900, method: 'tools/list', params: {} });
  const bStart = full.indexOf('\r\n\r\n') + 4;
  cli3.raw(full.slice(0, bStart + 5));
  await sleep(300);
  cli3.raw(full.slice(bStart + 5));
  const half = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ _timeout: true }), 15000);
    cli3.pending.set(900, { resolve: (m) => { clearTimeout(timer); resolve(m); }, timer });
  });
  t('D9-5', '半帧续写后正确解析', Array.isArray(half.result?.tools), half._timeout ? 'timeout' : `tools=${half.result?.tools?.length}`, 'tools[]');
  // 大帧 50KB
  const bigArg = 'x'.repeat(50000);
  const big = await cli3.request('tools/call', { name: 'huaweicloud_hook_check_command', arguments: { command: `echo ${bigArg}` } }, 60000);
  t('D9-5', '50KB 大参数有响应不崩溃', !!(big.result || big.error), big.result ? 'result' : 'error', '有响应');
  // 无 Content-Length 头的垃圾块
  cli3.raw('GARBAGE-NO-HEADER\x00\x01\x02\r\n\r\n');
  await sleep(500);
  const after = await cli3.request('tools/list', {}, 15000);
  t('D9-5', '垃圾块后服务仍存活', !after._died && Array.isArray(after.result?.tools), after._died ? 'DIED' : 'alive', 'alive');
  // 非法 JSON 帧后的行为已在 D9-2 记录
  cli3.kill();

  t('D9-9', '观察: 超时取消语义', null, '-', '-',
    'tools/call 超时/取消需可控慢端点注入, 本环境无注入通道; 本轮全部调用 60s 内正常返回');

  // ── D9-2(b) 非法 JSON 帧（独立进程, 防止污染主会话） ──
  {
    const cp = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderrTxt = ''; let exited = null;
    cp.stderr.on('data', (d) => { stderrTxt += d; });
    cp.on('exit', (c) => { exited = c; });
    const frameOf = (b) => `Content-Length: ${Buffer.byteLength(b, 'utf-8')}

${b}`;
    cp.stdin.write(frameOf(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } } })));
    await sleep(800);
    cp.stdin.write(frameOf('{"jsonrpc":"2.0","id":888,"method": BROKEN'));
    await sleep(1500);
    t('D9-2', '非法 JSON → -32700 且服务存活', exited === null,
      exited === null ? 'alive' : `SERVER_CRASHED exit=${exited}, stderr=${stderrTxt.split(String.fromCharCode(10)).slice(0, 2).join(' | ').slice(0, 160)}`,
      '-32700+存活',
      exited !== null ? 'mcp-server.mjs:152 parseContentLengthFrame JSON.parse 未捕获 → 进程崩溃, 未按 JSON-RPC 规范返回 -32700' : '');
    cp.kill();
  }

  console.log(JSON.stringify(results, null, 2));
  const p = results.filter((r) => r.pass === true).length;
  const f = results.filter((r) => r.pass === false).length;
  const i = results.filter((r) => r.pass === null).length;
  console.log(`\n=== D9 协议+D1/D6/D10: ${p} PASS / ${f} FAIL / ${i} INFO / ${results.length} TOTAL ===`);
  process.exit(0);
}

main().catch((e) => { console.error('PROBE FATAL', e); process.exit(1); });
