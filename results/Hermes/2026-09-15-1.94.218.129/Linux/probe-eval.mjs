// probe-eval.mjs — D10 评测集 EXP-E01~E15 源码级直调 serviceCatalog 路由（无需真实 LLM Agent）。
// 逐条调 huaweicloud_service_catalog(intent=中文意图)，对比期望路由，落盘 evidence/EXP-EXX/stdout.log。
// 期望路由映射与 eval/harness/run-eval.mjs 的 EXPECT 一致（E08 为诊断类 → N/A，不查服务目录）。
import { callTool } from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const EVID = '/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-15-1.94.218.129/Linux/evidence';

const CASES = [
  { id: 'EXP-E01', prompt: '帮我查一下我账号在华北北京四有哪些云主机', expect: ['ECS'] },
  { id: 'EXP-E02', prompt: '创建一台 2C4G 的 Ubuntu 云服务器 规格通用型', expect: ['ECS'] },
  { id: 'EXP-E03', prompt: '把本地 dist 目录部署成一个公网静态网站', expect: ['OBS'] },
  { id: 'EXP-E04', prompt: '给这台服务器绑定一个弹性公网IP', expect: ['EIP'] },
  { id: 'EXP-E05', prompt: '看一下我的云数据库MySQL实例的状态', expect: ['RDS'] },
  { id: 'EXP-E06', prompt: '创建一个 Redis 缓存实例用于会话存储', expect: ['DCS'] },
  { id: 'EXP-E07', prompt: '给生产环境的服务器配置一个每日备份策略', expect: ['CBR'] },
  { id: 'EXP-E08', prompt: '我的ECS启动失败了 帮我分析原因', expect: null },
  { id: 'EXP-E09', prompt: '开设一个 Kubernetes 集群用于微服务部署', expect: ['CCE'] },
  { id: 'EXP-E10', prompt: '部署一个函数处理图片自动压缩', expect: ['FunctionGraph'] },
  { id: 'EXP-E11', prompt: '查一下我账号这个月的费用情况', expect: ['BSS'] },
  { id: 'EXP-E12', prompt: '把应用日志指标推送到云监控告警', expect: ['CES'] },
  { id: 'EXP-E13', prompt: '申请HTTPS证书并配置到我的域名', expect: ['ELB'] },
  { id: 'EXP-E14', prompt: '我账号下的用户都有哪些权限 帮我审计一下', expect: ['IAM'] },
  { id: 'EXP-E15', prompt: '帮我领一下华为云的代金券', expect: ['Incentive Voucher'] },
];

let hit = 0, miss = 0, na = 0;
for (const c of CASES) {
  const r = await callTool('huaweicloud_service_catalog', { intent: c.prompt });
  const svcs = r?.recommendedServices || [];
  let verdict;
  if (c.expect === null) verdict = 'N/A';
  else verdict = c.expect.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS';
  if (verdict === 'HIT') hit++;
  else if (verdict === 'MISS') miss++;
  else na++;
  const got = svcs.join('+');
  const body = [
    `@@CASE ${c.id}@@`,
    `路由评测（源码级直调 huaweicloud_service_catalog，SUT=huaweicloud-devkit v1.1.4）`,
    `意图(prompt): ${c.prompt}`,
    `期望路由: ${(c.expect || []).join('/') || '(诊断 explain_error，不查服务目录)'}`,
    `实际推荐服务: ${got}`,
    `判定: ${verdict}`,
    `${verdict === 'HIT' ? 'PASS' : verdict === 'MISS' ? 'FAIL' : 'N/A'}  ${c.id}  路由${verdict === 'HIT' ? '命中' : verdict === 'MISS' ? '未命中' : '(诊断类，非服务目录路由层)'} 期望=${(c.expect || []).join('/') || '(诊断)'} 实际=${got}`,
    `@@END@@`,
  ].join('\n');
  mkdirSync(join(EVID, c.id), { recursive: true });
  writeFileSync(join(EVID, c.id, 'stdout.log'), body + '\n', 'utf8');
  console.log(`${c.id} | ${verdict.padEnd(5)} | 期望=${(c.expect || []).join('/') || '(诊断)'} | 实际=${got}`);
}

const denom = hit + miss;
console.log(`\n=== 汇总 === HIT=${hit} MISS=${miss} N/A=${na} | 准确率=${denom ? ((hit / denom) * 100).toFixed(1) : 'N/A'}% (HIT+MISS=${denom})`);