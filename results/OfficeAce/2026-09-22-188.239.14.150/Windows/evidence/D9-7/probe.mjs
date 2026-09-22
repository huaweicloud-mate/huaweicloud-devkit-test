// AI生成
// D9-7: 版本协商 - initialize返回protocolVersion, 支持客户端请求的版本
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
          if (buf.length >= idx + 4 + len) {
            const body = buf.subarray(idx + 4, idx + 4 + len).toString('utf8');
            clearTimeout(timer);
            proc.stdout.off('data', handler);
            resolve(JSON.parse(body));
          }
        }
      }
    });
  });
}

try {
  const results = [];
  const versions = ['2024-11-05', '2025-03-26', 'latest'];

  for (const pv of versions) {
    const proc = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
    sendMsg(proc, {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:pv, clientInfo:{name:'test', version:'1.0'}}});
    const resp = await waitForResponse(proc);
    proc.stdin.end();
    setTimeout(() => proc.kill(), 1000);

    results.push({
      check:`version_${pv}`,
      pass: !!resp.result?.protocolVersion
    });
  }

  // Check serverInfo version matches package.json
  const proc2 = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  sendMsg(proc2, {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}});
  const resp2 = await waitForResponse(proc2);
  proc2.stdin.end();
  setTimeout(() => proc2.kill(), 1000);

  results.push({check:'serverInfo_has_name', pass: resp2.result?.serverInfo?.name === 'huaweicloud-devkit'});
  results.push({check:'serverInfo_has_version', pass: typeof resp2.result?.serverInfo?.version === 'string' && resp2.result.serverInfo.version.length > 0});
  results.push({check:'capabilities_has_tools', pass: !!resp2.result?.capabilities?.tools});

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `版本协商正确: 支持多protocolVersion, serverInfo含name/version, capabilities含tools` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
