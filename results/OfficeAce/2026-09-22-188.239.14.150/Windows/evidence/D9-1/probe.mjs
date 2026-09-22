// AI生成
// D9-1: tools/list 返回标准格式 - 启动MCP server并验证tools/list响应
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
  // 1. initialize
  sendMsg(proc, {jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}});
  const initResp = await waitForResponse(proc);
  // 2. tools/list
  sendMsg(proc, {jsonrpc:'2.0', id:2, method:'tools/list', params:{}});
  const listResp = await waitForResponse(proc);
  proc.stdin.end();
  setTimeout(() => proc.kill(), 1000);

  const results = [];
  results.push({check:'init_has_protocolVersion', pass: !!initResp.result?.protocolVersion});
  results.push({check:'init_has_serverInfo', pass: !!initResp.result?.serverInfo?.name});
  results.push({check:'list_has_tools_array', pass: Array.isArray(listResp.result?.tools)});
  results.push({check:'tools_nonempty', pass: Array.isArray(listResp.result?.tools) && listResp.result.tools.length > 0});
  // Each tool must have name, description, inputSchema
  let allToolsValid = true;
  if (Array.isArray(listResp.result?.tools)) {
    for (const t of listResp.result.tools) {
      if (!t.name || !t.description || !t.inputSchema) { allToolsValid = false; break; }
    }
  } else { allToolsValid = false; }
  results.push({check:'tools_have_name_desc_schema', pass: allToolsValid});
  // inputSchema should be type:object
  let schemaOk = true;
  if (Array.isArray(listResp.result?.tools)) {
    for (const t of listResp.result.tools) {
      if (t.inputSchema?.type !== 'object') { schemaOk = false; break; }
    }
  } else { schemaOk = false; }
  results.push({check:'inputSchema_type_object', pass: schemaOk});

  const allPass = results.every(r => r.pass);
  const toolCount = listResp.result?.tools?.length || 0;
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `tools/list返回标准格式: ${toolCount}个工具, 每个含name/description/inputSchema(type:object)` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
