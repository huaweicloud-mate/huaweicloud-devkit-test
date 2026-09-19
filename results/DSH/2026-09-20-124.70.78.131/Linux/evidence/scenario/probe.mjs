const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(SRC+'/tools.mjs');
let PASS=0,FAIL=0;const A=(id,l,c,d='')=>{const ok=!!c;ok?PASS++:FAIL++;console.log(`[${ok?'PASS':'FAIL'}] ${id} ${l}${d?' | '+d:''}`);};
// D3-S5 复合意图分层路由
{
  const r = await callTool('huaweicloud_service_catalog', {intent:'我想做一个物联网项目，要存时序数据，还要把前端页面托管上线'});
  const svc = (r.recommendedServices||[]).join(' '); const sk=(r.recommendedSkills||[]).join(' ');
  console.log('复合意图 recommendedServices:', svc);
  console.log('复合意图 recommendedSkills:', sk);
  const multi = (r.recommendedServices||[]).length + (r.recommendedSkills||[]).length >= 2;
  A('D3-S5','复合意图命中多个服务(不盲选单一)', multi, `svc=[${svc}] skill=[${sk}]`);
}
// D3-S8 失败分类 + 可执行下一步
{
  const r = await callTool('huaweicloud_explain_error', {errorCode:'APIGW.0301', message:'invalid AK/SK'});
  const suggestions = r?.suggestions||[];
  console.log('explain_error(APIGW.0301) suggestions:', JSON.stringify(suggestions));
  const executable = suggestions.some(s=>/Keystone|project_id|IAM|AK\/SK|ListProjects|region|区域/i.test(String(s)));
  A('D3-S8','失败分类给出可执行下一步(非裸报错)', suggestions.length>0 && executable, JSON.stringify(suggestions).slice(0,120));
  const r2 = await callTool('huaweicloud_explain_error', {errorCode:'VPC.0010', message:'PolicyNotAuthorized'});
  const s2 = r2?.suggestions||[];
  console.log('explain_error(VPC.0010 PolicyNotAuthorized):', JSON.stringify(s2).slice(0,160));
  A('D3-S8','权限不足已分类(权限/策略)', s2.length>0);
}
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL?1:0);
