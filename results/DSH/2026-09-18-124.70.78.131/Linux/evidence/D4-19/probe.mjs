// D4-19 确认流下预检仍生效：高危 ECS CreateServers(引用公网开放22端口的SG) 进入确认流后 preflight 仍拦截(public_exposure)
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const hc = (a) => spawnSync('hcloud', [...a, '--cli-region=cn-north-4'], { shell:false, stdio:'pipe', timeout:60000 });
const j = (r) => { try { const s=(r.stdout||'').toString(); return JSON.parse(s.slice(s.indexOf('{'))); } catch { return null; } };

const ts = Date.now();
const sgName = `tctest-dsh-sg-${ts}`;
const sg = hc(['VPC','CreateSecurityGroup','--security_group.name='+sgName]);
const sgId = j(sg)?.security_group?.id || '';
console.log('创建 SG:', sgName, '| id:', sgId);
const rule = hc(['VPC','CreateSecurityGroupRule',
  '--security_group_rule.security_group_id='+sgId,
  '--security_group_rule.direction=ingress',
  '--security_group_rule.protocol=tcp',
  '--security_group_rule.multiport=22',
  '--security_group_rule.remote_ip_prefix=0.0.0.0/0',
  '--security_group_rule.ethertype=IPv4']);
const ruleId = j(rule)?.security_group_rule?.id || '';
console.log('创建入站 0.0.0.0/0:22 规则 exit:', rule.status, '| rule id:', ruleId);

const createServersArgs = ['ECS','CreateServers','--server.flavorRef=s6.small.1','--server.imageRef=00000000-0000-0000-0000-000000000000','--server.nics.1.subnet_id=00000000-0000-0000-0000-000000000000','--security_group_id.1='+sgId];
const plan = await callTool('huaweicloud_plan_cli_command', { args: createServersArgs });
console.log('plan classification decision:', plan.classification?.decision, '| risk:', plan.classification?.risk, '| safeToRun:', plan.safeToRun);
console.log('sgFindings:', JSON.stringify(plan.sgFindings));
const preflightDenied = plan.classification?.decision === 'deny' && plan.classification?.risk === 'public_exposure';
console.log('ASSERT preflight 拦截(deny/public_exposure):', preflightDenied);

// 批准路径(allowWrites=true)内部仍应被 preflight 拦截
let stillDeniedOnApprove = false;
try {
  const { runHcloud } = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);
  await runHcloud(createServersArgs, { allowWrites: true });
} catch (e) {
  stillDeniedOnApprove = /22|公网|public|exposure|deny/i.test(String(e.message||e));
  console.log('批准后仍被 preflight 拦截(异常):', String(e.message||e).slice(0,120));
}
console.log('ASSERT 批准后 preflight 仍拦截:', stillDeniedOnApprove);

// 删除 SG 归零（删除全部规则后删 SG，含默认规则）
const rules = j(hc(['VPC','ListSecurityGroupRules','--security_group_id.1='+sgId]))?.security_group_rules || [];
let delRulesOk = 0;
for (const r of rules) {
  const d = hc(['VPC','DeleteSecurityGroupRule','--security_group_rule_id='+(r.id||'')]);
  if (d.status === 0) delRulesOk++;
}
const delSg = hc(['VPC','DeleteSecurityGroup','--security_group_id='+sgId]);
console.log('删规则条数:', delRulesOk, '/', rules.length, '| 删 SG exit:', delSg.status);
const fin = j(hc(['VPC','ListSecurityGroups']))?.security_groups || [];
const finCount = fin.filter(v => String(v.name||'').startsWith('tctest-dsh-')).length;
console.log('删除后 tctest-dsh- SG 计数:', finCount);

const passed = preflightDenied && stillDeniedOnApprove && finCount === 0;
console.log('VERDICT', passed ? 'PASS' : 'FAIL');
process.exit(passed ? 0 : 1);
