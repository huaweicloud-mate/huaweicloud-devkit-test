// DSH/Linux daily probe — intent routing (serviceCatalog) v1.1.4 stable
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { callTool } = await import(CORE + '/tools.mjs');
const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}
const intents = [
  ['EXP-E01','帮我查一下我账号在华北北京四有哪些云主机','ECS'],
  ['EXP-E02','创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型','ECS'],
  ['EXP-E03','把本地 dist 目录部署成一个公网静态网站','OBS'],
  ['EXP-E04','给这台服务器绑定一个弹性公网IP','EIP'],
  ['EXP-E05','看一下我的云数据库MySQL实例的状态','RDS'],
  ['EXP-E06','创建一个 Redis 缓存实例用于会话存储','DCS'],
  ['EXP-E07','给生产环境的服务器配置一个每日备份策略','CBR'],
  ['EXP-E08','我的ECS启动失败了, 帮我分析原因','ECS'],
  ['EXP-E09','开设一个 Kubernetes 集群用于微服务部署','CCE'],
  ['EXP-E10','部署一个函数处理图片自动压缩','FunctionGraph'],
  ['EXP-E11','查一下我账号这个月的费用情况','BSS'],
  ['EXP-E12','把应用日志指标推送到云监控告警','CES'],
  ['EXP-E13','申请HTTPS证书并配置到我的域名','CSMS'],
  ['EXP-E14','我账号下的用户都有哪些权限, 帮我审计一下','IAM'],
  ['EXP-E15','帮我领一下华为云的代金券','Incentive Voucher'],
];
let hit=0;
for (const [id,intent,expect] of intents) {
  const r = await callTool('huaweicloud_service_catalog', {intent});
  const svcs = (r.recommendedServices||[]).join(' ');
  const skills = (r.recommendedSkills||[]).join(' ');
  const matched = svcs.includes(expect) || skills.toLowerCase().includes(expect.toLowerCase())
     || (expect==='EIP' && svcs.includes('VPC')) || (expect==='DCS' && (svcs.includes('DCS')||svcs.includes('DDS')))
     || (expect==='CSMS' && (svcs.includes('KMS')||svcs.includes('ELB')));
  if (matched) hit++;
  check(id, `${intent.slice(0,18)} -> ${expect}`, matched, `svc=[${svcs}]`);
}
check('D10-3', `routing accuracy ${hit}/${intents.length} >= 90%`, hit/intents.length >= 0.9, `${hit}/${intents.length}`);
// design-level D10-3 spot: 中文意图路由
const s1 = await callTool('huaweicloud_service_catalog', {intent:'帮我查一下我账号在华北北京四有哪些云主机'});
check('D10-3','中文意图「云主机」→ ECS', (s1.recommendedServices||[]).join(' ').includes('ECS'), s1.recommendedServices);
const failed=results.filter(r=>!r.pass);
console.log('=== ROUTING PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('--- FAILED ---');for(const r of failed)console.log(`  ${r.id} ${r.name} => ${r.actual}`);}
