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
const iso = mkdtempSync(join(tmpdir(), "d216-"));
const creq = { ak: "FAKEAK1234567890", sk: "FAKESK1234567890", region: "cn-north-4" };
const credPath = join(iso, ".config", "huaweicloud", "creds-import.json");
import { mkdirSync } from "node:fs"; mkdirSync(join(iso, ".config", "huaweicloud"), { recursive: true });
wf2(credPath, JSON.stringify(creq));
const c = spawn(process.execPath, [SERVER], { stdio:["pipe","pipe","pipe"], env:{...process.env, HOME:iso, HUAWEICLOUD_HOME:iso, HUAWEICLOUD_AGENT_TOOLKIT_MODE:"local"} });
let b3=Buffer.alloc(0); const p3=new Map(); let i3=1;
function s3(o){ const b=JSON.stringify(o); c.stdin.write(Buffer.from("Content-Length: "+Buffer.byteLength(b)+"\r\n\r\n"+b)); return new Promise(r=>p3.set(o.id,r)); }
c.stdout.on("data", d=>{ b3=Buffer.concat([b3,d]); while(true){ const h=b3.indexOf("\r\n\r\n"); if(h<0) break; const m=/Content-Length:\s*(\d+)/i.exec(b3.slice(0,h).toString()); if(!m){ b3=b3.slice(h+4); continue; } const n=+m[1]; if(b3.length<h+4+n) break; const body=b3.slice(h+4,h+4+n).toString(); b3=b3.slice(h+4+n); try{ const msg=JSON.parse(body); if(msg.id&&p3.has(msg.id)){ p3.get(msg.id)(msg); p3.delete(msg.id);} }catch{} } });
await s3({jsonrpc:"2.0",id:i3++,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"probe",version:"1"}}});
const rr = await s3({jsonrpc:"2.0",id:i3++,method:"tools/call",params:{name:"huaweicloud_auth_switch",arguments:{action:"persist",mode:"import"}}});
const wiped = !existsSync(credPath);
c.kill();
finish(wiped ? "PASS" : "FAIL", "creds-import.json 读后擦除=" + wiped);
