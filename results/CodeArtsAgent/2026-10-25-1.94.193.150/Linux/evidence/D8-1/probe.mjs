// D8-1 文档与能力一致（工具数核对）探针
// 契约：文档声明的工具数 = tools/list 实际返回数。
// 实测：src/AGENTS.md:27,45 硬编码 39 tools，实际 42。
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
const AGENTS = join(SRC, '..', '..', '..', 'AGENTS.md'); // hdk/AGENTS.md
const serverPath = join(SRC, 'mcp-server.mjs');

let docCount = null;
try {
  const txt = readFileSync(AGENTS, 'utf8');
  const m = txt.match(/(\d+)\s+(?:tools in tools\.mjs|MCP tool definitions)/);
  docCount = m ? parseInt(m[1]) : null;
  console.log(`文档声明工具数: ${docCount}`);
} catch (e) { console.log('读 AGENTS.md 失败:', e.message); }

const child = spawn(process.execPath, [serverPath], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r)); }
child.stdout.on('data', d => { buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{const msg=JSON.parse(body); if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{} } });

await send({jsonrpc:'2.0',id:_id++,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1'}}});
child.stdin.write(Buffer.from(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n'));
const r = await send({jsonrpc:'2.0',id:_id++,method:'tools/list',params:{}});
const actual = (r?.result?.tools||[]).length;
console.log(`tools/list 实际工具数: ${actual}`);

const consistent = docCount === actual;
console.log(`${consistent ? '[OK] 文档=实现' : '[FAIL] 文档≠实现'} | 文档=${docCount} 实际=${actual}`);
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId:'D8-1', verdict: consistent ? 'PASS':'FAIL', rootCause: `AGENTS.md:27/45 硬编码 ${docCount} tools，实现 ${actual} tools` }, null, 2));
child.kill(); process.exit(0);
