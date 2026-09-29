// D9 MCP 协议域探针（v1.1.5 校正）—— dispatch / tools/list / JSON-RPC 错误码 / tools/call 格式
import { dispatch } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { TOOL_DEFINITIONS } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { spawn } from 'node:child_process';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D9-5 stdio 传输健壮 / D9-4 initialize 返回标准字段
{
  const init = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'probe', version: '1' } }, { sessionId: 'probe' });
  check('D9-5', 'initialize 返回 protocolVersion', init.protocolVersion, '2024-11-05');
  check('D9-5', 'initialize 返回 capabilities', typeof init.capabilities, 'object');
  check('D9-5', 'serverInfo.name', init.serverInfo.name, 'huaweicloud-devkit');
}

// D9-1 tools/list 合规
{
  const r = await dispatch('tools/list', {}, { sessionId: 'probe' });
  check('D9-1', 'tools/list 返回数组', Array.isArray(r.tools), true);
  check('D9-1', '工具数量 = tools.mjs 注册源数量', r.tools.length, TOOL_DEFINITIONS.length);
  const invalid = r.tools.filter((t) => !t.name || typeof t.inputSchema !== 'object');
  check('D9-1', '每个工具含 name + inputSchema', invalid.length, 0);
}

// D9-3 tools/call 响应格式
{
  const r = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: 'probe' });
  check('D9-3', 'tools/call 返回 content 数组', Array.isArray(r.content), true);
  check('D9-3', 'content[0].type=text', r.content?.[0]?.type, 'text');
  check('D9-3', 'isError=false', r.isError, false);
}

// D9-2 JSON-RPC 错误码：dispatch 层 -32601 已正确（v1.1.5 #650 修复）
{
  let err = null;
  try { await dispatch('nonexistent/method', {}, { sessionId: 'probe' }); } catch (e) { err = e; }
  check('D9-2', '未知方法 dispatch 抛错且 code=-32601', err?.code, -32601);
  check('D9-2', '错误消息含 Method not found', /Method not found/.test(err?.message || ''), true);
}

console.log('\n=== D9 MCP 协议域探针结果（v1.1.5）===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);

// 附录：走真实 stdio server 验证 -32601 与 -32602（D9-2 残余 -32602 由 protocol-probe 判定）
const p = spawn(process.execPath, ['/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'] });
let buf = Buffer.alloc(0); const pending = new Map(); let id = 1;
function send(o){ const b=JSON.stringify(o); p.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r)); }
p.stdout.on('data', d => { buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); let msg; try{msg=JSON.parse(body)}catch{continue} if(msg.id!=null&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);} } });
await send({jsonrpc:'2.0',id:id++,method:'initialize',params:{protocolVersion:'2024-11-05',clientInfo:{name:'probe',version:'1'}}});
const um = await send({jsonrpc:'2.0',id:id++,method:'no/such/method',params:{}});
console.log('stdio unknown method =>', JSON.stringify({ code: um?.error?.code, msg: um?.error?.message }));
const ip = await send({jsonrpc:'2.0',id:id++,method:'tools/list',params:'not-an-object'});
console.log('stdio tools/list invalid-params =>', JSON.stringify({ hasError: !!ip?.error, code: ip?.error?.code ?? null, hasResult: !!ip?.result }));
p.kill();
console.log('\nNOTE  D9-2 -32602(invalid params) 残余 => 由 eval/harness/protocol-probe.mjs 判定（tools/list 传 string params 未返回 -32602）');
process.exit(fail > 0 ? 1 : 0);
