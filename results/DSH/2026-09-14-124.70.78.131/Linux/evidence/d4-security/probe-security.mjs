// DSH/Linux daily probe — security core (next.6)
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { redactSecrets, classifyTextCommand, classifyHcloudArgs, assertAllowed, loadPolicy } = await import(CORE + '/safety-policy.mjs');
const { evaluateArtifacts, evaluateDeployPlan, evaluateCommandRisk, loadRiskRules } = await import(CORE + '/risk-rule-engine.mjs');
const results = [];
function check(id, name, pass, actual) { results.push({ id, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) }); }

// D2-4 凭证脱敏
const o = redactSecrets({ access_key: 'AK123', secret_key: 'SKsecret', security_token: 'STtok' });
check('D2-4','access_key redacted', o.access_key==='<redacted>', o.access_key);
check('D2-4','secret_key redacted', o.secret_key==='<redacted>', o.secret_key);
check('D2-4','security_token redacted', o.security_token==='<redacted>', o.security_token);
const akSk = redactSecrets({ AK: 'ABCD123', SK: 'XYZ999' });
check('D2-4','AK/SK key redacted', akSk.AK==='<redacted>' && akSk.SK==='<redacted>', JSON.stringify(akSk));
const kv = redactSecrets('access_key=AAAA secret_key=BBBB AK=CCCC');
check('D2-4','kv access_key/secret_key/AK no plaintext', !kv.includes('AAAA')&&!kv.includes('BBBB')&&!kv.includes('CCCC'), kv);
// next.6 new: lowercase obsutilconfig ak=/sk=
const lower = redactSecrets('ak=AK123456 sk=SKsecret');
const lowerRedacted = lower.includes('<redacted>');
check('D2-4','lowercase ak=/sk= redacted', lowerRedacted, lower);
const underscore = redactSecrets('access_key=AKlow secret_key=SKlow');
check('D2-4','access_key=/secret_key= redacted', !underscore.includes('AKlow')&&!underscore.includes('SKlow'), underscore);

// D4-1 凭证文件读取拦截
const f1 = classifyTextCommand('cat ~/.hcloud/credentials.json');
check('D4-1','cat .hcloud deny', f1.decision==='deny'&&f1.risk==='credential', f1);
const f3 = classifyTextCommand('Get-Content huaweicloud/credentials');
check('D4-1','Get-Content credentials deny', f3.decision==='deny', f3);

// D4-2 凭证环境变量打印
const e1 = classifyTextCommand('printenv HUAWEICLOUD_SK');
check('D4-2','printenv HUAWEICLOUD_SK deny', e1.decision==='deny'&&e1.risk==='credential', e1);
const e2 = classifyTextCommand('env | grep HWC_ACCESS_KEY');
check('D4-2','env HWC_ deny', e2.decision==='deny', e2);
const e3 = classifyTextCommand('printenv HW_ACCESS_KEY');
check('D4-2','printenv HW_ACCESS_KEY deny (real var)', e3.decision==='deny', e3);
const e4 = classifyTextCommand('echo $HW_ACCESS_KEY');
check('D4-2','echo $HW_ACCESS_KEY deny (real var)', e4.decision==='deny', e4);
const e5 = classifyTextCommand('echo $HW_SECRET_KEY');
check('D4-2','echo $HW_SECRET_KEY deny (real var)', e5.decision==='deny', e5);

// D4-3 明文 secret API
const s1 = classifyTextCommand('hcloud csms ShowSecretVersion --secret-name x');
check('D4-3','ShowSecretVersion deny', s1.decision==='deny'&&s1.risk==='secret', s1);

// D4-5 写操作分类
const w1 = classifyHcloudArgs(['ecs','DeleteServers','--project-id','x']);
check('D4-5','DeleteServers write', w1.decision==='deny'&&w1.risk==='write', w1);
const w2 = classifyHcloudArgs(['ecs','CreateServers']);
check('D4-5','CreateServers write', w2.decision==='deny', w2);
const w3 = classifyHcloudArgs(['ecs','ListServersDetails']);
check('D4-5','ListServersDetails read_only', w3.decision==='allow'&&w3.risk==='read_only', w3);

// D4-6 明文 adminPass 回显告警
const a1 = classifyTextCommand('hcloud ECS CreateServers --server.1.name web --server.1.adminPass MySecret123');
const a1warn = a1.decision==='deny' || (a1.risk && a1.risk!=='not_huaweicloud' && a1.risk!=='read_only' && a1.risk!=='unknown');
check('D4-6','adminPass plaintext triggers warn/deny', a1.decision==='deny', a1);

// D4-7 hook 三工具
const rules = loadRiskRules();
const cmd = evaluateCommandRisk('hcloud ecs DeleteServers --force');
const art = evaluateArtifacts([{ path:'p.tf', content:'resource "networking_secgroup_rule" "r" { remote_ip_prefix = "0.0.0.0/0" port_range = "3306" }' }]);
const dp = evaluateDeployPlan({ plan:'create security group rule remote_ip_prefix=0.0.0.0/0 port 5432' });
check('D4-7','command hook deny', cmd.decision==='deny', cmd.decision);
check('D4-7','artifact hook deny', art.decision==='deny', art.decision);
check('D4-7','deploy_plan hook deny', dp.decision==='deny', dp.decision);

// D4-9 公开暴露/破坏性
const pub = evaluateDeployPlan({ plan:'security_group rule protocol tcp remote_ip_prefix=0.0.0.0/0 port 22' });
check('D4-9','public 0.0.0.0/0 port 22 deny', pub.decision==='deny', pub);
const destructive = evaluateCommandRisk('hcloud ecs DeleteServers --force --server-id 1');
check('D4-9','destructive --force deny', destructive.decision==='deny', destructive);

// D4-15 hook 绕过
const b1 = classifyHcloudArgs(['ecs','deleteservers','--server-id','1']);
check('D4-15','lowercase deleteservers write', b1.decision==='deny', b1);
const b2 = classifyHcloudArgs(['ECS','DELETEservers','--server-id','1']);
check('D4-15','mixed-case write', b2.decision==='deny', b2);
const b3 = classifyTextCommand('hcloud ecs DeleteServers%20--server-id%201');
check('D4-15','url-encoded write', b3.decision==='deny', b3);
const b4 = classifyTextCommand("hcloud $(echo $'E\\x43S DeleteServer') --id x");
check('D4-15','command-substitution bypass deny', b4.decision==='deny', b4);

// D4-16 命令包裹穿透
const w1c = classifyTextCommand('bash -c "hcloud ecs DeleteServers --server-id 1"');
check('D4-16','bash -c hcloud DeleteServers deny', w1c.decision==='deny', w1c);
const w2c = classifyTextCommand('sh -c "echo x && hcloud rds CreateInstance"');
check('D4-16','sh && hcloud CreateInstance deny', w2c.decision==='deny', w2c);

// D4-17 模糊 fail-closed
const empty = classifyHcloudArgs([]);
check('D4-17','empty hcloud args deny', empty.decision==='deny'&&empty.risk==='invalid', empty);
let threw=false; try { assertAllowed(empty); } catch { threw=true; }
check('D4-17','assertAllowed throws on deny', threw, threw);
const malformed = evaluateArtifacts([{ path:'x.json', content:'{not-valid-json!!!' }]);
check('D4-17','malformed artifact fail-closed (deny)', malformed.decision==='deny', malformed);

// D4-21 IAM 宽泛策略
const iam = evaluateArtifacts([{ path:'iam-policy.json', content:'{"Statement":[{"Effect":"Allow","Action":"*:*","Resource":"*"}]}' }]);
check('D4-21','broad IAM deny', iam.decision==='deny', iam);

// D4-22 FunctionGraph 公网无鉴权
const fg = evaluateDeployPlan({ plan:{ service:'FunctionGraph', trigger:{ type:'APIG', auth:'NONE', network:'public' } } });
check('D4-22','public FG no-auth flagged', fg.decision!=='allow', fg);

const failed = results.filter(r=>!r.pass);
console.log('=== SECURITY PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for (const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if (failed.length) { console.log('\nFAILED:'); for (const r of failed) console.log(`  ${r.id} ${r.name}`); process.exit(1); }
console.log('\nALL SECURITY ASSERTIONS PASSED');
