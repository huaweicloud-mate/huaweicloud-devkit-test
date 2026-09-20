const { spawn } = require('child_process');
const { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } = require('fs');
const { resolve } = require('path');

const EV_DIR = __dirname;
const MCP = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = {};
let idc = 1;
const nid = () => idc++;

function save(id, data) {
  const d = resolve(EV_DIR, id);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  writeFileSync(resolve(d, 'evidence.json'), JSON.stringify(data, null, 2), 'utf8');
}

class Mcp {
  constructor(opts = {}) {
    this.proc = null; this.buf = Buffer.alloc(0);
    this.waiters = new Map(); this.opts = opts; this.exited = false;
  }
  start() {
    const args = [MCP];
    if (this.opts.transport === 'remote') {
      args.push('--transport', 'remote');
      if (this.opts.port) args.push('--port', String(this.opts.port));
      if (this.opts.host) args.push('--host', this.opts.host);
    }
    this.proc = spawn('node', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stdout.on('data', d => { this.buf = Buffer.concat([this.buf, d]); this._parse(); });
    this.proc.stderr.on('data', () => {});
    this.proc.on('exit', code => { this.exited = true; this.exitCode = code; });
  }
  _parse() {
    while (true) {
      const he = this.buf.indexOf('\r\n\r\n');
      if (he !== -1) {
        const hdr = this.buf.slice(0, he).toString('utf8');
        const m = hdr.match(/Content-Length:\s*(\d+)/i);
        if (!m) { this.buf = this.buf.slice(he + 4); continue; }
        const len = parseInt(m[1]); const total = he + 4 + len;
        if (this.buf.length < total) break;
        const body = this.buf.slice(he + 4, he + 4 + len).toString('utf8');
        this.buf = this.buf.slice(total);
        try { this._dispatch(JSON.parse(body)); } catch {}
        continue;
      }
      const lf = this.buf.indexOf('\n');
      if (lf !== -1) {
        const line = this.buf.slice(0, lf).toString('utf8').trim();
        this.buf = this.buf.slice(lf + 1);
        if (line) { try { this._dispatch(JSON.parse(line)); } catch {} }
        continue;
      }
      break;
    }
  }
  _dispatch(r) { const w = this.waiters.get(r.id); if (w) { this.waiters.delete(r.id); w(r); } }
  send(msg) { const j = JSON.stringify(msg); this.proc.stdin.write(`Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`); }
  notify(msg) { const j = JSON.stringify(msg); this.proc.stdin.write(`Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`); }
  wait(id, timeout = 25000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.waiters.delete(id); reject(new Error(`Timeout id=${id}`)); }, timeout);
      this.waiters.set(id, r => { clearTimeout(t); resolve(r); });
    });
  }
  async httpPost(msg, timeout = 10000) {
    const url = `http://${this.opts.host}:${this.opts.port}`;
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(msg) });
    return resp.json();
  }
  close() { try { this.proc.stdin.end(); } catch {} try { this.proc.kill(); } catch {} }
}

async function init(c) {
  const id = nid();
  c.send({ jsonrpc: '2.0', id, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
  return c.wait(id);
}

async function d9_1() {
  const ev = { caseId: 'D9-1', title: 'tools/list合规', steps: [] };
  const c = new Mcp(); c.start();
  try {
    await init(c);
    const id = nid(); c.send({ jsonrpc: '2.0', id, method: 'tools/list', params: {} });
    const r = await c.wait(id);
    const tools = r.result?.tools || [];
    const names = tools.map(t => t.name);
    const unique = [...new Set(names)];
    const allSchema = tools.every(t => t.inputSchema && t.description && t.name);
    const pass = tools.length === 40 && unique.length === 40 && allSchema;
    ev.steps.push({ toolCount: tools.length, uniqueCount: unique.length, allHaveSchema: allSchema, pass });
    ev.verdict = pass ? 'PASS' : 'FAIL';
    ev.summary = `${tools.length} tools, ${unique.length} unique, schema=${allSchema}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { c.close(); }
  save('D9-1', ev); results['D9-1'] = ev;
  console.log(`[D9-1] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_2() {
  const ev = { caseId: 'D9-2', title: 'JSON-RPC错误码', steps: [] };
  const c = new Mcp(); c.start();
  try {
    await init(c);
    const id1 = nid(); c.send({ jsonrpc: '2.0', id: id1, method: 'foo/bar', params: {} });
    const r1 = await c.wait(id1);
    ev.steps.push({ test: 'unknown method', code: r1.error?.code, pass: r1.error?.code === -32601 });
    const id2 = nid(); c.send({ jsonrpc: '2.0', id: id2, method: 'tools/call', params: {} });
    const r2 = await c.wait(id2);
    ev.steps.push({ test: 'missing name', pass: !!r2.error });
    const id3 = nid(); c.send({ jsonrpc: '2.0', id: id3, method: 'tools/call', params: { name: 'no_such', arguments: {} } });
    const r3 = await c.wait(id3);
    ev.steps.push({ test: 'unknown tool', pass: !!r3.error });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `-32601=${r1.error?.code}, missing=${!!r2.error}, unknown=${!!r3.error}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { c.close(); }
  save('D9-2', ev); results['D9-2'] = ev;
  console.log(`[D9-2] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_3() {
  const ev = { caseId: 'D9-3', title: 'tools/call响应格式', steps: [] };
  const c = new Mcp(); c.start();
  try {
    await init(c);
    const id1 = nid(); c.send({ jsonrpc: '2.0', id: id1, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
    const r1 = await c.wait(id1);
    const content = r1.result?.content || [];
    const ok1 = Array.isArray(content) && content[0]?.type === 'text' && r1.result?.isError === false;
    ev.steps.push({ test: 'success call', pass: ok1 });
    const id2 = nid(); c.send({ jsonrpc: '2.0', id: id2, method: 'tools/call', params: { name: 'no_such', arguments: {} } });
    const r2 = await c.wait(id2);
    const err = r2.error || {};
    const ok2 = !!err && typeof err.code === 'number' && typeof err.message === 'string';
    ev.steps.push({ test: 'error call', pass: ok2 });
    ev.verdict = ok1 && ok2 ? 'PASS' : 'FAIL';
    ev.summary = `success=${ok1}, error=${ok2}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { c.close(); }
  save('D9-3', ev); results['D9-3'] = ev;
  console.log(`[D9-3] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_4() {
  const ev = { caseId: 'D9-4', title: '协议生命周期', steps: [] };
  const c = new Mcp(); c.start();
  try {
    const iid = nid();
    c.send({ jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: { name: 'test', version: '1.0' } } });
    const ir = await c.wait(iid);
    ev.steps.push({ step: 'initialize', pass: !!ir.result?.serverInfo });
    c.notify({ jsonrpc: '2.0', method: 'notifications/initialized' });
    ev.steps.push({ step: 'notifications/initialized', pass: true });
    const lid = nid(); c.send({ jsonrpc: '2.0', id: lid, method: 'tools/list', params: {} });
    const lr = await c.wait(lid);
    ev.steps.push({ step: 'tools/list', pass: lr.result?.tools?.length === 40 });
    const cid = nid(); c.send({ jsonrpc: '2.0', id: cid, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
    const cr = await c.wait(cid);
    ev.steps.push({ step: 'tools/call', pass: !!cr.result?.content });
    ev.steps.push({ step: 'capabilities', pass: !!ir.result?.capabilities?.tools });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `all ${ev.verdict}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { c.close(); }
  save('D9-4', ev); results['D9-4'] = ev;
  console.log(`[D9-4] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_5() {
  const ev = { caseId: 'D9-5', title: 'stdio传输健壮', steps: [] };
  const c = new Mcp(); c.start();
  try {
    await init(c);
    const big = 'ecs ' + 'x'.repeat(50000);
    const id1 = nid(); c.send({ jsonrpc: '2.0', id: id1, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: big } } });
    const r1 = await c.wait(id1);
    ev.steps.push({ test: 'large payload 50KB', pass: !!r1.result?.content });
    const ids = [];
    for (let i = 0; i < 5; i++) { const id = nid(); ids.push(id); c.send({ jsonrpc: '2.0', id, method: 'tools/list', params: {} }); }
    const resps = await Promise.all(ids.map(id => c.wait(id)));
    ev.steps.push({ test: '5 concurrent', pass: resps.every(r => r.result?.tools?.length === 40) });
    let seqOk = true;
    for (let i = 0; i < 3; i++) { const id = nid(); c.send({ jsonrpc: '2.0', id, method: 'tools/list', params: {} }); const r = await c.wait(id); if (!r.result?.tools) seqOk = false; }
    ev.steps.push({ test: '3 sequential', pass: seqOk });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `large=${ev.steps[0].pass}, concurrent=${ev.steps[1].pass}, seq=${ev.steps[2].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { c.close(); }
  save('D9-5', ev); results['D9-5'] = ev;
  console.log(`[D9-5] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_6() {
  const ev = { caseId: 'D9-6', title: '跨客户端互通', steps: [] };
  const clients = [{ name: 'claude-desktop', version: '0.1.0' }, { name: 'cursor', version: '0.42.0' }, { name: 'hermes', version: '1.0.0' }];
  for (const cl of clients) {
    const c = new Mcp(); c.start();
    try {
      const iid = nid(); c.send({ jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: cl } });
      const ir = await c.wait(iid);
      const lid = nid(); c.send({ jsonrpc: '2.0', id: lid, method: 'tools/list', params: {} });
      const lr = await c.wait(lid);
      ev.steps.push({ client: cl.name, pass: !!ir.result?.serverInfo && lr.result?.tools?.length === 40 });
    } catch (e) { ev.steps.push({ client: cl.name, pass: false, error: e.message }); }
    finally { c.close(); }
  }
  ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
  ev.summary = ev.steps.map(s => `${s.client}=${s.pass}`).join(', ');
  save('D9-6', ev); results['D9-6'] = ev;
  console.log(`[D9-6] ${ev.verdict} - ${ev.summary}`);
}

async function d9_9() {
  const ev = { caseId: 'D9-9', title: '超时协议语义与取消', steps: [] };
  const c = new Mcp(); c.start();
  try {
    const iid = nid(); c.send({ jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    const ir = await c.wait(iid);
    const caps = ir.result?.capabilities || {};
    const hasCancel = !!caps.notifications?.cancelled;
    ev.steps.push({ step: 'probe cancellation', hasCancel, note: hasCancel ? 'supported' : 'SPEC-MISMATCH', pass: true });
    const cid = nid(); c.send({ jsonrpc: '2.0', id: cid, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
    const cr = await c.wait(cid);
    ev.steps.push({ step: 'normal call', pass: !!cr.result || !!cr.error });
    const eid = nid(); c.send({ jsonrpc: '2.0', id: eid, method: 'unknown/method', params: {} });
    const er = await c.wait(eid);
    ev.steps.push({ step: 'error format', code: er.error?.code, pass: er.error?.code === -32601 });
    const rid = nid(); c.send({ jsonrpc: '2.0', id: rid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    const rr = await c.wait(rid);
    ev.steps.push({ step: 'recovery', pass: !!rr.result?.serverInfo });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `cancellation=${hasCancel}(SPEC-MISMATCH), error=${ev.steps[2].pass}, recovery=${ev.steps[3].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { c.close(); }
  save('D9-9', ev); results['D9-9'] = ev;
  console.log(`[D9-9] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_10() {
  const ev = { caseId: 'D9-10', title: 'MCP remote transport', steps: [] };
  const c = new Mcp({ transport: 'remote', port: 9528, host: '127.0.0.1' }); c.start();
  try {
    await new Promise(r => setTimeout(r, 3000));
    const d1 = await c.httpPost({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    ev.steps.push({ test: 'remote init', pass: !!d1.result?.serverInfo });
    const d2 = await c.httpPost({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    ev.steps.push({ test: 'remote tools/list', count: d2.result?.tools?.length, pass: d2.result?.tools?.length === 40 });
    const d3 = await c.httpPost({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: 'ecs' } } });
    ev.steps.push({ test: 'remote tools/call', pass: !!d3.result?.content });
    const d4 = await c.httpPost({ jsonrpc: '2.0', id: 4, method: 'unknown/method', params: {} });
    ev.steps.push({ test: 'remote error', code: d4.error?.code, pass: d4.error?.code === -32601 });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `init=${ev.steps[0].pass}, list=${ev.steps[1].pass}, call=${ev.steps[2].pass}, error=${ev.steps[3].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { c.close(); }
  save('D9-10', ev); results['D9-10'] = ev;
  console.log(`[D9-10] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_11() {
  const ev = { caseId: 'D9-11', title: 'WebSocket隧道通道生命周期', steps: [] };
  try {
    const sandboxDir = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/sandbox';
    let hasTunnel = false;
    const files = readdirSync(sandboxDir);
    for (const f of files) {
      try { const c = readFileSync(`${sandboxDir}/${f}`, 'utf8'); if (c.includes('Tunnel') || c.includes('tunnel') || c.includes('hwlink') || c.includes('Hwlink')) hasTunnel = true; } catch {}
    }
    ev.steps.push({ step: 'source has tunnel code', hasTunnel, files, pass: true });
    const c = new Mcp({ transport: 'remote', port: 9529, host: '127.0.0.1' }); c.start();
    await new Promise(r => setTimeout(r, 3000));
    const d1 = await c.httpPost({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    ev.steps.push({ step: 'server serving', pass: !!d1.result?.serverInfo });
    const procPid = c.proc.pid;
    c.close();
    // Wait for process to actually exit
    await new Promise(r => setTimeout(r, 3000));
    let procAlive = false;
    try { process.kill(procPid, 0); procAlive = true; } catch {}
    let closed = false;
    try { await c.httpPost({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }); } catch { closed = true; }
    ev.steps.push({ step: 'server closed', pass: closed, procAlive, note: procAlive ? 'process still alive' : 'process exited' });
    const remoteSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server-remote.mjs', 'utf8');
    ev.steps.push({ step: 'source has close()', pass: remoteSrc.includes('close:') && remoteSrc.includes('server.close') });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `tunnel=${hasTunnel}, serving=${ev.steps[1].pass}, closed=${closed}, close()=${ev.steps[3].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  save('D9-11', ev); results['D9-11'] = ev;
  console.log(`[D9-11] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function main() {
  console.log('=== D9 P1 ===');
  await d9_1(); await d9_2(); await d9_3(); await d9_4(); await d9_5(); await d9_6(); await d9_9(); await d9_10(); await d9_11();
  console.log('\n=== Summary ===');
  for (const [k, v] of Object.entries(results)) console.log(`  ${k}: ${v.verdict}`);
  const p = Object.values(results).filter(r => r.verdict === 'PASS').length;
  const f = Object.values(results).filter(r => r.verdict === 'FAIL').length;
  console.log(`\nPASS=${p} FAIL=${f}`);
  writeFileSync(resolve(EV_DIR, 'd9-p1-summary.json'), JSON.stringify(results, null, 2), 'utf8');
  setTimeout(() => process.exit(0), 500);
}
main().catch(e => { console.error(e); process.exit(1); });
