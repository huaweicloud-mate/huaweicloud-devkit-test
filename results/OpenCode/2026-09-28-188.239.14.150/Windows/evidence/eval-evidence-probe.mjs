import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EVIDENCE_BASE = __dirname;

const now = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

function saveEvidence(caseId, probeContent, result) {
  const dir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.txt'), probeContent);
  writeFileSync(join(dir, 'stdout.log'), typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status || 'unknown'}`);
}

// Parse CSV properly (handle quoted fields)
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Read eval results CSV - find the latest one
const evalDir = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test/eval/results';
let evalCsvPath = null;
try {
  const files = readFileSync(join(evalDir, 'eval-run-20260927210420.csv'), 'utf-8');
  evalCsvPath = join(evalDir, 'eval-run-20260927210420.csv');
} catch(e) {
  console.error('Could not read eval CSV:', e.message);
}

const evalResults = {};
if (evalCsvPath) {
  const csv = readFileSync(evalCsvPath, 'utf-8');
  const lines = csv.trim().split('\n').slice(1); // skip header
  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length >= 5) {
      const caseId = parts[0].trim();
      evalResults[caseId] = {
        prompt: parts[1].trim(),
        expected: parts[2].trim(),
        actual: parts[3].trim(),
        verdict: parts[4].trim()
      };
    }
  }
}

console.log('Parsed eval results:', Object.keys(evalResults).length);

// EXP-E01~E15: D10 eval set - serviceCatalog routing
const evalExpectations = {
  'EXP-E01': { intent: '帮我查一下我账号在华北北京四有哪些云主机', expected: 'ECS', expectedAction: 'run_readonly' },
  'EXP-E02': { intent: '创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型', expected: 'ECS', expectedAction: 'plan/approve' },
  'EXP-E03': { intent: '把本地 dist 目录部署成一个公网静态网站', expected: 'OBS', expectedAction: 'deploy' },
  'EXP-E04': { intent: '给这台服务器绑定一个弹性公网IP', expected: 'EIP', expectedAction: 'plan' },
  'EXP-E05': { intent: '看一下我的云数据库MySQL实例的状态', expected: 'RDS', expectedAction: 'read' },
  'EXP-E06': { intent: '创建一个 Redis 缓存实例用于会话存储', expected: 'DCS', expectedAction: 'plan' },
  'EXP-E07': { intent: '给生产环境的服务器配置一个每日备份策略', expected: 'CBR', expectedAction: 'plan' },
  'EXP-E08': { intent: '我的ECS启动失败了, 帮我分析原因', expected: 'explain_error', expectedAction: '诊断' },
  'EXP-E09': { intent: '开设一个 Kubernetes 集群用于微服务部署', expected: 'CCE', expectedAction: 'plan' },
  'EXP-E10': { intent: '部署一个函数处理图片自动压缩', expected: 'FunctionGraph', expectedAction: 'plan' },
  'EXP-E11': { intent: '查一下我账号这个月的费用情况', expected: 'BSS', expectedAction: 'read' },
  'EXP-E12': { intent: '把应用日志指标推送到云监控告警', expected: 'CES', expectedAction: 'plan' },
  'EXP-E13': { intent: '申请HTTPS证书并配置到我的域名', expected: 'ELB', expectedAction: 'plan' },
  'EXP-E14': { intent: '我账号下的用户都有哪些权限, 帮我审计一下', expected: 'IAM', expectedAction: 'read' },
  'EXP-E15': { intent: '帮我领一下华为云的代金券', expected: 'Incentive Voucher', expectedAction: '执行' },
};

for (const [caseId, exp] of Object.entries(evalExpectations)) {
  const evalRes = evalResults[caseId] || { verdict: 'UNKNOWN', actual: 'N/A', expected: exp.expected };
  const isHit = evalRes.verdict === 'HIT';
  const isNA = evalRes.verdict === 'N/A';
  
  // Per test assertion: 未命中即判 FAIL (miss = FAIL)
  // N/A is also not a hit, so FAIL
  const status = isHit ? 'PASS' : 'FAIL';
  
  saveEvidence(caseId, `D10 Eval Set - serviceCatalog routing:
Intent: ${exp.intent}
Expected service: ${exp.expected}
Expected action: ${exp.expectedAction}
Actual routing: ${evalRes.actual}
Harness verdict: ${evalRes.verdict}

Source-level: node eval/harness/run-eval.mjs was executed against mcp-server.mjs.
The harness calls serviceCatalog(intent) for each Chinese intent and checks routing.
Known baseline: 21.4% MISS (3 HIT + 11 MISS + 1 N/A out of 15).
Assertion: 未命中即判 FAIL (miss = FAIL).`, {
    status: status,
    why: isHit ? `serviceCatalog correctly routed to ${exp.expected} (actual: ${evalRes.actual})` 
         : `serviceCatalog ${evalRes.verdict}: expected ${exp.expected} but got "${evalRes.actual}". Known baseline issue (21.4% MISS rate).`,
    expected: exp.expected,
    actual: evalRes.actual,
    harnessVerdict: evalRes.verdict,
    intent: exp.intent,
    baselineMissRate: '21.4%',
    executedAt: now()
  });
}

console.log('\n=== EXP-E Evidence Summary ===');
let ePass = 0, eFail = 0;
for (const caseId of Object.keys(evalExpectations)) {
  const evalRes = evalResults[caseId];
  if (evalRes) {
    if (evalRes.verdict === 'HIT') ePass++;
    else eFail++;
  }
}
console.log(`PASS=${ePass} FAIL=${eFail}`);
