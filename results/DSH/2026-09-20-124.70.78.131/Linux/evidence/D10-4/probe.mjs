import { loadRiskRules, evaluateCommandRisk } from '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
let PASS=0,FAIL=0;
function A(id,l,c,d){const ok=!!c;ok?PASS++:FAIL++;const det=d?(' | '+d):'';console.log('['+(ok?'PASS':'FAIL')+'] '+id+' '+l+det);}

const catalog = loadRiskRules();
const rules = catalog.rules;
const deny = rules.filter(r=>r.severity==='deny').length;
const warn = rules.filter(r=>r.severity==='warn').length;
console.log('规则库总数:', rules.length, '| deny:', deny, '| warn:', warn);
A('D10-4','规则库完整加载 16 条', rules.length===16, 'n='+rules.length);
A('D10-4','severity 分布 9 deny + 7 warn', deny===9 && warn===7, deny+'/'+warn);

const cat = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
const env = evaluateCommandRisk('env | grep HWC_ACCESS_KEY');
const delF = evaluateCommandRisk('hcloud ecs DeleteServers --force --server-id 1');
const delW = evaluateCommandRisk('hcloud ecs DeleteServers --server-id 1');
const read = evaluateCommandRisk('hcloud ecs ListServersDetails');
const secret = evaluateCommandRisk('hcloud csms ShowSecretVersion --secret-name x');

console.log('cat 凭证 =>', cat.decision, '| env-dump =>', env.decision, '| 删资源--force =>', delF.decision, '| 删资源(无force) =>', delW.decision, '| 只读 =>', read.decision, '| 明文secret =>', secret.decision);
A('D10-4','高危: cat 凭证 → deny', cat.decision==='deny', cat.decision);
A('D10-4','高危: env-dump → deny', env.decision==='deny', env.decision);
A('D10-4','高危: 删资源 --force → deny', delF.decision==='deny', delF.decision);
A('D10-4','高危: 明文 secret API → deny', secret.decision==='deny', secret.decision);
A('D10-4','只读命令 → allow(不带 token)', read.decision==='allow', read.decision);
A('D10-4','删资源(无 force) → warn(需批准而非静默放行)', delW.decision==='warn', delW.decision);
console.log('\n=== 汇总: PASS='+PASS+' FAIL='+FAIL+' ===');
process.exit(FAIL?1:0);
