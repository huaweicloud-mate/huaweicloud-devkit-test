// Fix EXP-E01~E15: use correct intents from test cases CSV
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceBase = join(__dirname);

// Dynamically import serviceCatalog from source
const hdkSrc = 'C:\\Users\\Administrator\\devkit-test\\codearts-work\\hdk\\plugins\\huaweicloud-core\\src';

let serviceCatalog = null;
try {
  const toolsMod = await import(`file://${hdkSrc}/tools.mjs`);
  serviceCatalog = toolsMod.serviceCatalog || toolsMod.default?.serviceCatalog;
} catch (e) {
  // Try alternate export
  try {
    const mod = await import(`file://${hdkSrc}/mcp-server.mjs`);
    serviceCatalog = mod.serviceCatalog;
  } catch (e2) {
    console.error('Cannot import serviceCatalog:', e.message, e2.message);
  }
}

// If still no serviceCatalog, try to find it via the installed package
if (!serviceCatalog) {
  try {
    const mod = await import('huaweicloud-devkit');
    serviceCatalog = mod.serviceCatalog;
  } catch (e) {
    console.error('Cannot import from installed package:', e.message);
  }
}

// Correct intents from the test cases CSV
const evalCases = [
  { id: 'EXP-E01', intent: '帮我查一下我账号在华北北京四有哪些云主机', expect: ['ECS'], desc: 'ECS查询→run_readonly' },
  { id: 'EXP-E02', intent: '创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型', expect: ['ECS'], desc: 'ECS创建→plan/approve' },
  { id: 'EXP-E03', intent: '把本地 dist 目录部署成一个公网静态网站', expect: ['OBS'], desc: 'OBS静态站→deploy' },
  { id: 'EXP-E04', intent: '给这台服务器绑定一个弹性公网IP', expect: ['EIP'], desc: 'EIP→plan' },
  { id: 'EXP-E05', intent: '看一下我的云数据库MySQL实例的状态', expect: ['RDS'], desc: 'RDS查询→read' },
  { id: 'EXP-E06', intent: '创建一个 Redis 缓存实例用于会话存储', expect: ['DCS'], desc: 'DCS创建→plan' },
  { id: 'EXP-E07', intent: '给生产环境的服务器配置一个每日备份策略', expect: ['CBR'], desc: 'CBR→plan' },
  { id: 'EXP-E08', intent: '我的ECS启动失败了, 帮我分析原因', expect: ['ECS', 'explain_error'], desc: 'explain_error→诊断' },
  { id: 'EXP-E09', intent: '开设一个 Kubernetes 集群用于微服务部署', expect: ['CCE'], desc: 'CCE创建→plan' },
  { id: 'EXP-E10', intent: '部署一个函数处理图片自动压缩', expect: ['FunctionGraph'], desc: 'FunctionGraph→plan' },
  { id: 'EXP-E11', intent: '查一下我账号这个月的费用情况', expect: ['BSS', 'billing', '费用'], desc: '费用查询→read' },
  { id: 'EXP-E12', intent: '把应用日志指标推送到云监控告警', expect: ['CES'], desc: 'CES→plan' },
  { id: 'EXP-E13', intent: '申请HTTPS证书并配置到我的域名', expect: ['ELB', '证书', 'SCM'], desc: '证书/ELB→plan' },
  { id: 'EXP-E14', intent: '我账号下的用户都有哪些权限, 帮我审计一下', expect: ['IAM'], desc: 'IAM审计→read' },
  { id: 'EXP-E15', intent: '帮我领一下华为云的代金券', expect: ['voucher', '代金券', 'Voucher'], desc: 'voucher_claim→执行' },
];

const now = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
};

const results = {};

for (const tc of evalCases) {
  const dir = join(evidenceBase, tc.id);
  mkdirSync(dir, { recursive: true });
  
  let status = 'NOT_RUN';
  let why = '';
  
  try {
    if (serviceCatalog) {
      const result = await serviceCatalog(tc.intent);
      const resultStr = JSON.stringify(result);
      const matched = tc.expect.some(e => resultStr.includes(e));
      
      if (matched) {
        status = 'PASS';
        why = `"${tc.intent}" → ${tc.desc}; serviceCatalog 返回含 ${tc.expect.join('/')}`;
      } else {
        status = 'FAIL';
        why = `"${tc.intent}" → 期望含 ${tc.expect.join('/')} 但返回: ${resultStr.slice(0, 200)}`;
      }
    } else {
      // Fallback: use routeMap directly
      try {
        const routeMapMod = await import(`file://${hdkSrc}/tools.mjs`);
        // Try to access the route map or service catalog indirectly
        const allExports = Object.keys(routeMapMod);
        why = `serviceCatalog not directly accessible, exports: ${allExports.slice(0, 10).join(',')}`;
        status = 'BLOCKED';
      } catch (e) {
        status = 'BLOCKED';
        why = `Cannot import serviceCatalog: ${e.message}`;
      }
    }
  } catch (e) {
    status = 'FAIL';
    why = `Exception: ${e.message}`;
  }
  
  const log = { status, why, executedAt: now() };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2) + '\n', 'utf8');
  results[tc.id] = log;
  console.log(`${tc.id}: ${status} - ${why.slice(0, 80)}`);
}

// Save summary
writeFileSync(join(evidenceBase, '_exp-e-fix-summary.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('\nDone. Results saved.');
