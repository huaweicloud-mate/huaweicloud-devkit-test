// D4-4 写操作审批门：12 类写动词逐一分类，必须 deny/需审批（不得判 allow/read-only）
import { classifyTextCommand } from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
const verbs = ['CreateServer','DeleteServer','UpdateServer','ResizeServer','StartServer','StopServer',
  'ChangeServerOs','ChangeVpc','ChangeInstanceConfiguration','ChangeVolumeType','AttachVolume','DetachVolume'];
let bad = 0;
for (const v of verbs) {
  const cmd = `hcloud ecs ${v} --server_id x`;
  const r = classifyTextCommand(cmd);
  const ok = r.decision !== 'allow';
  if (!ok) bad++;
  console.log(`${ok ? '[OK]' : '[FAIL]'} ${v} -> decision=${r.decision} risk=${r.risk}`);
}
console.log(`\n== 12 类写动词审批门: ${verbs.length - bad}/${verbs.length} 被拦截/需审批 ==`);
console.log(bad ? 'RESULT: FAIL 未拦截写动词(allow)' : 'RESULT: PASS');
console.log(`[D4-4] status=${bad ? 'FAIL' : 'PASS'}`);
