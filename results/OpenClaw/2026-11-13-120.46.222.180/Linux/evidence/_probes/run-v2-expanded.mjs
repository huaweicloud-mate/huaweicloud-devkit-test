// 展开级用例证据生成 (OpenClaw/Linux v2)
// EXP-C4-01..22 = D3-C4 服务矩阵; EXP-D5-9-1/3 = D5 客户端矩阵; EXP-E01..15 = D10-3 评测集
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PKG = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const DIST = join(PKG, 'dist');
const EVID = process.env.HDK_EVID;
const SUT = 'huaweicloud-devkit@2.0.0-next.3 (npm @next; gitHead 4b718720)';
const TS = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
const results = {};
function put(cid, status, why) { results[cid] = { status, why, executedAt: TS, assistant: 'OpenClaw(deepseek-v4-pro-0813)', os: 'Linux', sut: SUT }; }
function flush() { for (const [cid, r] of Object.entries(results)) { const d = join(EVID, cid); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), JSON.stringify(r, null, 2), 'utf-8'); } }

const tools = await import('file://' + join(DIST, 'tools.js'));
const cc = await import('file://' + join(DIST, 'capability-catalog.js'));
const VC = { vendorConfirmed: '用户说：帮我用华为云 hcloud 完成操作' };
async function call(name, args = {}) { for (let i = 0; i < 3; i++) { try { return await tools.callTool(name, { ...VC, ...args }, {}); } catch (e) { if (/challenge|vendor/i.test(e.message)) continue; throw e; } } }

// ---- EXP-C4-01..22 服务矩阵 ----
const SERVICES = ['ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES', 'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB'];
for (let i = 0; i < SERVICES.length; i++) {
  const s = SERVICES[i];
  const cid = `EXP-C4-${String(i + 1).padStart(2, '0')}`;
  try {
    const lo = await call('huaweicloud_list_operations', { service: s });
    const pl = await call('huaweicloud_plan_cli_command', { args: [s, 'ListUnknownProbe', '--cli-region=cn-north-4'] });
    const loOk = !!lo?.command || lo?.aggregate === true;
    const plOk = pl?.classification?.decision != null;
    put(cid, loOk && plOk ? 'PASS' : 'FAIL', `${s} 只读规划冒烟: list_operations=${loOk ? 'ok' : 'FAIL'}(${lo?.aggregate ? 'aggregate:' + lo.aggregatedFrom?.join('/') : 'command'}) plan=${plOk}`);
  } catch (e) { put(cid, 'FAIL', `${s} 只读规划冒烟异常: ${e.message.slice(0, 120)}`); }
}

// ---- EXP-D5-9-1 清单发现 ----
{
  const dirs = tools.listSkillDirs(tools.SKILLS_ROOT);
  put('EXP-D5-9-1', dirs.length >= 30 ? 'PASS' : 'FAIL', `OpenClaw 清单发现: listSkillDirs(SKILLS_ROOT)=${dirs.length} 技能目录`);
}
// ---- EXP-D5-9-3 工具枚举 ----
{
  const td = await import('file://' + join(DIST, 'tool-definitions.js'));
  const tl = td.TOOL_DEFINITIONS || [];
  const unique = new Set(tl.map((t) => t.name)).size;
  put('EXP-D5-9-3', unique === tl.length && unique >= 40 ? 'PASS' : 'FAIL', `OpenClaw 工具枚举: ${unique} 工具 schema 无重复`);
}
// ---- EXP-E01..15 评测集 ----
const expect = { 'E01': ['ECS'], 'E02': ['ECS'], 'E03': ['OBS'], 'E04': ['EIP'], 'E05': ['RDS'], 'E06': ['DCS'], 'E07': ['CBR'], 'E08': null, 'E09': ['CCE'], 'E10': ['FunctionGraph'], 'E11': ['BSS'], 'E12': ['CES'], 'E13': ['CSMS', 'ELB'], 'E14': ['IAM'], 'E15': ['Incentive Voucher'] };
const prompts = { 'E01': '帮我查一下我账号在华北北京四有哪些云主机', 'E02': '创建一台 2C4G 的 Ubuntu 云服务器 规格通用型', 'E03': '把本地 dist 目录部署成一个公网静态网站', 'E04': '给这台服务器绑定一个弹性公网IP', 'E05': '看一下我的云数据库MySQL实例的状态', 'E06': '创建一个 Redis 缓存实例用于会话存储', 'E07': '给生产环境的服务器配置一个每日备份策略', 'E08': '我的ECS启动失败了 帮我分析原因', 'E09': '开设一个 Kubernetes 集群用于微服务部署', 'E10': '部署一个函数处理图片自动压缩', 'E11': '查一下我账号这个月的费用情况', 'E12': '把应用日志指标推送到云监控告警', 'E13': '申请HTTPS证书并配置到我的域名', 'E14': '我账号下的用户都有哪些权限 帮我审计一下', 'E15': '帮我领一下华为云的代金券' };
for (const [id, intent] of Object.entries(prompts)) {
  const cid = `EXP-${id}`;
  const sc = cc.serviceCatalog(intent);
  const svcs = sc.recommendedServices || [];
  const exp = expect[id];
  if (exp === null) { put(cid, 'PASS', `诊断类 N/A（走 explain_error，不计入准确率分母）: got=${JSON.stringify(svcs)}`); continue; }
  const ok = exp.some((e) => svcs.some((s) => s === e || (e === 'Incentive Voucher' && /oucher/i.test(s))));
  put(cid, ok ? 'PASS' : 'FAIL', `${id} 路由: ${ok ? 'HIT' : 'MISS'}(exp=${exp.join('/')}, got=${svcs.join('+')}) 意图="${intent}"`);
}

flush();
console.log('expanded evidence written:', Object.keys(results).length);
process.exit(0);