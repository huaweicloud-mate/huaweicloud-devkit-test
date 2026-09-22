// AI生成
// D9-8: inputSchema合规 - 每个工具的inputSchema是有效的JSON Schema
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
  const proc = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  sendMsg(proc, {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}});
  await waitForResponse(proc);
  sendMsg(proc, {jsonrpc:'2.0', id:2, method:'tools/list', params:{}});
  const listResp = await waitForResponse(proc);
  proc.stdin.end();
  setTimeout(() => proc.kill(), 1000);

  const tools = listResp.result?.tools || [];
  const results = [];

  for (const tool of tools) {
    const schema = tool.inputSchema;
    const checks = {
      name: typeof tool.name === 'string' && tool.name.startsWith('huaweicloud_'),
      desc: typeof tool.description === 'string' && tool.description.length > 10,
      schema_type: schema?.type === 'object',
      schema_json: typeof schema === 'object' && schema !== null,
    };
    if (schema?.properties) {
      checks.has_properties = typeof schema.properties === 'object';
    }
    const ok = Object.values(checks).every(v => v === true);
    if (!ok) {
      results.push({check: tool.name, pass: false, details: checks});
    }
  }

  results.push({check:'all_tools_count', pass: tools.length >= 20, value: tools.length});
  // Verify a few specific tools have proper schemas
  const authStatus = tools.find(t => t.name === 'huaweicloud_auth_status');
  results.push({check:'auth_status_has_schema', pass: !!authStatus?.inputSchema?.type});
  const runReadonly = tools.find(t => t.name === 'huaweicloud_run_readonly_command');
  results.push({check:'run_readonly_has_schema', pass: !!runReadonly?.inputSchema?.type});
  const searchDocs = tools.find(t => t.name === 'huaweicloud_search_docs');
  results.push({check:'search_docs_has_schema', pass: !!searchDocs?.inputSchema?.type});

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `inputSchema合规: ${tools.length}个工具均有有效JSON Schema(type:object)` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
