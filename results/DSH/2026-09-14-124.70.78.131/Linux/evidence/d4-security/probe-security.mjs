// DSH/Linux daily test probe — P0 security core + credential masking
// Evidence for D2-4, D4-1, D4-2, D4-3, D4-4, D4-5, D4-6, D4-7, D4-9, D4-15, D4-16, D4-17, D4-21, D4-22
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { redactSecrets, classifyTextCommand, classifyHcloudArgs, assertAllowed } = await import(CORE + '/safety-policy.mjs');
const { evaluateArtifacts, evaluateDeployPlan, evaluateCommandRisk, loadRiskRules } = await import(CORE + '/risk-rule-engine.mjs');

const results = [];
function check(caseId, name, pass, actual) {
  results.push({ caseId, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) });
}

// ============ D2-4 凭证脱敏正确性 ============
const objRedact = redactSecrets({ access_key: 'AK123456', secret_key: 'SKsecretvalue', security_token: 'STtoken' });
check('D2-4', 'object access_key redacted', objRedact.access_key === '<redacted>', objRedact.access_key);
check('D2-4', 'object secret_key redacted', objRedact.secret_key === '<redacted>', objRedact.secret_key);
check('D2-4', 'object security_token redacted', objRedact.security_token === '<redacted>', objRedact.security_token);
const akSk = redactSecrets({ AK: 'ABCD123', SK: 'XYZ999' });
check('D2-4', 'AK key redacted', akSk.AK === '<redacted>', akSk.AK);
check('D2-4', 'SK key redacted', akSk.SK === '<redacted>', akSk.SK);
const kvRedact = redactSecrets('access_key=AAAA secret_key=BBBB AK=CCCC');
check('D2-4', 'no plaintext access_key value', !kvRedact.includes('AAAA'), kvRedact);
check('D2-4', 'no plaintext secret_key value', !kvRedact.includes('BBBB'), kvRedact);
check('D2-4', 'no plaintext AK value', !kvRedact.includes('CCCC'), kvRedact);
const nested = redactSecrets({ outer: { password: 'p@ss', region: 'cn-north-4', list: [{ credential: 'c1' }] } });
check('D2-4', 'nested password redacted', nested.outer.password === '<redacted>', nested.outer.password);
check('D2-4', 'non-secret region preserved', nested.outer.region === 'cn-north-4', nested.outer.region);
check('D2-4', 'array credential redacted', nested.outer.list[0].credential === '<redacted>', nested.outer.list[0].credential);

// ============ D4-1 凭证文件读取拦截 ============
const f1 = classifyTextCommand('cat ~/.hcloud/credentials.json');
check('D4-1', 'cat .hcloud denied', f1.decision === 'deny' && f1.risk === 'credential', f1);
const f2 = classifyTextCommand('type C:\\Users\\u\\.huaweicloud\\config');
check('D4-1', 'type .huaweicloud denied', f2.decision === 'deny', f2);
const f3 = classifyTextCommand('Get-Content huaweicloud/credentials');
check('D4-1', 'Get-Content huaweicloud/credentials denied', f3.decision === 'deny', f3);

// ============ D4-2 凭证环境变量打印拦截 ============
const e1 = classifyTextCommand('printenv HW_ACCESS_KEY HUAWEICLOUD_SK');
check('D4-2', 'printenv HUAWEICLOUD_SK denied', e1.decision === 'deny' && e1.risk === 'credential', e1);
const e2 = classifyTextCommand('env | grep HWC_ACCESS_KEY');
check('D4-2', 'env HWC_ denied', e2.decision === 'deny', e2);
// 真实凭证环境变量名（README: HW_ACCESS_KEY / HW_SECRET_KEY）
const e3 = classifyTextCommand('printenv HW_ACCESS_KEY');
check('D4-2', 'printenv HW_ACCESS_KEY denied (real var)', e3.decision === 'deny', e3);
const e4 = classifyTextCommand('echo $HW_ACCESS_KEY');
check('D4-2', 'echo $HW_ACCESS_KEY denied (real var)', e4.decision === 'deny', e4);
const e5 = classifyTextCommand('echo $HW_SECRET_KEY');
check('D4-2', 'echo $HW_SECRET_KEY denied (real var)', e5.decision === 'deny', e5);

// ============ D4-3 明文 secret API 拦截 ============
const s1 = classifyTextCommand('hcloud csms ShowSecretVersion --secret-name x');
check('D4-3', 'ShowSecretVersion denied', s1.decision === 'deny' && s1.risk === 'secret', s1);
const s2 = classifyTextCommand('GetSecretValue secret_string');
check('D4-3', 'GetSecretValue/secret_string denied', s2.decision === 'deny', s2);

// ============ D4-5 写操作误判检测 ============
const w1 = classifyHcloudArgs(['ecs', 'DeleteServers', '--project-id', 'x']);
check('D4-5', 'DeleteServers write (deny w/o approval)', w1.decision === 'deny' && w1.risk === 'write', w1);
const w2 = classifyHcloudArgs(['ecs', 'CreateServers']);
check('D4-5', 'CreateServers write', w2.decision === 'deny', w2);
const w3 = classifyHcloudArgs(['ecs', 'ListServersDetails']);
check('D4-5', 'ListServersDetails read_only', w3.decision === 'allow' && w3.risk === 'read_only', w3);
const w4 = classifyHcloudArgs(['obs', 'cp', 'a', 'b']);
check('D4-5', 'obs cp write', w4.decision === 'deny', w4);

// ============ D4-9 公开暴露/破坏性预检 ============
const pub = evaluateDeployPlan({ plan: 'security_group rule protocol tcp remote_ip_prefix=0.0.0.0/0 port 22' });
check('D4-9', 'public admin port 22 deny', pub.decision === 'deny', pub);
const destructive = evaluateCommandRisk('hcloud ecs DeleteServers --force --server-id 1');
check('D4-9', 'destructive --force deny', destructive.decision === 'deny', destructive);
const destructiveReset = classifyTextCommand('hcloud rds ResetPassword --instance-id x');
check('D4-9', 'ResetPassword write deny', destructiveReset.decision === 'deny', destructiveReset);

// ============ D4-15 hook 绕过尝试（大小写/混淆/拆分）============
const b1 = classifyHcloudArgs(['ecs', 'deleteservers', '--server-id', '1']);
check('D4-15', 'lowercase deleteservers still write', b1.decision === 'deny', b1);
const b2 = classifyHcloudArgs(['ECS', 'DELETEservers', '--server-id', '1']);
check('D4-15', 'mixed-case DELETEServers still write', b2.decision === 'deny', b2);
const b3 = classifyTextCommand('hcloud ecs DeleteServers --server-id 1 --server-id 2');
check('D4-15', 'split params still write', b3.decision === 'deny', b3);
const b4 = classifyTextCommand('hcloud ecs DeleteServers%20--server-id%201');
check('D4-15', 'url-encoded DeleteServers still write', b4.decision === 'deny', b4);

// ============ D4-16 命令包裹穿透 ============
const wrap1 = classifyTextCommand('bash -c "hcloud ecs DeleteServers --server-id 1"');
check('D4-16', 'bash -c hcloud DeleteServers hard-blocked', wrap1.decision === 'deny', wrap1);
const wrap2 = classifyTextCommand('sh -c "echo x && hcloud rds CreateInstance"');
check('D4-16', 'sh && hcloud CreateInstance hard-blocked', wrap2.decision === 'deny', wrap2);

// ============ D4-21 hook_check_artifacts（宽泛 IAM）============
const iamArtifact = { path: 'iam-policy.json', content: '{"Statement": [{"Effect": "Allow", "Action": "*:*", "Resource": "*"}]}' };
const ia = evaluateArtifacts([iamArtifact]);
check('D4-21', 'broad IAM Administrator policy deny', ia.decision === 'deny', ia);

// ============ D4-22 hook_check_deploy_plan（公网 FunctionGraph）============
const fgPlan = { plan: { service: 'FunctionGraph', trigger: { type: 'APIG', auth: 'NONE', network: 'public' } } };
const fg = evaluateDeployPlan(fgPlan);
check('D4-22', 'public FunctionGraph no-auth flagged', fg.decision !== 'allow', fg);

// ============ D4-17 模糊 fail-closed ============
const empty = classifyHcloudArgs([]);
check('D4-17', 'empty hcloud args deny', empty.decision === 'deny' && empty.risk === 'invalid', empty);
let threw = false;
try { assertAllowed(empty); } catch { threw = true; }
check('D4-17', 'assertAllowed throws on deny', threw, threw);

// ============ D4-7 hook 三工具（command/artifacts/deploy_plan 均 reject）============
const rules = loadRiskRules();
const cmd = evaluateCommandRisk('hcloud ecs DeleteServers --force');
const art = evaluateArtifacts([{ path: 'p.tf', content: 'resource "networking_secgroup_rule" "r" { remote_ip_prefix = "0.0.0.0/0" port_range = "3306" }' }]);
const dp = evaluateDeployPlan({ plan: 'create security group rule remote_ip_prefix=0.0.0.0/0 port 5432' });
check('D4-7', 'command hook deny', cmd.decision === 'deny', cmd.decision);
check('D4-7', 'artifact hook deny', art.decision === 'deny', art.decision);
check('D4-7', 'deploy_plan hook deny', dp.decision === 'deny', dp.decision);
check('D4-7', 'risk rules loaded (16 rules)', rules.rules.length === 16, rules.rules.length);

// summary
const failed = results.filter(r => !r.pass);
console.log('=== SECURITY PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.caseId}  ${r.name}  => ${r.actual}`);
}
if (failed.length) {
  console.log('\nFAILED CASES:');
  for (const r of failed) console.log(`  ${r.caseId} ${r.name}`);
  process.exit(1);
}
console.log('\nALL SECURITY ASSERTIONS PASSED');
