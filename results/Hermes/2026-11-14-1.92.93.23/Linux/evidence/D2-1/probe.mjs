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

import { mkdtempSync, writeFileSync as wf2, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const iso = mkdtempSync(join(tmpdir(), "d21-"));
const c = spawn(process.execPath, [SERVER], { stdio:["pipe","pipe","pipe"], env:{...process.env, HOME:iso, HUAWEICLOUD_HOME:iso, HUAWEICLOUD_AGENT_TOOLKIT_MODE:"local"} });
let b4=Buffer.alloc(0); const p4=new Map(); let i4=1;
function s4(o){ const b=JSON.stringify(o); c.stdin.write(Buffer.from("Content-Length: "+Buffer.byteLength(b)+"\r\n\r\n"+b)); return new Promise(r=>p4.set(o.id,r)); }
c.stdout.on("data", d=>{ b4=Buffer.concat([b4,d]); while(true){ const h=b4.indexOf("\r\n\r\n"); if(h<0) break; const m=/Content-Length:\s*(\d+)/i.exec(b4.slice(0,h).toString()); if(!m){ b4=b4.slice(h+4); continue; } const n=+m[1]; if(b4.length<h+4+n) break; const body=b4.slice(h+4,h+4+n).toString(); b4=b4.slice(h+4+n); try{ const msg=JSON.parse(body); if(msg.id&&p4.has(msg.id)){ p4.get(msg.id)(msg); p4.delete(msg.id);} }catch{} } });
await s4({jsonrpc:"2.0",id:i4++,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"probe",version:"1"}}});
const rr = await s4({jsonrpc:"2.0",id:i4++,method:"tools/call",params:{name:"huaweicloud_auth_init",arguments:{ak:"FAKEAK1234567890",sk:"FAKESK1234567890",region:"cn-north-4"}}});
const txt = rr?.result?.content?.[0]?.text || "";
const s1 = existsSync(join(iso, ".config", "huaweicloud", "credentials.json"));
const ttl = rr?.result?.isError;
c.kill();
finish((!ttl && txt.length > 0) ? "PASS" : "FAIL", "auth_init isError=" + ttl + " resp=" + txt.slice(0,200).replace(/\n/g," ") + " S1落位=" + s1);
