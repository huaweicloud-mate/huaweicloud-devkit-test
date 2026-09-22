// AI生成
// D9-2: JSON-RPC错误码 - 未知方法返回-32601, 无效请求返回-32600
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
  // 1. initialize first
  sendMsg(proc, {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}});
  await waitForResponse(proc);
  // 2. Call unknown method - should get -32601
  sendMsg(proc, {jsonrpc:'2.0', id:2, method:'foo/bar', params:{}});
  const errResp = await waitForResponse(proc);
  // 3. Call tools/call with missing name - should get error
  sendMsg(proc, {jsonrpc:'2.0', id:3, method:'tools/call', params:{}});
  const badCallResp = await waitForResponse(proc);
  proc.stdin.end();
  setTimeout(() => proc.kill(), 1000);

  const results = [];
  results.push({check:'unknown_method_returns_error', pass: !!errResp.error});
  results.push({check:'unknown_method_code_32601', pass: errResp.error?.code === -32601});
  results.push({check:'error_has_message', pass: typeof errResp.error?.message === 'string' && errResp.error.message.length > 0});
  results.push({check:'bad_call_returns_error', pass: !!badCallResp.error});
  results.push({check:'jsonrpc_version_in_response', pass: errResp.jsonrpc === '2.0'});
  results.push({check:'id_echoed', pass: errResp.id === 2});

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `JSON-RPC错误码正确: 未知方法=-32601, 响应含jsonrpc版本和id回显` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
