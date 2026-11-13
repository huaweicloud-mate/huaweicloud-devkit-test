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

const expect = ["huaweicloud_sandbox_check_user", "huaweicloud_sandbox_credentials", "huaweicloud_sandbox_sign_agreement", "huaweicloud_sandbox_upload_file", "huaweicloud_sandbox_exec_one_shot", "huaweicloud_sandbox_deploy_check", "huaweicloud_sandbox_close_session"];
const r = await call("huaweicloud_check_cli", {});
const tools = []; { const l = await send({jsonrpc:"2.0",id:_id++,method:"tools/list",params:{}}); for (const t of (l?.result?.tools||[])) tools.push(t.name); }
const missing = expect.filter(e => !tools.includes(e));
const cu = await call("huaweicloud_sandbox_check_user", {});
const cuOk = !cu?.result?.isError;
const pass = missing.length === 0 && cuOk;
finish(pass ? "PASS" : "FAIL", "7沙箱工具缺失=" + (missing.join(",")||"(空)") + " check_user返回=" + (cuOk?"ok":"err") + " resp=" + ctext(cu).slice(0,150).replace(/\n/g," "));
child.kill();
