import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const SERVER = "/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs";
const HERE = new URL(".", import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,"").slice(0,14); writeFileSync(HERE+"stdout.log", JSON.stringify({status,why,executedAt:ts},null,1)); }
const child = spawn(process.execPath, [SERVER], { stdio:["pipe","pipe","pipe"], env:{...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE:"local"} });
let buf=Buffer.alloc(0); const pending=new Map(); let _id=1;
function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from("Content-Length: "+Buffer.byteLength(b)+"\r\n\r\n"+b)); return new Promise(r=>pending.set(o.id,r)); }
child.stdout.on("data", d=>{ buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf("\r\n\r\n"); if(h<0) break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){ buf=buf.slice(h+4); continue; } const n=+m[1]; if(buf.length<h+4+n) break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{ const msg=JSON.parse(body); if(msg.id&&pending.has(msg.id)){ pending.get(msg.id)(msg); pending.delete(msg.id);} }catch{} } });
async function init(){ return send({jsonrpc:"2.0",id:_id++,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"probe",version:"1"}}}); }
async function call(name,args){ return send({jsonrpc:"2.0",id:_id++,method:"tools/call",params:{name,arguments:args||{}}}); }
function ctext(r){ try{ return r?.result?.content?.[0]?.text || ""; }catch{ return ""; } }
await init();

const t0 = Date.now();
const c2 = spawn(process.execPath, [SERVER], { stdio:["pipe","pipe","pipe"], env:{...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE:"local"} });
let b2=Buffer.alloc(0); const p2=new Map(); let i2=1;
function s2(o){ const b=JSON.stringify(o); c2.stdin.write(Buffer.from("Content-Length: "+Buffer.byteLength(b)+"\r\n\r\n"+b)); return new Promise(r=>p2.set(o.id,r)); }
c2.stdout.on("data", d=>{ b2=Buffer.concat([b2,d]); while(true){ const h=b2.indexOf("\r\n\r\n"); if(h<0) break; const m=/Content-Length:\s*(\d+)/i.exec(b2.slice(0,h).toString()); if(!m){ b2=b2.slice(h+4); continue; } const n=+m[1]; if(b2.length<h+4+n) break; const body=b2.slice(h+4,h+4+n).toString(); b2=b2.slice(h+4+n); try{ const msg=JSON.parse(body); if(msg.id&&p2.has(msg.id)){ p2.get(msg.id)(msg); p2.delete(msg.id);} }catch{} } });
await s2({jsonrpc:"2.0",id:i2++,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"probe",version:"1"}}});
const cold = Date.now()-t0;
c2.kill();
finish(cold < 5000 ? "PASS" : "FAIL", "冷启=" + cold + "ms (阈值<5000ms)");
