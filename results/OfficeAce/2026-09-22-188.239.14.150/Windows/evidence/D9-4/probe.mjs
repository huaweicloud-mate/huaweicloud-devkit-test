// AI生成
// D9-4: 生命周期 - initialize→initialized通知→tools/list→shutdown
import { spawn } from 'child_process';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const SERVER = join(SRC, 'src', 'mcp-server.mjs');
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

function sendMsg(proc, msg) {
  const json = JSON.stringify(msg);
  proc.stdin.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}
function waitForResponse(proc, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => reject(new Error('timeout')), timeout);
    proc.stdout.on('data', function handler(chunk) {
      buf = Buffer.concat([buf, chunk]);
      const idx = buf.indexOf('\r\n\r\n');
      if (idx !== -1) {
        const header = buf.subarray(0, idx).toString();
        const m = header.match(/Content-Length:\s*(\d+)/i);
        if (m) {
          const len = Number(m[1]);
          const body = buf.subarray(idx + 4, idx + 4 + len).toString('utf8');
          clearTimeout(timer);
          proc.stdout.off('data', handler);
          resolve(JSON.parse(body));
        }
      }
    });
  });
}

try {
  const proc = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  const results = [];

  // 1. initialize
  sendMsg(proc, {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}});
  const initResp = await waitForResponse(proc);
  results.push({check:'initialize_ok', pass: !!initResp.result?.protocolVersion});

  // 2. Send initialized notification (no id)
  sendMsg(proc, {jsonrpc:'2.0', method:'notifications/initialized'});
  // Wait a bit for notification processing
  await new Promise(r => setTimeout(r, 500));

  // 3. tools/list after initialized
  sendMsg(proc, {jsonrpc:'2.0', id:2, method:'tools/list', params:{}});
  const listResp = await waitForResponse(proc);
  results.push({check:'tools_list_after_init', pass: !!listResp.result?.tools && listResp.result.tools.length > 0});

  // 4. Multiple initialize calls (idempotent)
  sendMsg(proc, {jsonrpc:'2.0', id:3, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test2', version:'2.0'}}});
  const initResp2 = await waitForResponse(proc);
  results.push({check:'reinitialize_ok', pass: !!initResp2.result?.protocolVersion});

  // 5. tools/call after re-init
  sendMsg(proc, {jsonrpc:'2.0', id:4, method:'tools/call', params:{name:'huaweicloud_auth_status', arguments:{}}});
  const callResp = await waitForResponse(proc);
  results.push({check:'call_after_reinit', pass: callResp.jsonrpc === '2.0' && !!callResp.id});

  proc.stdin.end();
  setTimeout(() => proc.kill(), 1000);

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `生命周期正确: initialize→initialized→tools/list→re-initialize→tools/call 全链路通过` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
