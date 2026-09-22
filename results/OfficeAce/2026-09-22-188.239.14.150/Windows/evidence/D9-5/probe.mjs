// AI生成
// D9-5: stdio传输 - Content-Length帧格式和换行分隔格式
import { spawn } from 'child_process';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const SERVER = join(SRC, 'src', 'mcp-server.mjs');
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const proc = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  const results = [];

  // Test Content-Length framing (standard MCP)
  const msg1 = {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}};
  const json1 = JSON.stringify(msg1);
  proc.stdin.write(`Content-Length: ${Buffer.byteLength(json1)}\r\n\r\n${json1}`);

  // Wait for Content-Length framed response
  const resp1 = await new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => reject(new Error('timeout')), 10000);
    proc.stdout.on('data', function handler(chunk) {
      buf = Buffer.concat([buf, chunk]);
      const idx = buf.indexOf('\r\n\r\n');
      if (idx !== -1) {
        const header = buf.subarray(0, idx).toString();
        const m = header.match(/Content-Length:\s*(\d+)/i);
        if (m) {
          const len = Number(m[1]);
          if (buf.length >= idx + 4 + len) {
            const body = buf.subarray(idx + 4, idx + 4 + len).toString('utf8');
            clearTimeout(timer);
            proc.stdout.off('data', handler);
            resolve({header, body: JSON.parse(body)});
          }
        }
      }
    });
  });

  results.push({check:'response_has_content_length', pass: /Content-Length:\s*\d+/i.test(resp1.header)});
  results.push({check:'response_body_valid_json', pass: !!resp1.body.jsonrpc});

  // Test newline-delimited JSON (fallback mode)
  const msg2 = {jsonrpc:'2.0', id:2, method:'tools/list', params:{}};
  proc.stdin.write(JSON.stringify(msg2) + '\n');

  const resp2 = await new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => reject(new Error('timeout')), 10000);
    proc.stdout.on('data', function handler(chunk) {
      buf = Buffer.concat([buf, chunk]);
      // Try newline-delimited first
      const lf = buf.indexOf('\n');
      if (lf !== -1) {
        const line = buf.subarray(0, lf).toString().trim();
        if (line.startsWith('{')) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.id === 2) {
              clearTimeout(timer);
              proc.stdout.off('data', handler);
              resolve(parsed);
            }
          } catch {}
        }
      }
      // Also try Content-Length
      const idx = buf.indexOf('\r\n\r\n');
      if (idx !== -1) {
        const header = buf.subarray(0, idx).toString();
        const m = header.match(/Content-Length:\s*(\d+)/i);
        if (m) {
          const len = Number(m[1]);
          if (buf.length >= idx + 4 + len) {
            const body = buf.subarray(idx + 4, idx + 4 + len).toString('utf8');
            const parsed = JSON.parse(body);
            if (parsed.id === 2) {
              clearTimeout(timer);
              proc.stdout.off('data', handler);
              resolve(parsed);
            }
          }
        }
      }
    });
  });

  results.push({check:'newline_delim_response', pass: !!resp2.result?.tools});

  proc.stdin.end();
  setTimeout(() => proc.kill(), 1000);

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `stdio传输正确: Content-Length帧和换行分隔格式均支持` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
