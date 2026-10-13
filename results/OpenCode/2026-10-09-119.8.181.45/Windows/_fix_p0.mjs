// Fix probes for D4-3, D4-23, D8-7, D10-4
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); };

const HDK = 'C:/Users/Administrator/devkit-test/OpenCode/hdk';

const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
const safety = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/safety-policy.mjs');
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}
const TS = now();

// D4-3: 明文secret API拦截
// csms show-secret is classified as read_only by safety-policy, but agent-rules says MUST NOT call it
// The risk rules should catch it. Check if risk rules catch csms download-secret/show-secret
try {
  const cmds = ['hcloud csms download-secret --secret-id 123', 'hcloud csms show-secret --secret-name mysecret', 'hcloud kms decrypt --cipher-text 123'];
  let allBlocked = true;
  const details = [];
  for (const cmd of cmds) {
    const rd = risk.evaluateCommandRisk ? risk.evaluateCommandRisk(cmd) : null;
    const sd = safety.classifyTextCommand ? safety.classifyTextCommand(cmd) : null;
    const blocked = /deny|warn/i.test(JSON.stringify(rd)) || /deny|warn/i.test(JSON.stringify(sd));
    if (!blocked) allBlocked = false;
    details.push({cmd, riskDecision: rd, safetyDecision: sd, blocked});
  }
  // SPEC-MISMATCH if safety.classifyTextCommand allows csms show-secret but risk rules catch it
  writeCase('D4-3', allBlocked
    ? { caseId:'D4-3', status:'PASS', why:'明文 secret API 被拦截', sample: JSON.stringify(details).slice(0,300), executedAt:TS }
    : { caseId:'D4-3', status:'SPEC-MISMATCH', why:'csms show-secret 被分类为 read_only，未被 safety-policy 拦截。agent-rules.md 规定 MUST NOT call csms show-secret/download-secret', detail: JSON.stringify(details).slice(0,400), rootCause: 'safety-policy.mjs classifyTextCommand - csms show-secret 未列入 deny 规则', executedAt:TS });
} catch (e) { writeCase('D4-3', { caseId:'D4-3', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// D4-23: 全局规则 huawei-agent-rules.md 注入生效性
try {
  const npmGlobal = spawnSync('npm', ['root', '-g'], { encoding: 'utf8', shell: true });
  const globalRoot = (npmGlobal.stdout || '').trim();
  const rulesPath = join(globalRoot, 'huaweicloud-devkit', 'rules', 'huawei-agent-rules.mdc');
  const exists = existsSync(rulesPath);
  let rulesContent = '';
  if (exists) rulesContent = readFileSync(rulesPath, 'utf8');
  const hasMust = /MUST|禁止|不得/i.test(rulesContent);
  const hasSecretSafety = /csms|secret|MUST NOT/i.test(rulesContent);
  const hasIAM = /IAM|least privilege|最小权限/i.test(rulesContent);
  writeCase('D4-23', (exists && hasMust && hasSecretSafety)
    ? { caseId:'D4-23', status:'PASS', why:'agent-rules.mdc 注入文件存在且含 MUST 约束 + secret safety', sample: rulesContent.slice(0,300), path: rulesPath, executedAt:TS }
    : { caseId:'D4-23', status:'FAIL', why:'rules 文件异常: exists='+exists+' must='+hasMust, executedAt:TS });
} catch (e) { writeCase('D4-23', { caseId:'D4-23', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// D8-7: 7 个 meta/通用技能指引可机械执行验证
try {
  const skillsRoot = join(HDK, 'plugins', 'huaweicloud-core', 'skills');
  const skillDirs = readdirSync(skillsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(skillsRoot, d.name, 'SKILL.md')))
    .map(d => d.name);
  const count = skillDirs.length;
  // 7 meta skills: huaweicloud-core, huaweicloud-cli-and-auth, huaweicloud-safety, huaweicloud-capability-discovery, huaweicloud-api-and-sdk, huaweicloud-troubleshooting, huawei-getting-started
  const metaSkills = ['huaweicloud-core', 'huaweicloud-cli-and-auth', 'huaweicloud-safety', 'huaweicloud-capability-discovery', 'huaweicloud-api-and-sdk', 'huaweicloud-troubleshooting', 'huawei-getting-started'];
  const found = metaSkills.filter(s => skillDirs.includes(s));
  writeCase('D8-7', (count >= 7 && found.length >= 7)
    ? { caseId:'D8-7', status:'PASS', why:count+' 个技能目录含 SKILL.md, 7 meta skills 全部找到', sample: JSON.stringify(found), executedAt:TS }
    : { caseId:'D8-7', status:'FAIL', why:'meta skills 不足: found='+found.length+' total='+count, sample: JSON.stringify({found, all: skillDirs}), executedAt:TS });
} catch (e) { writeCase('D8-7', { caseId:'D8-7', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// D10-4: 安全干预-静态规则层
try {
  const rules = risk.loadRiskRules();
  const ruleList = rules.rules || rules;
  const denyCount = ruleList.filter(r => r.severity === 'deny').length;
  const warnCount = ruleList.filter(r => r.severity === 'warn').length;
  // Test high-risk command
  const highCmd = 'cat ~/.huaweicloud/credentials.json';
  const highDecision = risk.evaluateCommandRisk(highCmd);
  const highDeny = highDecision && /deny/i.test(JSON.stringify(highDecision));
  // Test read-only command
  const readCmd = 'hcloud ECS list-servers';
  const readDecision = risk.evaluateCommandRisk(readCmd);
  const readAllow = readDecision && (/allow/i.test(JSON.stringify(readDecision)) || !/deny|warn/i.test(JSON.stringify(readDecision)));
  writeCase('D10-4', (denyCount >= 9 && warnCount >= 7 && highDeny && readAllow)
    ? { caseId:'D10-4', status:'PASS', why:'规则库完整加载 deny='+denyCount+' warn='+warnCount+' 高危deny只读allow', sample: JSON.stringify({denyCount, warnCount, total: ruleList.length, high: highDecision, read: readDecision}).slice(0,300), executedAt:TS }
    : { caseId:'D10-4', status:'FAIL', why:'规则库异常: deny='+denyCount+' warn='+warnCount+' highDeny='+highDeny+' readAllow='+readAllow, executedAt:TS });
} catch (e) { writeCase('D10-4', { caseId:'D10-4', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('P0 fix done.');
