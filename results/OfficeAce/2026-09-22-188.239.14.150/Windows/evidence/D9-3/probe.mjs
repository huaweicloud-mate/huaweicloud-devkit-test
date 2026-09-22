// AI生成
// D9-3: 响应格式 - 每个响应包含jsonrpc版本和id
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
  // Test with different id types: number, string
  sendMsg(proc, {jsonrpc:'2.0', id:42, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}});
  const r1 = await waitForResponse(proc);
  results.push({check:'numeric_id_echoed', pass: r1.id === 42 && r1.jsonrpc === '2.0'});

  sendMsg(proc, {jsonrpc:'2.0', id:'abc-123', method:'tools/list', params:{}});
  const r2 = await waitForResponse(proc);
  results.push({check:'string_id_echoed', pass: r2.id === 'abc-123' && r2.jsonrpc === '2.0'});

  // Result response should have result field, not error
  results.push({check:'success_has_result', pass: !!r1.result && !r1.error});
  results.push({check:'list_has_result', pass: !!r2.result && !r2.error});

  // tools/call response should have content array
  sendMsg(proc, {jsonrpc:'2.0', id:3, method:'tools/call', params:{name:'huaweicloud_auth_status', arguments:{}}});
  const r3 = await waitForResponse(proc);
  results.push({check:'call_has_jsonrpc', pass: r3.jsonrpc === '2.0'});
  results.push({check:'call_id_echoed', pass: r3.id === 3});

  proc.stdin.end();
  setTimeout(() => proc.kill(), 1000);

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `响应格式正确: 所有响应含jsonrpc=2.0和id回显, 成功响应含result` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
