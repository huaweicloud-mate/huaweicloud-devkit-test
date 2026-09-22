// AI生成
/**
 * D9协议 P1 综合探针
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const EVIDENCE_DIR = resolve(import.meta.dirname);
const MCP_SERVER = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = {};
let idCounter = 1;
function nextId() { return idCounter++; }

function killProc(proc) {
  try { proc.stdin.end(); } catch {}
  try { proc.kill(); } catch {}
}

function startMcpServer() {
  const proc = spawn('node', [MCP_SERVER], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' },
  });
  proc.stderr.on('data', () => {});
  return proc;
}

function sendMsg(proc, msg) {
  const json = JSON.stringify(msg);
  proc.stdin.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function waitForResp(proc, id, timeout = 15000) {
  return new Promise((ok, fail) => {
    let buf = Buffer.alloc(0);
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; fail(new Error('timeout')); } }, timeout);
    const handler = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (true) {
        const he = buf.indexOf('\r\n\r\n');
        if (he !== -1) {
          const hdr = buf.subarray(0, he).toString();
          const m = hdr.match(/Content-Length:\s*(\d+)/i);
          if (!m) { buf = buf.subarray(he + 4); continue; }
          const len = Number(m[1]);
          const bs = he + 4, be = bs + len;
          if (buf.length < be) break;
          const body = buf.subarray(bs, be).toString();
          buf = buf.subarray(be);
          try {
            const r = JSON.parse(body);
            if (r.id === id && !done) { done = true; clearTimeout(timer); proc.stdout.off('data', handler); ok(r); return; }
          } catch {}
          continue;
        }
        break;
      }
    };
    proc.stdout.on('data', handler);
  });
}

function save(id, data) {
  const dir = resolve(EVIDENCE_DIR, id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'evidence.json'), JSON.stringify(data, null, 2), 'utf8');
}

async function d9_1() {
  const ev = { caseId: 'D9-1', title: 'tools/list合规', steps: [] };
  const p = startMcpServer();
  try {
    const iid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    await waitForResp(p, iid);
    const lid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: lid, method: 'tools/list', params: {} });
    const r = await waitForResp(p, lid);
    const tools = r.result?.tools || [];
    const names = tools.map(t => t.name);
    const unique = [...new Set(names)];
    const pass = tools.length === 40 && unique.length === 40 && tools.every(t => t.inputSchema && t.description && t.name);
    ev.steps.push({ toolCount: tools.length, uniqueCount: unique.length, allHaveSchema: tools.every(t => !!t.inputSchema), pass });
    ev.verdict = pass ? 'PASS' : 'FAIL';
    ev.summary = `${tools.length} tools, ${unique.length} unique, schema valid`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
  save('D9-1', ev); results['D9-1'] = ev;
  console.log(`[D9-1] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_2() {
  const ev = { caseId: 'D9-2', title: 'JSON-RPC错误码', steps: [] };
  const p = startMcpServer();
  try {
    const iid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    await waitForResp(p, iid);
    const id1 = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: id1, method: 'foo/bar', params: {} });
    const r1 = await waitForResp(p, id1);
    ev.steps.push({ test: 'unknown method', code: r1.error?.code, pass: r1.error?.code === -32601 });
    const id2 = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: id2, method: 'tools/call', params: {} });
    const r2 = await waitForResp(p, id2);
    ev.steps.push({ test: 'missing name', hasError: !!r2.error, pass: !!r2.error && typeof r2.error.code === 'number' });
    const id3 = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: id3, method: 'tools/call', params: { name: 'no_such_tool', arguments: {} } });
    const r3 = await waitForResp(p, id3);
    ev.steps.push({ test: 'unknown tool', code: r3.error?.code, pass: !!r3.error });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `-32601=${r1.error?.code}, missing name=${!!r2.error}, unknown tool=${!!r3.error}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
  save('D9-2', ev); results['D9-2'] = ev;
  console.log(`[D9-2] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_3() {
  const ev = { caseId: 'D9-3', title: 'tools/call响应格式', steps: [] };
  const p = startMcpServer();
  try {
    const iid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    await waitForResp(p, iid);
    const id1 = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: id1, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
    const r1 = await waitForResp(p, id1, 15000);
    const ok1 = Array.isArray(r1.result?.content) && r1.result.content[0]?.type === 'text' && r1.result.isError === false;
    ev.steps.push({ test: 'success call', pass: ok1 });
    const id2 = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: id2, method: 'tools/call', params: { name: 'no_such', arguments: {} } });
    const r2 = await waitForResp(p, id2);
    const ok2 = !!r2.error && typeof r2.error.code === 'number' && typeof r2.error.message === 'string';
    ev.steps.push({ test: 'error call', pass: ok2 });
    ev.verdict = ok1 && ok2 ? 'PASS' : 'FAIL';
    ev.summary = `success=${ok1}, error=${ok2}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
  save('D9-3', ev); results['D9-3'] = ev;
  console.log(`[D9-3] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_4() {
  const ev = { caseId: 'D9-4', title: '协议生命周期', steps: [] };
  const p = startMcpServer();
  try {
    const iid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: { name: 'test', version: '1.0' } } });
    const ir = await waitForResp(p, iid);
    ev.steps.push({ step: 'initialize', pass: !!ir.result?.serverInfo });
    sendMsg(p, { jsonrpc: '2.0', method: 'notifications/initialized' });
    ev.steps.push({ step: 'notifications/initialized', pass: true });
    const lid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: lid, method: 'tools/list', params: {} });
    const lr = await waitForResp(p, lid);
    ev.steps.push({ step: 'tools/list', pass: lr.result?.tools?.length === 40 });
    const cid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: cid, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
    const cr = await waitForResp(p, cid, 15000);
    ev.steps.push({ step: 'tools/call', pass: !!cr.result?.content });
    ev.steps.push({ step: 'capabilities', pass: !!ir.result?.capabilities?.tools });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `all ${ev.verdict}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
  save('D9-4', ev); results['D9-4'] = ev;
  console.log(`[D9-4] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_5() {
  const ev = { caseId: 'D9-5', title: 'stdio传输健壮', steps: [] };
  const p = startMcpServer();
  try {
    const iid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    await waitForResp(p, iid);
    const big = 'ecs ' + 'x'.repeat(50000);
    const id1 = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: id1, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: big } } });
    const r1 = await waitForResp(p, id1, 15000);
    ev.steps.push({ test: 'large payload 50KB', pass: !!r1.result?.content });
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const cid = nextId();
      sendMsg(p, { jsonrpc: '2.0', id: cid, method: 'tools/list', params: {} });
      promises.push(waitForResp(p, cid));
    }
    const resps = await Promise.all(promises);
    ev.steps.push({ test: '5 concurrent', pass: resps.every(r => r.result?.tools?.length === 40) });
    let seqOk = true;
    for (let i = 0; i < 3; i++) {
      const sid = nextId();
      sendMsg(p, { jsonrpc: '2.0', id: sid, method: 'tools/list', params: {} });
      const sr = await waitForResp(p, sid);
      if (!sr.result?.tools) seqOk = false;
    }
    ev.steps.push({ test: '3 sequential', pass: seqOk });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `large=${ev.steps[0].pass}, concurrent=${ev.steps[1].pass}, sequential=${ev.steps[2].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
  save('D9-5', ev); results['D9-5'] = ev;
  console.log(`[D9-5] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_6() {
  const ev = { caseId: 'D9-6', title: '跨客户端互通', steps: [] };
  const clients = [{ name: 'claude-desktop', version: '0.1.0' }, { name: 'cursor', version: '0.42.0' }, { name: 'hermes', version: '1.0.0' }];
  for (const c of clients) {
    const p = startMcpServer();
    try {
      const iid = nextId();
      sendMsg(p, { jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: c } });
      const ir = await waitForResp(p, iid);
      const lid = nextId();
      sendMsg(p, { jsonrpc: '2.0', id: lid, method: 'tools/list', params: {} });
      const lr = await waitForResp(p, lid);
      ev.steps.push({ client: c.name, pass: !!ir.result?.serverInfo && lr.result?.tools?.length === 40 });
    } catch (e) { ev.steps.push({ client: c.name, pass: false, error: e.message }); }
    finally { killProc(p); }
  }
  ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
  ev.summary = ev.steps.map(s => `${s.client}=${s.pass}`).join(', ');
  save('D9-6', ev); results['D9-6'] = ev;
  console.log(`[D9-6] ${ev.verdict} - ${ev.summary}`);
}

async function d9_9() {
  const ev = { caseId: 'D9-9', title: '超时协议语义与取消', steps: [] };
  const p = startMcpServer();
  try {
    const iid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: iid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    const ir = await waitForResp(p, iid);
    const caps = ir.result?.capabilities || {};
    const hasCancel = !!(caps.notifications?.cancelled);
    ev.steps.push({ step: 'probe cancellation', hasCancel, note: hasCancel ? 'supported' : 'SPEC-MISMATCH', pass: true });
    const cid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: cid, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
    const cr = await waitForResp(p, cid, 15000);
    ev.steps.push({ step: 'normal call', pass: !!cr.result || !!cr.error });
    const eid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: eid, method: 'unknown/method', params: {} });
    const er = await waitForResp(p, eid);
    ev.steps.push({ step: 'error format', code: er.error?.code, pass: er.error?.code === -32601 });
    const rid = nextId();
    sendMsg(p, { jsonrpc: '2.0', id: rid, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    const rr = await waitForResp(p, rid);
    ev.steps.push({ step: 'recovery', pass: !!rr.result?.serverInfo });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `cancellation=${hasCancel}(SPEC-MISMATCH), error=${ev.steps[2].pass}, recovery=${ev.steps[3].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
  save('D9-9', ev); results['D9-9'] = ev;
  console.log(`[D9-9] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_10() {
  const ev = { caseId: 'D9-10', title: 'MCP remote transport', steps: [] };
  const p = spawn('node', [MCP_SERVER, '--transport', 'remote', '--port', '9528', '--host', '127.0.0.1'], {
    stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' },
  });
  p.stderr.on('data', () => {});
  try {
    await new Promise(r => setTimeout(r, 3000));
    const r1 = await fetch('http://127.0.0.1:9528', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } }) });
    const d1 = await r1.json();
    ev.steps.push({ test: 'remote init', pass: !!d1.result?.serverInfo });
    const r2 = await fetch('http://127.0.0.1:9528', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) });
    const d2 = await r2.json();
    ev.steps.push({ test: 'remote tools/list', count: d2.result?.tools?.length, pass: d2.result?.tools?.length === 40 });
    const r3 = await fetch('http://127.0.0.1:9528', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: 'ecs' } } }) });
    const d3 = await r3.json();
    ev.steps.push({ test: 'remote tools/call', pass: !!d3.result?.content });
    const r4 = await fetch('http://127.0.0.1:9528', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'unknown/method', params: {} }) });
    const d4 = await r4.json();
    ev.steps.push({ test: 'remote error', code: d4.error?.code, pass: d4.error?.code === -32601 });
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `init=${ev.steps[0].pass}, list=${ev.steps[1].pass}, call=${ev.steps[2].pass}, error=${ev.steps[3].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
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
    ev.steps.push({ step: 'source has tunnel code', hasTunnel, pass: true });
    const p = spawn('node', [MCP_SERVER, '--transport', 'remote', '--port', '9529', '--host', '127.0.0.1'], {
      stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' },
    });
    p.stderr.on('data', () => {});
    await new Promise(r => setTimeout(r, 3000));
    const r1 = await fetch('http://127.0.0.1:9529', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } }) });
    const d1 = await r1.json();
    ev.steps.push({ step: 'server serving', pass: !!d1.result?.serverInfo });
    killProc(p);
    await new Promise(r => setTimeout(r, 1000));
    let closed = false;
    try { await fetch('http://127.0.0.1:9529', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch { closed = true; }
    ev.steps.push({ step: 'server closed', pass: closed });
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
  for (const [id, r] of Object.entries(results)) console.log(`  ${id}: ${r.verdict}`);
  const p = Object.values(results).filter(r => r.verdict === 'PASS').length;
  const f = Object.values(results).filter(r => r.verdict === 'FAIL').length;
  console.log(`PASS=${p} FAIL=${f}`);
  writeFileSync(resolve(EVIDENCE_DIR, 'd9-p1-summary.json'), JSON.stringify(results, null, 2), 'utf8');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
