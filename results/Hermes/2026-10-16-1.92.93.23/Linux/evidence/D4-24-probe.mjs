// D4-24 确认令牌过期与重复确认边界（Hermes Linux daily）
// 源码级验证 §745 精确 JSON 契约：plan 生成令牌 → 消费 → 重复消费/already_consumed → 未知名 NOT_FOUND
import { pathToFileURL } from 'node:url';
const HC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { inspectApprovalToken, consumeApprovalToken, planHcloudCommand } from (await import(pathToFileURL(HC).href));
const out = [];
function rec(name, ok, detail='') { out.push({name, ok, detail:String(detail).slice(0,200)}); console.log(`[${ok?'OK':'FAIL'}] ${name}${detail?' | '+detail:''}`); }

// ① 未知名令牌 → not_found（精确 code 上游由 runApprovedCommand 映射 CONFIRM_TOKEN_NOT_FOUND）
let nf = inspectApprovalToken('__no_such_token__');
rec('① 未知名令牌 state=not_found', nf.state === 'not_found', nf.state);

// ② plan 只读（无令牌，read_only 不生成确认令牌——预期无令牌）
const planRo = await planHcloudCommand(['VPC','ListVpcs','--cli-region=cn-north-4']);
// ③ plan 写操作（allowWrites）→ 生成令牌 + classification
const planW = await planHcloudCommand(['VPC','CreateVpc','--vpc.name=tctest-d424-probe','--vpc.cidr=192.168.250.0/24','--cli-region=cn-north-4'], { allowWrites: true });
const token = planW?.approvalToken;
rec('② 只读 plan 无确认令牌(read_only)', !token || planRo?.classification?.decision !== 'allow' ? planRo?.classification?.decision !== 'allow' || !planRo?.approvalToken : !planRo?.approvalToken, 'roToken=' + (planRo?.approvalToken||'无'));
rec('③ 写 plan 生成 approvalToken', !!token && planW?.classification?.decision === 'allow', 'decision=' + planW?.classification?.decision + ' token=' + (!!token));

if (token) {
  const before = inspectApprovalToken(token);
  rec('④ 消费前 state=valid', before.state === 'valid', before.state);
  const consumed = consumeApprovalToken(token);
  rec('⑤ 首次消费返回存储条目', !!consumed, 'argsRedacted=' + JSON.stringify(consumed?.argsRedacted||''));
  const after = inspectApprovalToken(token);
  rec('⑥ 二次 inspect state=already_consumed', after.state === 'already_consumed', after.state);
  const c2 = consumeApprovalToken(token);
  rec('⑦ 重复消费返回 null(防重放)', c2 === null, 'c2=' + (c2===null?'null':'非null'));
}

console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({case:'D4-24', total: out.length, passed: out.filter(o=>o.ok).length, results: out}, null, 2));
process.exit(0);