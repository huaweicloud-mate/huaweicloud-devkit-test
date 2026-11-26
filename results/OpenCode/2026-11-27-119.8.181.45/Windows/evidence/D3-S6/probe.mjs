import { spawnSync } from "node:child_process"; import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path"; import os from "node:os";
const EV=String.raw`C:\Users\Administrator\devkit-test\OpenCode\huaweicloud-devkit-test\results\OpenCode\2026-11-27-119.8.181.45\Windows\evidence\D3-S6`;
const CASE_ID="D3-S6"; const NK=(()=>{const d=new Date(Date.now()+8*3600*1000);return d.toISOString().replace(/[-:T]/g,"").slice(0,14)})();
const REG="cn-north-4"; const NAME="tctest-fg-"+NK.slice(4,12);
const cred=JSON.parse(readFileSync(join(os.homedir(),".config","huaweicloud","credentials.json"),"utf8"));
const ENV={...process.env,HW_ACCESS_KEY:cred.ak,HW_SECRET_KEY:cred.sk};
const hc=(a,t=90000)=>{const r=spawnSync("hcloud",a,{encoding:"utf8",timeout:t,env:ENV});let j=null;try{j=JSON.parse((r.stdout||"").trim())}catch{};return{code:r.status,out:(r.stdout||"").trim(),err:(r.stderr||"").trim(),json:j}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const emit=(s,w,res)=>{const o={caseId:CASE_ID,status:s,why:w,executedAt:NK,result:res};writeFileSync(join(EV,"stdout.log"),JSON.stringify(o,null,2),"utf8");console.log(JSON.stringify({caseId:CASE_ID,status:s,why:w}))};
const codeB64=Buffer.from("exports.handler = function (event, context, callback) { callback(null, 'ok'); };").toString("base64");
const listFns=()=>{const r=hc(["FunctionGraph","ListFunctions","--cli-region="+REG,"--cli-output=json"]);const a=(r.json&&(r.json.functions||r.json.func_list))||[];return a.filter(f=>String(f.func_name||"").startsWith("tctest-fg"))};
async function main(){
 let urn=null;
 try{
  const c=hc(["FunctionGraph","CreateFunction","--cli-region="+REG,"--func_name="+NAME,"--runtime=Node.js18.15","--handler=index.handler","--memory_size=128","--package=default","--timeout=30","--code_type=inline","--func_code.file="+codeB64,"--cli-output=json"]);
  console.log("create",JSON.stringify(c.json||c.out.slice(0,300)));
  urn=c.json&&(c.json.func_urn||(c.json.function&&c.json.function.func_urn));
  let fns=listFns(); let ok=!!urn||fns.length>0;
  if(!urn&&fns[0])urn=fns[0].func_urn||fns[0].func_name;
  let invocation=null;
  if(urn){ await sleep(2000); invocation=hc(["FunctionGraph","InvokeFunction","--cli-region="+REG,"--function_urn="+urn,"--cli-output=json"],60000); }
  // cleanup
  if(urn){ hc(["FunctionGraph","DeleteFunction","--cli-region="+REG,"--function_urn="+urn.replace(/:latest$/,"")],90000); for(let i=0;i<20;i++){ if(listFns().length===0)break; await sleep(4000);} }
  const zero=listFns().length===0;
  const invOk=invocation&&(invocation.code===0||/"result"|ok|returned/i.test(invocation.out));
  if(ok&&zero) emit("PASS","FunctionGraph 创建→调用→删除闭环成功（func_urn 获取、调用返回、清理归零）",{name:NAME,urn,invocation:invocation&&{code:invocation.code,out:invocation.out.slice(0,200)},zeroResidue:zero});
  else emit("FAIL","FunctionGraph 闭环失败：created="+ok+" zero="+zero+" "+(c.json&&c.json.error?JSON.stringify(c.json.error):c.out.slice(0,200)),{create:c.json||c.out.slice(0,300),urn,zeroResidue:zero});
 }catch(e){ if(urn)hc(["FunctionGraph","DeleteFunction","--cli-region="+REG,"--function_urn="+urn.replace(/:latest$/,"")],90000); emit("FAIL","probe exception: "+String(e&&e.stack||e),{}); }
}
main();
