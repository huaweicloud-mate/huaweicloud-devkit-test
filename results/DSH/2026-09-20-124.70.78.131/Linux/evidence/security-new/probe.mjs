import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const HOOK = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs';
const { evaluateCommandRisk } = await import(SRC+'/risk-rule-engine.mjs');
const { classifyTextCommand, assertAllowed } = await import(SRC+'/safety-policy.mjs');
const { classifyRawCommand } = await import(SRC+'/tools.mjs');
let PASS=0,FAIL=0;const A=(id,l,c,d='')=>{const ok=!!c;ok?PASS++:FAIL++;console.log(`[${ok?'PASS':'FAIL'}] ${id} ${l}${d?' | '+d:''}`);};

// D4-26 findings 证据脱敏（redactEvidence 经 evaluateCommandRisk 触发，输入含 adminPass= 形式凭证 + 写规则）
{
  const rA = evaluateCommandRisk('rm -rf / --adminPass=SuperSecret123');
  const evA = rA.findings?.map(f=>f.evidence).join(' ')||'';
  console.log('findings evidence(adminPass):', JSON.stringify(evA));
  A('D4-26','findings.evidence adminPass 脱敏', /<redacted>/.test(evA) && !/SuperSecret123/.test(evA), evA);
  const rT = evaluateCommandRisk('rm -rf / --token=TokenValue123');
  const evT = rT.findings?.map(f=>f.evidence).join(' ')||'';
  console.log('findings evidence(裸 token):', JSON.stringify(evT));
  A('D4-26','findings.evidence 裸 token= 脱敏', /<redacted>/.test(evT) && !/TokenValue123/.test(evT), evT);
}
// D4-29 classifyRawCommand + assertAllowed
{
  const raw = classifyRawCommand('hcloud ecs DeleteServers --server-id x');
  const txt = classifyTextCommand('hcloud ecs DeleteServers --server-id x');
  console.log('classifyRawCommand:', JSON.stringify(raw));
  A('D4-29','classifyRawCommand=classifyTextCommand 包装', raw.decision===txt.decision && raw.risk===txt.risk, `${raw.decision}/${raw.risk}`);
  let deniedThrew=false, allowPassed=true;
  try { assertAllowed({decision:'deny', risk:'write'}); } catch(e){ deniedThrew=true; }
  try { assertAllowed({decision:'allow', risk:'read_only'}); } catch(e){ allowPassed=false; }
  console.log('assertAllowed deny 抛错:', deniedThrew, '| allow 通过:', allowPassed);
  A('D4-29','DENY 决策 assertAllowed 抛拒绝', deniedThrew);
  A('D4-29','allow 决策 assertAllowed 通过', allowPassed);
}
// D4-28 Node 版安全 hook 链路
{
  const runHook = (tool_input) => {
    const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({tool_input}), encoding:'utf8' });
    return (r.stdout||'') + (r.stderr||'');
  };
  const hj = readFileSync('/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/hooks/hooks.json','utf8');
  const registersMjs = /huaweicloud-safety\.mjs/.test(hj);
  console.log('hooks.json registers .mjs:', registersMjs);
  A('D4-28','hooks.json 注册 .mjs(Node 实现)', registersMjs);
  const highRisk = runHook({command:'hcloud ecs DeleteServers --server-id 1'});
  console.log('高危 command hook 输出:', JSON.stringify(highRisk).slice(0,120));
  A('D4-28','command 提取+高危 deny 输出 permissionDecision=deny', /"permissionDecision":"deny"/.test(highRisk));
  const credScript = runHook({script:'cat ~/.hcloud/credentials.json'});
  A('D4-28','script 提取+凭据读取 deny', /"permissionDecision":"deny"/.test(credScript));
  const argsArr = runHook({args:['hcloud','ecs','DeleteServers']});
  A('D4-28','args 提取+高危 deny', /"permissionDecision":"deny"/.test(argsArr));
  const benign = runHook({command:'hcloud ecs ListServers'});
  console.log('只读 command hook 输出为空:', JSON.stringify(benign));
  A('D4-28','非高危无 deny 输出', !/"permissionDecision":"deny"/.test(benign));
}
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL?1:0);
