// AI生成
// D9-6: 跨客户端互操作 - 不同clientInfo都能正常初始化
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
  const clients = [
    {name:'claude', version:'1.0'},
    {name:'cursor', version:'0.42'},
    {name:'vscode', version:'1.95'},
    {name:'windsurf', version:'1.0'},
  ];
  const results = [];

  for (const ci of clients) {
    const proc = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
    sendMsg(proc, {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:ci}});
    const resp = await waitForResponse(proc);
    sendMsg(proc, {jsonrpc:'2.0', id:2, method:'tools/list', params:{}});
    const listResp = await waitForResponse(proc);
    proc.stdin.end();
    setTimeout(() => proc.kill(), 1000);

    results.push({
      check:`${ci.name}_init`,
      pass: !!resp.result?.protocolVersion && resp.result.serverInfo?.name === 'huaweicloud-devkit'
    });
    results.push({
      check:`${ci.name}_tools`,
      pass: !!listResp.result?.tools && listResp.result.tools.length > 0
    });
  }

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `跨客户端互操作: ${clients.length}个客户端(claude/cursor/vscode/windsurf)均成功初始化并获取工具列表` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
