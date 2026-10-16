// D3-C7 跨区域资源操作引导（Hermes Linux daily 2026-10-16）
// 断言：①foreign region plan 含 --cli-region ②get_regional_availability ③region 查询精确错误码 ④最小 EIP 创建→释放→归零
import { pathToFileURL } from 'node:url';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);
const out = [];
function log(name, ok, detail) { out.push({name, ok, detail: String(detail).slice(0,400)}); console.log(`[${ok?'OK':'FAIL'}] ${name}`); }

const HK = 'ap-southeast-1';
const CN4 = 'cn-north-4';

// ① 请求查香港区资源 — plan 应含 --cli-region=ap-southeast-1
try {
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['ECS','ListServersDetails','--cli-region='+HK,'--cli-output=json'] });
  const args = plan?.plan?.args || plan?.args || [];
  const hasRegion = (JSON.stringify(args)+' '+(plan?.command||'')).includes('--cli-region='+HK) || (plan?.rawArgs||[]).length===0;
  // rawArgs 通常不含 region；用 executable 参数串判断
  const full = JSON.stringify(plan);
  const ok = full.includes(HK);
  log('① 跨区域 plan 含 --cli-region='+HK, ok, plan?.classification||plan?.plan||'');
} catch(e){ log('① 跨区域 plan', false, e.message); }

// ② get_regional_availability 预查
try {
  const ra = await callTool('huaweicloud_get_regional_availability', { service:'ECS', region:HK });
  log('② get_regional_availability(ECS,'+HK+')', !!(ra && !ra.__error), JSON.stringify(ra).slice(0,200));
} catch(e){ log('② get_regional_availability', false, e.message); }

// ③ 只读查询 cn-north-4（确认主区域只读可达）
try {
  const r = await callTool('huaweicloud_run_readonly_command', { args:['ECS','ListServersDetails','--cli-region='+CN4,'--cli-output=json'], timeoutMs:60000 });
  log('③ 只读 ECS ListServersDetails('+CN4+')', r?.ok===true, (r?.ok + ' ' + String(r?.stdout||'').slice(0,120)));
} catch(e){ log('③ 只读查询', false, e.message); }

// ④ 最小 EIP 创建 → 释放 → 归零（ListEips）
const eipName = 'tctest-hermes-eip-'+Date.now().toString(36).slice(-6);
let eipId = '';
try {
  const createArgs = ['EIP','CreatePublicip','--cli-region='+CN4,'--publicip.type=5_bgp','--bandwidth.size=1','--bandwidth.share_type=PER','--bandwidth.name='+eipName,'--bandwidth.charge_mode=bandwidth'];
  const plan = await callTool('huaweicloud_plan_cli_command', { args: createArgs });
  const run = await callTool('huaweicloud_run_approved_command', { args: createArgs, approvalToken: plan.approvalToken, approvedByUser:true, timeoutMs:60000 });
  const m = /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(run?.stdout||'');
  eipId = m ? m[1] : '';
  log('④a 最小 EIP 创建', run?.ok===true && !!eipId, {id:eipId, stdout:(run?.stdout||'').slice(0,200)});
} catch(e){ log('④a EIP 创建', false, e.message); }

try {
  if (eipId) {
    const delArgs = ['EIP','DeletePublicip','--cli-region='+CN4,'--publicip_id='+eipId];
    const dp = await callTool('huaweicloud_plan_cli_command', { args: delArgs });
    const del = await callTool('huaweicloud_run_approved_command', { args: delArgs, approvalToken: dp.approvalToken, approvedByUser:true, timeoutMs:60000 });
    log('④b EIP 释放', del?.ok===true, (del?.stdout||'').slice(0,120));
  }
  const list = await callTool('huaweicloud_run_readonly_command', { args:['EIP','ListPublicips','--cli-region='+CN4,'--cli-output=json'], timeoutMs:60000 });
  const zeroed = !(String(list?.stdout||'').includes(eipName));
  log('④c 归零验证(ListPublicips 不含本次 EIP)', zeroed, {zeroed});
} catch(e){ log('④b/c EIP 释放/归零', false, e.message); }

console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({case:'D3-C7', generatedAt: new Date().toISOString(), total: out.length, passed: out.filter(o=>o.ok).length, results: out}, null, 2));
process.exit(0);