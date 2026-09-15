import { detectAgent } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/telemetry/agent-detect.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

let pass=0, fail=0;
const L=[];
function ck(id, t, c, note){ c?pass++:fail++; L.push(`${c?'PASS':'FAIL'}  ${id}  ${t}  => ${note}`); }

// D1-2 多 Agent 探测（源码级 detectAgent 矩阵）
const CLIENTS = ['opencode','codex','codex-desktop','codearts','codearts-work','workbuddy','dsh','officeace','hermes','openclaw','atomcode'];
let ok=0;
for (const cn of CLIENTS) {
  const r = detectAgent({ name: cn, version: '1.0.0' });
  if (r.harness === cn) ok++;
  else if (cn === 'codex-desktop' && r.harness === 'codex-desktop') ok++;
  else if (cn === 'codearts' && r.harness === 'codearts') ok++;
}
// 注意：atomcode/officeace 等直接用 name 匹配 harness；codex-desktop 需 clientNames，name 不匹配则 harness=name
// 重新精确断言：用 name 直调，harness 应与 name 一致（detectAgent fallback 返回 clientInfo.name）
const exact = CLIENTS.map(cn => detectAgent({ name: cn, version:'1.0.0' }).harness === cn);
ck('D1-2', 'detectAgent 对 11 客户端 clientInfo 返回对应 harness', exact.every(Boolean), `match=${exact.filter(Boolean).length}/${CLIENTS.length}`);

// 本机实际环境（OpenClaw ~/.agents 安装态）→ detectAgent 应识别 openclaw
const local = detectAgent({});
console.log('INFO  D1-2  本机 detectAgent() =>', JSON.stringify(local));

// D4-10 规则库新增回归（良性输入不误杀）
const benignCmds = ['hcloud ECS ListServers', 'hcloud VPC ListVpcs', 'hcloud IAM KeystoneListUsers'];
let benignOk = true;
for (const c of benignCmds) {
  const r = evaluateCommandRisk(c);
  if (r.decision !== 'allow' && r.decision !== 'warn') benignOk = false;
}
ck('D4-10', '良性只读命令不误杀(allow)', benignOk, 'read-only cmds allow');
const benignArt = evaluateArtifacts([{ path:'app.js', content:'console.log("hello")' }]);
ck('D4-10', '良性制品不误杀', (benignArt.findings||[]).length === 0, `findings=${benignArt.findings?.length}`);
const benignPlan = evaluateDeployPlan({ plan: 'deploy a static web app to existing sandbox' });
ck('D4-10', '良性部署计划不误杀(非deny)', benignPlan.decision !== 'deny', `decision=${benignPlan.decision}`);

console.log('\n=== D1-2 / D4-10 探针结果 ===');
for (const l of L) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail>0?1:0);
