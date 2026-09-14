import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ["C:/Users/Administrator/devkit-test/hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"], { cwd: "C:/Users/Administrator/devkit-test/hermes/hdk", stdio: ['pipe', 'pipe', 'pipe'] });
let buffer = Buffer.alloc(0); const pending = new Map();
child.stdout.on('data', (chunk) => { buffer = Buffer.concat([buffer, chunk]);
  while (true) { const he = buffer.indexOf('\r\n\r\n'); if (he===-1) return;
    const h = buffer.subarray(0,he).toString('utf8'); const m = h.match(/Content-Length:\s*(\d+)/i); if(!m) return;
    const l = Number(m[1]); const bs = he+4; const be = bs+l; if(buffer.length<be) return;
    const p = JSON.parse(buffer.subarray(bs,be).toString('utf8')); buffer = buffer.subarray(be);
    pending.get(p.id)?.(p); } });
child.stderr.on('data', () => {});
function frame(msg) { const j=JSON.stringify(msg); return `Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`; }
function request(method, params={}) { const id=Math.floor(Math.random()*1e6);
  child.stdin.write(frame({jsonrpc:'2.0',id,method,params}));
  return new Promise((res,rej)=>{ const t=setTimeout(()=>rej(new Error('Timeout '+method)),15000);
    pending.set(id,(p)=>{clearTimeout(t);pending.delete(id);res(p);}); }); }
function call(name,args={}) { return request('tools/call',{name,arguments:args}); }
try { await request('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'p',version:'1'}});
  
  try {
    const ops_ECS = await call('huaweicloud_list_operations', { service: 'ECS' });
    const t_ECS = ops_ECS.result?.content?.[0]?.text || '';
    const p_ECS = JSON.parse(t_ECS);
    console.log("ECS: isError=" + ops_ECS.result?.isError + " service=" + p_ECS.service);
  } catch(e) { console.log("ECS: ERROR " + e.message); }


  try {
    const ops_VPC = await call('huaweicloud_list_operations', { service: 'VPC' });
    const t_VPC = ops_VPC.result?.content?.[0]?.text || '';
    const p_VPC = JSON.parse(t_VPC);
    console.log("VPC: isError=" + ops_VPC.result?.isError + " service=" + p_VPC.service);
  } catch(e) { console.log("VPC: ERROR " + e.message); }


  try {
    const ops_OBS = await call('huaweicloud_list_operations', { service: 'OBS' });
    const t_OBS = ops_OBS.result?.content?.[0]?.text || '';
    const p_OBS = JSON.parse(t_OBS);
    console.log("OBS: isError=" + ops_OBS.result?.isError + " service=" + p_OBS.service);
  } catch(e) { console.log("OBS: ERROR " + e.message); }


  try {
    const ops_RDS = await call('huaweicloud_list_operations', { service: 'RDS' });
    const t_RDS = ops_RDS.result?.content?.[0]?.text || '';
    const p_RDS = JSON.parse(t_RDS);
    console.log("RDS: isError=" + ops_RDS.result?.isError + " service=" + p_RDS.service);
  } catch(e) { console.log("RDS: ERROR " + e.message); }


  try {
    const ops_GaussDB = await call('huaweicloud_list_operations', { service: 'GaussDB' });
    const t_GaussDB = ops_GaussDB.result?.content?.[0]?.text || '';
    const p_GaussDB = JSON.parse(t_GaussDB);
    console.log("GaussDB: isError=" + ops_GaussDB.result?.isError + " service=" + p_GaussDB.service);
  } catch(e) { console.log("GaussDB: ERROR " + e.message); }


  try {
    const ops_CCE = await call('huaweicloud_list_operations', { service: 'CCE' });
    const t_CCE = ops_CCE.result?.content?.[0]?.text || '';
    const p_CCE = JSON.parse(t_CCE);
    console.log("CCE: isError=" + ops_CCE.result?.isError + " service=" + p_CCE.service);
  } catch(e) { console.log("CCE: ERROR " + e.message); }


  try {
    const ops_FunctionGraph = await call('huaweicloud_list_operations', { service: 'FunctionGraph' });
    const t_FunctionGraph = ops_FunctionGraph.result?.content?.[0]?.text || '';
    const p_FunctionGraph = JSON.parse(t_FunctionGraph);
    console.log("FunctionGraph: isError=" + ops_FunctionGraph.result?.isError + " service=" + p_FunctionGraph.service);
  } catch(e) { console.log("FunctionGraph: ERROR " + e.message); }


  try {
    const ops_IAM = await call('huaweicloud_list_operations', { service: 'IAM' });
    const t_IAM = ops_IAM.result?.content?.[0]?.text || '';
    const p_IAM = JSON.parse(t_IAM);
    console.log("IAM: isError=" + ops_IAM.result?.isError + " service=" + p_IAM.service);
  } catch(e) { console.log("IAM: ERROR " + e.message); }


  try {
    const ops_CTS = await call('huaweicloud_list_operations', { service: 'CTS' });
    const t_CTS = ops_CTS.result?.content?.[0]?.text || '';
    const p_CTS = JSON.parse(t_CTS);
    console.log("CTS: isError=" + ops_CTS.result?.isError + " service=" + p_CTS.service);
  } catch(e) { console.log("CTS: ERROR " + e.message); }


  try {
    const ops_CES = await call('huaweicloud_list_operations', { service: 'CES' });
    const t_CES = ops_CES.result?.content?.[0]?.text || '';
    const p_CES = JSON.parse(t_CES);
    console.log("CES: isError=" + ops_CES.result?.isError + " service=" + p_CES.service);
  } catch(e) { console.log("CES: ERROR " + e.message); }


  try {
    const ops_DDS = await call('huaweicloud_list_operations', { service: 'DDS' });
    const t_DDS = ops_DDS.result?.content?.[0]?.text || '';
    const p_DDS = JSON.parse(t_DDS);
    console.log("DDS: isError=" + ops_DDS.result?.isError + " service=" + p_DDS.service);
  } catch(e) { console.log("DDS: ERROR " + e.message); }


  try {
    const ops_DCS = await call('huaweicloud_list_operations', { service: 'DCS' });
    const t_DCS = ops_DCS.result?.content?.[0]?.text || '';
    const p_DCS = JSON.parse(t_DCS);
    console.log("DCS: isError=" + ops_DCS.result?.isError + " service=" + p_DCS.service);
  } catch(e) { console.log("DCS: ERROR " + e.message); }


  try {
    const ops_SMN = await call('huaweicloud_list_operations', { service: 'SMN' });
    const t_SMN = ops_SMN.result?.content?.[0]?.text || '';
    const p_SMN = JSON.parse(t_SMN);
    console.log("SMN: isError=" + ops_SMN.result?.isError + " service=" + p_SMN.service);
  } catch(e) { console.log("SMN: ERROR " + e.message); }


  try {
    const ops_DMS = await call('huaweicloud_list_operations', { service: 'DMS' });
    const t_DMS = ops_DMS.result?.content?.[0]?.text || '';
    const p_DMS = JSON.parse(t_DMS);
    console.log("DMS: isError=" + ops_DMS.result?.isError + " service=" + p_DMS.service);
  } catch(e) { console.log("DMS: ERROR " + e.message); }


  try {
    const ops_WAF = await call('huaweicloud_list_operations', { service: 'WAF' });
    const t_WAF = ops_WAF.result?.content?.[0]?.text || '';
    const p_WAF = JSON.parse(t_WAF);
    console.log("WAF: isError=" + ops_WAF.result?.isError + " service=" + p_WAF.service);
  } catch(e) { console.log("WAF: ERROR " + e.message); }


  try {
    const ops_CDN = await call('huaweicloud_list_operations', { service: 'CDN' });
    const t_CDN = ops_CDN.result?.content?.[0]?.text || '';
    const p_CDN = JSON.parse(t_CDN);
    console.log("CDN: isError=" + ops_CDN.result?.isError + " service=" + p_CDN.service);
  } catch(e) { console.log("CDN: ERROR " + e.message); }


  try {
    const ops_ModelArts = await call('huaweicloud_list_operations', { service: 'ModelArts' });
    const t_ModelArts = ops_ModelArts.result?.content?.[0]?.text || '';
    const p_ModelArts = JSON.parse(t_ModelArts);
    console.log("ModelArts: isError=" + ops_ModelArts.result?.isError + " service=" + p_ModelArts.service);
  } catch(e) { console.log("ModelArts: ERROR " + e.message); }


  try {
    const ops_DEW = await call('huaweicloud_list_operations', { service: 'DEW' });
    const t_DEW = ops_DEW.result?.content?.[0]?.text || '';
    const p_DEW = JSON.parse(t_DEW);
    console.log("DEW: isError=" + ops_DEW.result?.isError + " service=" + p_DEW.service);
  } catch(e) { console.log("DEW: ERROR " + e.message); }


  try {
    const ops_CBR = await call('huaweicloud_list_operations', { service: 'CBR' });
    const t_CBR = ops_CBR.result?.content?.[0]?.text || '';
    const p_CBR = JSON.parse(t_CBR);
    console.log("CBR: isError=" + ops_CBR.result?.isError + " service=" + p_CBR.service);
  } catch(e) { console.log("CBR: ERROR " + e.message); }


  try {
    const ops_EVS = await call('huaweicloud_list_operations', { service: 'EVS' });
    const t_EVS = ops_EVS.result?.content?.[0]?.text || '';
    const p_EVS = JSON.parse(t_EVS);
    console.log("EVS: isError=" + ops_EVS.result?.isError + " service=" + p_EVS.service);
  } catch(e) { console.log("EVS: ERROR " + e.message); }


  try {
    const ops_EIP = await call('huaweicloud_list_operations', { service: 'EIP' });
    const t_EIP = ops_EIP.result?.content?.[0]?.text || '';
    const p_EIP = JSON.parse(t_EIP);
    console.log("EIP: isError=" + ops_EIP.result?.isError + " service=" + p_EIP.service);
  } catch(e) { console.log("EIP: ERROR " + e.message); }


  try {
    const ops_ELB = await call('huaweicloud_list_operations', { service: 'ELB' });
    const t_ELB = ops_ELB.result?.content?.[0]?.text || '';
    const p_ELB = JSON.parse(t_ELB);
    console.log("ELB: isError=" + ops_ELB.result?.isError + " service=" + p_ELB.service);
  } catch(e) { console.log("ELB: ERROR " + e.message); }

  console.log("RESULT: SERVICE_MATRIX_DONE");
  child.kill(); process.exit(0);
} catch(e) { console.error("Error:",e.message); child.kill(); process.exit(1); }
setTimeout(()=>{child.kill();process.exit(1);},25000);
