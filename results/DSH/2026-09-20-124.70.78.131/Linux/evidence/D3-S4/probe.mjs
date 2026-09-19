import { pathToFileURL } from 'node:url';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
let PASS=0,FAIL=0;
function A(id,l,c,d){const ok=!!c;ok?PASS++:FAIL++;const det=d?(' | '+d):'';console.log('['+(ok?'PASS':'FAIL')+'] '+id+' '+l+det);}

const s1 = await callTool('huaweicloud_voucher_status', {});
console.log('voucher_status(初始):', JSON.stringify(s1));
A('D3-S4','voucher_status 返回 claimed 字段', typeof s1?.claimed === 'boolean', JSON.stringify(s1).slice(0,120));
if (s1?.claimed === false) {
  const claim = await callTool('huaweicloud_voucher_claim', {});
  console.log('voucher_claim:', JSON.stringify(claim));
  const s2 = await callTool('huaweicloud_voucher_status', {});
  console.log('voucher_status(领后):', JSON.stringify(s2));
  A('D3-S4','领取后状态翻转为 claimed=true', s2?.claimed === true, JSON.stringify(s2).slice(0,120));
} else {
  console.log('说明: 本账号已领取(claimed=' + s1?.claimed + ')，领券为一人一次，无法重复领取；仅验证 status 闭环可调用。');
  A('D3-S4','已领取态 status 可调用且字段完整', s1?.claimed === true && typeof s1 === 'object');
}
console.log('\n=== 汇总: PASS='+PASS+' FAIL='+FAIL+' ===');
process.exit(FAIL?1:0);
