// DSH/Linux daily probe — security core (v1.1.4 stable @9b67256e)
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { redactSecrets, classifyTextCommand, classifyHcloudArgs, assertAllowed, loadPolicy } = await import(CORE + '/safety-policy.mjs');
const { evaluateArtifacts, evaluateDeployPlan, evaluateCommandRisk, loadRiskRules } = await import(CORE + '/risk-rule-engine.mjs');
const results = [];
function check(id, name, pass, actual) { results.push({ id, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) }); }
function expectDeny(r, id, name) { check(id, name, r && r.decision === 'deny', r && (r.decision + '|' + r.risk + '|' + (r.reason||''))); }

// ---- D2-4 凭证脱敏 ----
const o = redactSecrets({ access_key: 'AK123', secret_key: 'SKsecret', security_token: 'STtok' });
check('D2-4','obj access_key redacted', o.access_key==='<redacted>', o.access_key);
check('D2-4','obj secret_key redacted', o.secret_key==='<redacted>', o.secret_key);
check('D2-4','obj security_token redacted', o.security_token==='<redacted>', o.security_token);
const akSk = redactSecrets({ AK: 'ABCD123', SK: 'XYZ999' });
check('D2-4','obj AK/SK redacted', akSk.AK==='<redacted>' && akSk.SK==='<redacted>', JSON.stringify(akSk));
const kv = redactSecrets('access_key=AAAA secret_key=BBBB AK=CCCC');
check('D2-4','kv access_key/secret_key/AK no plaintext', !kv.includes('AAAA')&&!kv.includes('BBBB')&&!kv.includes('CCCC'), kv);
const lower = redactSecrets('ak=AK123456 sk=SKsecret');
check('D2-4','lowercase ak=/sk= redacted (obsutilconfig)', lower.includes('<redacted>'), lower);
const underscore = redactSecrets('access_key=AKlow secret_key=SKlow');
check('D2-4','access_key=/secret_key= redacted', !underscore.includes('AKlow')&&!underscore.includes('SKlow'), underscore);

// ---- D4-1 凭证文件读取拦截 ----
expectDeny(classifyTextCommand('cat ~/.hcloud/credentials.json'), 'D4-1', 'cat .hcloud credentials deny');
expectDeny(classifyTextCommand('Get-Content huaweicloud/credentials'), 'D4-1', 'Get-Content credentials deny');
expectDeny(classifyTextCommand('type C:\\Users\\x\\.hcloud\\credentials.json'), 'D4-1', 'type credentials.json deny');

// ---- D4-2 凭证环境变量打印 ----
expectDeny(classifyTextCommand('printenv HUAWEICLOUD_SK'), 'D4-2', 'printenv HUAWEICLOUD_SK deny');
expectDeny(classifyTextCommand('env | grep HWC_ACCESS_KEY'), 'D4-2', 'env|grep HWC_ deny');
expectDeny(classifyTextCommand('printenv HW_ACCESS_KEY'), 'D4-2', 'printenv HW_ACCESS_KEY deny');
expectDeny(classifyTextCommand('echo $HW_ACCESS_KEY'), 'D4-2', 'echo $HW_ACCESS_KEY deny');
expectDeny(classifyTextCommand('echo $HW_SECRET_KEY'), 'D4-2', 'echo $HW_SECRET_KEY deny');

// ---- D4-3 明文 secret API ----
expectDeny(classifyTextCommand('hcloud csms ShowSecretVersion --secret-name x'), 'D4-3', 'ShowSecretVersion deny');
expectDeny(classifyTextCommand('hcloud kms DecryptData --ciphertext x'), 'D4-3', 'kms DecryptData deny');

// ---- D4-5 写操作误判 ----
const w1 = classifyHcloudArgs(['ecs','DeleteServers','--project-id','x']);
check('D4-5','DeleteServers write(deny)', w1.decision==='deny', w1.decision+'/'+w1.risk);
const w2 = classifyHcloudArgs(['ecs','CreateServers']);
check('D4-5','CreateServers write(deny)', w2.decision==='deny', w2.decision+'/'+w2.risk);
const w3 = classifyHcloudArgs(['ecs','ListServersDetails']);
check('D4-5','ListServersDetails read_only(allow)', w3.decision==='allow', w3.decision+'/'+w3.risk);

// ---- D4-4 写操作审批门 (12 类写动词) ----
const writeOps = ['Create','Delete','Update','Modify','Reboot','Start','Stop','Resize','Bind','Unbind','Attach','Detach','Migrate','Reset','Restart','Set'];
let deniedAvg = 0;
for (const op of writeOps) { const r = classifyHcloudArgs(['ecs', op+'Servers']); if (r.decision==='deny') deniedAvg++; }
check('D4-4','>=10 write verbs require approval(deny)', deniedAvg >= 10, deniedAvg + '/' + writeOps.length);

// ---- D4-6 adminPass 回显警告 ----
const a1 = classifyTextCommand('hcloud ECS CreateServers --server.name web --server.1.adminPass MySecret123');
check('D4-6','adminPass plaintext triggers deny/warn (not allow)', a1.decision !== 'allow', a1.decision+'/'+a1.risk);

// ---- D4-7 hook 三工具 ----
const rules = loadRiskRules();
const cmd = evaluateCommandRisk('hcloud ecs DeleteServers --force');
const art = evaluateArtifacts([{ path:'p.tf', content:'resource "networking_secgroup_rule" "r" { remote_ip_prefix = "0.0.0.0/0" port_range = "3306" }' }]);
const dp = evaluateDeployPlan({ plan:'create security group rule remote_ip_prefix=0.0.0.0/0 port 5432' });
check('D4-7','command hook deny', cmd.decision==='deny', cmd.decision);
check('D4-7','artifact hook deny', art.decision==='deny', art.decision);
check('D4-7','deploy_plan hook deny', dp.decision==='deny', dp.decision);

// ---- D4-9 公开暴露/破坏性预检 ----
const pub = evaluateDeployPlan({ plan:'security_group rule protocol tcp remote_ip_prefix=0.0.0.0/0 port 22' });
check('D4-9','public 0.0.0.0/0:22 deny', pub.decision==='deny', pub.decision);
const destructive = evaluateCommandRisk('hcloud ecs DeleteServers --force --server-id 1');
check('D4-9','destructive --force deny', destructive.decision==='deny', destructive.decision);

// ---- D4-15 hook 绕过 ----
const b1 = classifyHcloudArgs(['ecs','deleteservers','--server-id','1']);
check('D4-15','lowercase deleteservers write', b1.decision==='deny', b1.decision+'/'+b1.risk);
const b2 = classifyHcloudArgs(['ECS','DELETEservers','--server-id','1']);
check('D4-15','mixed-case write', b2.decision==='deny', b2.decision+'/'+b2.risk);
const b3 = classifyTextCommand('hcloud ecs DeleteServers%20--server-id%201');
check('D4-15','url-encoded write', b3.decision==='deny', b3.decision+'/'+b3.risk);
const b4 = classifyTextCommand("hcloud $(echo $'E\\x43S DeleteServer') --id x");
check('D4-15','command-substitution deny', b4.decision==='deny', b4.decision+'/'+b4.risk);

// ---- D4-16 命令包裹穿透 ----
const w1c = classifyTextCommand('bash -c "hcloud ecs DeleteServers --server-id 1"');
check('D4-16','bash -c hcloud DeleteServers deny', w1c.decision==='deny', w1c.decision+'/'+w1c.risk);
const w2c = classifyTextCommand('sh -c "echo x && hcloud rds CreateInstance"');
check('D4-16','sh && hcloud CreateInstance deny', w2c.decision==='deny', w2c.decision+'/'+w2c.risk);

// ---- D4-17 模糊 fail-closed ----
const empty = classifyHcloudArgs([]);
check('D4-17','empty hcloud args deny', empty.decision==='deny', empty.decision+'/'+empty.risk);
const malformed = evaluateArtifacts([{ path:'x.json', content:'{not-valid-json!!!' }]);
check('D4-17','malformed artifact fail-closed(deny)', malformed.decision==='deny', malformed.decision);

// ---- D4-21 broad IAM ----
const iam = evaluateArtifacts([{ path:'iam-policy.json', content:'{"Statement":[{"Effect":"Allow","Action":"*:*","Resource":"*"}]}' }]);
check('D4-21','broad IAM "*:*" deny', iam.decision==='deny', iam.decision);

// ---- D4-22 FunctionGraph 公网无鉴权 ----
const fg = evaluateDeployPlan({ plan:{ service:'FunctionGraph', trigger:{ type:'APIG', auth:'NONE', network:'public' } } });
check('D4-22','public FG no-auth flagged(not allow)', fg.decision!=='allow', fg.decision);

const failed = results.filter(r=>!r.pass);
console.log('=== SECURITY PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for (const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
console.log('--- FAILED ---');
for (const r of failed) console.log(`  ${r.id} ${r.name} => ${r.actual}`);
