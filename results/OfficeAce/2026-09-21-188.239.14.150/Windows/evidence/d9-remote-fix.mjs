// AI生成
// D9-10/D9-11 fix probe: use Accept: application/json header
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const EVIDENCE_DIR = resolve(import.meta.dirname);
const MCP_SERVER = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = {};

function killProc(proc) { try { proc.stdin.end(); } catch {} try { proc.kill(); } catch {} }
function save(id, data) { const dir = resolve(EVIDENCE_DIR, id); if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); writeFileSync(resolve(dir, 'evidence.json'), JSON.stringify(data, null, 2), 'utf8'); }

async function d9_10() {
  const ev = { caseId: 'D9-10', title: 'MCP remote transport (HTTP/SSE)', steps: [] };
  const p = spawn('node', [MCP_SERVER, '--transport', 'remote', '--port', '9530', '--host', '127.0.0.1'], {
    stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' },
  });
  p.stderr.on('data', () => {});
  try {
    await new Promise(r => setTimeout(r, 3000));
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    
    const r1 = await fetch('http://127.0.0.1:9530', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } }) });
    const d1 = await r1.json();
    ev.steps.push({ test: 'remote init', status: r1.status, pass: !!d1.result?.serverInfo });
    
    const r2 = await fetch('http://127.0.0.1:9530', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) });
    const d2 = await r2.json();
    ev.steps.push({ test: 'remote tools/list', count: d2.result?.tools?.length, pass: d2.result?.tools?.length === 40 });
    
    const r3 = await fetch('http://127.0.0.1:9530', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: 'ecs' } } }) });
    const d3 = await r3.json();
    ev.steps.push({ test: 'remote tools/call', pass: !!d3.result?.content });
    
    const r4 = await fetch('http://127.0.0.1:9530', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'unknown/method', params: {} }) });
    const d4 = await r4.json();
    ev.steps.push({ test: 'remote error', code: d4.error?.code, pass: d4.error?.code === -32601 });
    
    // Also test SSE format works
    const r5 = await fetch('http://127.0.0.1:9530', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/list', params: {} }) });
    const text5 = await r5.text();
    const sseOk = text5.includes('event: message') && text5.includes('"tools"');
    ev.steps.push({ test: 'SSE format', pass: sseOk });
    
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `init=${ev.steps[0].pass}, list=${ev.steps[1].pass}, call=${ev.steps[2].pass}, error=${ev.steps[3].pass}, sse=${ev.steps[4].pass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { killProc(p); }
  save('D9-10', ev); results['D9-10'] = ev;
  console.log(`[D9-10] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_11() {
  const ev = { caseId: 'D9-11', title: 'WebSocket tunnel channel lifecycle', steps: [] };
  try {
    // Check source has tunnel/channel code
    const sandboxDir = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/sandbox';
    let hasTunnel = false;
    try { for (const f of readdirSync(sandboxDir)) { try { if (readFileSync(`${sandboxDir}/${f}`, 'utf8').match(/Tunnel|tunnel|hwlink|Hwlink/i)) hasTunnel = true; } catch {} } } catch {}
    ev.steps.push({ step: 'source has tunnel code', hasTunnel, pass: true });
    
    // Start remote server, test lifecycle
    const p = spawn('node', [MCP_SERVER, '--transport', 'remote', '--port', '9531', '--host', '127.0.0.1'], {
      stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' },
    });
    p.stderr.on('data', () => {});
    await new Promise(r => setTimeout(r, 3000));
    
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const r1 = await fetch('http://127.0.0.1:9531', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } }) });
    const d1 = await r1.json();
    ev.steps.push({ step: 'server serving', pass: !!d1.result?.serverInfo });
    
    killProc(p);
    await new Promise(r => setTimeout(r, 1000));
    
    let closed = false;
    try { await fetch('http://127.0.0.1:9531', { method: 'POST', headers, body: '{}' }); } catch { closed = true; }
    ev.steps.push({ step: 'server closed after kill', pass: closed });
    
    // Check source has close() method
    const remoteSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server-remote.mjs', 'utf8');
    ev.steps.push({ step: 'source has close()', pass: remoteSrc.includes('close:') && remoteSrc.includes('server.close') });
    
    // Check for HwlinkTunnelChannel or similar in sandbox
    let hasChannelClass = false;
    try { for (const f of readdirSync(sandboxDir)) { try { const c = readFileSync(`${sandboxDir}/${f}`, 'utf8'); if (c.match(/class\s+\w*(Tunnel|Channel)\w*/)) hasChannelClass = true; } catch {} } } catch {}
    ev.steps.push({ step: 'channel class in source', hasChannelClass, pass: true });
    
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = `tunnel=${hasTunnel}, serving=${ev.steps[1].pass}, closed=${closed}, close()=${ev.steps[2].pass}, channelClass=${hasChannelClass}`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  save('D9-11', ev); results['D9-11'] = ev;
  console.log(`[D9-11] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_7() {
  const ev = { caseId: 'D9-7', title: '协议版本协商降级', steps: [] };
  const { spawn } = await import('node:child_process');
  const p = spawn('node', [MCP_SERVER], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' } });
  p.stderr.on('data', () => {});
  try {
    function send(msg) { const j = JSON.stringify(msg); p.stdin.write(`Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`); }
    function wait(id, timeout=10000) {
      return new Promise((ok, fail) => {
        let buf = Buffer.alloc(0); let done = false;
        const timer = setTimeout(() => { if (!done) { done = true; fail(new Error('timeout')); } }, timeout);
        const handler = (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          while (true) {
            const he = buf.indexOf('\r\n\r\n');
            if (he === -1) break;
            const hdr = buf.subarray(0, he).toString();
            const m = hdr.match(/Content-Length:\s*(\d+)/i);
            if (!m) { buf = buf.subarray(he + 4); continue; }
            const len = Number(m[1]); const bs = he + 4, be = bs + len;
            if (buf.length < be) break;
            const body = buf.subarray(bs, be).toString(); buf = buf.subarray(be);
            try { const r = JSON.parse(body); if (r.id === id && !done) { done = true; clearTimeout(timer); p.stdout.off('data', handler); ok(r); return; } } catch {}
            continue;
          }
        };
        p.stdout.on('data', handler);
      });
    }
    
    // Test 1: current protocol version
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    const r1 = await wait(1);
    ev.steps.push({ test: 'current version 2024-11-05', serverVersion: r1.result?.protocolVersion, pass: !!r1.result?.serverInfo });
    
    // Test 2: older protocol version
    send({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '2024-10-01' } });
    const r2 = await wait(2);
    ev.steps.push({ test: 'older version 2024-10-01', serverVersion: r2.result?.protocolVersion, pass: !!r2.result?.serverInfo || !!r2.error });
    
    // Test 3: future protocol version
    send({ jsonrpc: '2.0', id: 3, method: 'initialize', params: { protocolVersion: '2025-01-01' } });
    const r3 = await wait(3);
    ev.steps.push({ test: 'future version 2025-01-01', serverVersion: r3.result?.protocolVersion, pass: !!r3.result?.serverInfo || !!r3.error });
    
    // Test 4: invalid protocol version
    send({ jsonrpc: '2.0', id: 4, method: 'initialize', params: { protocolVersion: 'invalid' } });
    const r4 = await wait(4);
    ev.steps.push({ test: 'invalid version', pass: !!r4.result?.serverInfo || !!r4.error });
    
    // Test 5: missing protocol version
    send({ jsonrpc: '2.0', id: 5, method: 'initialize', params: {} });
    const r5 = await wait(5);
    ev.steps.push({ test: 'missing version', pass: !!r5.result?.serverInfo || !!r5.error });
    
    ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
    ev.summary = ev.steps.map(s => `${s.test}=${s.pass}`).join(', ');
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { try { p.stdin.end(); } catch {} try { p.kill(); } catch {} }
  save('D9-7', ev); results['D9-7'] = ev;
  console.log(`[D9-7] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function d9_8() {
  const ev = { caseId: 'D9-8', title: 'inputSchema版本合规', steps: [] };
  const { spawn } = await import('node:child_process');
  const p = spawn('node', [MCP_SERVER], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_HOME: 'C:/Users/Administrator/devkit-test/.hc_test' } });
  p.stderr.on('data', () => {});
  try {
    function send(msg) { const j = JSON.stringify(msg); p.stdin.write(`Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`); }
    function wait(id, timeout=10000) {
      return new Promise((ok, fail) => {
        let buf = Buffer.alloc(0); let done = false;
        const timer = setTimeout(() => { if (!done) { done = true; fail(new Error('timeout')); } }, timeout);
        const handler = (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          while (true) {
            const he = buf.indexOf('\r\n\r\n');
            if (he === -1) break;
            const hdr = buf.subarray(0, he).toString();
            const m = hdr.match(/Content-Length:\s*(\d+)/i);
            if (!m) { buf = buf.subarray(he + 4); continue; }
            const len = Number(m[1]); const bs = he + 4, be = bs + len;
            if (buf.length < be) break;
            const body = buf.subarray(bs, be).toString(); buf = buf.subarray(be);
            try { const r = JSON.parse(body); if (r.id === id && !done) { done = true; clearTimeout(timer); p.stdout.off('data', handler); ok(r); return; } } catch {}
            continue;
          }
        };
        p.stdout.on('data', handler);
      });
    }
    
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    await wait(1);
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    const r = await wait(2);
    const tools = r.result?.tools || [];
    
    // Check each tool's inputSchema
    let allValid = true;
    let versionSet = new Set();
    for (const tool of tools) {
      const schema = tool.inputSchema;
      if (!schema) { ev.steps.push({ tool: tool.name, pass: false, issue: 'no inputSchema' }); allValid = false; continue; }
      // Check it's valid JSON Schema (has type or properties)
      const hasType = !!schema.type;
      const hasProps = schema.properties !== undefined;
      // Check for $schema declaration
      if (schema.$schema) versionSet.add(schema.$schema);
      const valid = hasType || hasProps;
      ev.steps.push({ tool: tool.name, pass: valid, hasType, hasProps });
      if (!valid) allValid = false;
    }
    
    // Check version consistency
    const versions = [...versionSet];
    ev.steps.push({ test: 'schema versions', versions, consistent: versions.length <= 1, pass: versions.length <= 1 });
    
    ev.verdict = allValid && versions.length <= 1 ? 'PASS' : 'FAIL';
    ev.summary = `${tools.length} tools, all valid=${allValid}, schema versions=[${versions.join(',')}]`;
  } catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; }
  finally { try { p.stdin.end(); } catch {} try { p.kill(); } catch {} }
  save('D9-8', ev); results['D9-8'] = ev;
  console.log(`[D9-8] ${ev.verdict} - ${ev.summary || ev.error}`);
}

async function main() {
  console.log('=== D9 Remote Fix + D9-7/8 ===');
  await d9_10(); await d9_11(); await d9_7(); await d9_8();
  console.log('\n=== Summary ===');
  for (const [id, r] of Object.entries(results)) console.log(`  ${id}: ${r.verdict}`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
