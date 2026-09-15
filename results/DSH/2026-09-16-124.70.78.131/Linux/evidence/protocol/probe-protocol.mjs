// DSH/Linux daily probe — MCP protocol + tool enumeration (v1.1.4 stable)
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { dispatch } = await import(CORE + '/mcp-protocol.mjs');
const { TOOL_DEFINITIONS } = await import(CORE + '/tools.mjs');
const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}
const N = TOOL_DEFINITIONS.length;
const tools = TOOL_DEFINITIONS.map(t=>t.name);
const dup = tools.filter((n,i)=>tools.indexOf(n)!==i);
check('D5-3',`TOOL_DEFINITIONS length (${N})`, N>=39 && N<=41, N);
check('D5-3','no duplicate tool names', dup.length===0, dup);
const withSchema = TOOL_DEFINITIONS.filter(t=>t.description && t.inputSchema && typeof t.inputSchema==='object');
check('D9-1','all tools have description+inputSchema', withSchema.length===N, `${withSchema.length}/${N}`);
let schemaOk=true; for (const t of TOOL_DEFINITIONS){const sc=t.inputSchema||{}; if(!sc.type||(sc.type==='object'&&sc.properties===undefined)){schemaOk=false;break;}}
check('D9-1','every inputSchema structurally valid', schemaOk, schemaOk);
const drafts=new Set(); for(const t of TOOL_DEFINITIONS){const s=JSON.stringify(t.inputSchema||{}); if(s.includes('draft-07'))drafts.add('draft-07'); if(s.includes('2020-12'))drafts.add('2020-12'); if(s.includes('draft-04'))drafts.add('draft-04');}
check('D9-8','single JSON Schema draft family', drafts.size<=1, [...drafts].join(',')||'(no $schema)');
const init = await dispatch('initialize',{protocolVersion:'2024-11-05',clientInfo:{name:'dsh-probe',version:'1.0'}},{sessionId:'probe-a'});
check('D9-4','initialize serverInfo', init.serverInfo?.name==='huaweicloud-devkit' && typeof init.serverInfo?.version==='string', init.serverInfo);
const tl = await dispatch('tools/list',{}, {sessionId:'probe-a'});
check('D9-4',`tools/list returns ${N} tools`, Array.isArray(tl.tools)&&tl.tools.length===N, tl.tools?.length);
let resOk=false; try { const rl = await dispatch('resources/list',{}, {sessionId:'probe-a'}); resOk = Array.isArray(rl.resources); } catch(e){}
check('D9-4','resources/list supported', resOk, resOk);
// D9-3 tools/call
const call = await dispatch('tools/call',{name:'huaweicloud_list_regions',arguments:{}}, {sessionId:'probe-a'});
check('D9-3','tools/call content[] text', Array.isArray(call.content)&&call.content[0]?.type==='text', call.content?.[0]?.type);
check('D9-3','tools/call isError=false', call.isError===false, call.isError);
// D9-2 JSON-RPC error code
let errObj=null; try { await dispatch('tools/bad',{},{sessionId:'probe-a'}); } catch(e){ errObj=e; }
check('D9-2','unknown method yields structured error', !!errObj && typeof errObj==='object', errObj && (errObj.code ?? errObj.message));
check('D9-2','unknown method code (-32601)', errObj && errObj.code===-32601, errObj && errObj.code);
const cu = TOOL_DEFINITIONS.find(t=>t.name==='huaweicloud_check_update');
const up = TOOL_DEFINITIONS.find(t=>t.name==='huaweicloud_upgrade');
check('D1-26','check_update + upgrade registered', !!cu&&!!up, `${!!cu},${!!up}`);
const failed=results.filter(r=>!r.pass);
console.log('=== PROTOCOL PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('--- FAILED ---');for(const r of failed)console.log(`  ${r.id} ${r.name} => ${r.actual}`);}
