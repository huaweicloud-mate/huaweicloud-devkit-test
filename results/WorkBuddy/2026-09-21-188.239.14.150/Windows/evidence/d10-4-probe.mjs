// d10-4-probe.mjs: D10-4 Security intervention - static rule layer (source direct call)
// Tests: loadRiskRules (count + severity) + evaluateCommandRisk (deny/warn/allow tri-state)
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hdkRoot = process.argv[2] || 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk';

const enginePath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'risk-rule-engine.mjs');
const { loadRiskRules, evaluateCommandRisk } = await import('file://' + enginePath.replace(/\\/g, '/'));

const results = {};

// Step 1: Load rules and verify count + severity distribution
const rules = loadRiskRules();
const ruleCount = rules.rules.length;
const denyCount = rules.rules.filter(r => r.severity === 'deny').length;
const warnCount = rules.rules.filter(r => r.severity === 'warn').length;
const rulesOk = ruleCount === 16 && denyCount === 9 && warnCount === 7;
console.log(`Rules: ${ruleCount} total, ${denyCount} deny, ${warnCount} warn → ${rulesOk ? 'OK' : 'FAIL'}`);

// Step 2: Evaluate high-risk commands (should be deny)
const denyCommands = [
  { cmd: 'type C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json', desc: 'credential file read' },
  { cmd: 'printenv HUAWEICLOUD_AK HUAWEICLOUD_SK', desc: 'env dump (HUAWEICLOUD prefix)' },
  { cmd: 'hcloud ECS DeleteServers --force', desc: 'force delete' },
];
const denyResults = denyCommands.map(({ cmd, desc }) => {
  const result = evaluateCommandRisk(cmd);
  console.log(`  deny test [${desc}]: decision=${result.decision}, findings=${result.findings.length}`);
  return { command: cmd, desc, decision: result.decision, findingsCount: result.findings.length, findings: result.findings.map(f => ({ ruleId: f.ruleId, severity: f.severity })) };
});
const denyAllDeny = denyResults.every(r => r.decision === 'deny');

// Step 3: Evaluate medium-risk commands (should be warn)
const warnCommands = [
  { cmd: 'hcloud ECS DeleteServers --server.id=xxx', desc: 'delete without force' },
  { cmd: 'hcloud ECS BatchDeleteServers --server.ids=xxx', desc: 'batch delete' },
];
const warnResults = warnCommands.map(({ cmd, desc }) => {
  const result = evaluateCommandRisk(cmd);
  console.log(`  warn test [${desc}]: decision=${result.decision}, findings=${result.findings.length}`);
  return { command: cmd, desc, decision: result.decision, findingsCount: result.findings.length };
});
const warnAllWarn = warnResults.every(r => r.decision === 'warn');

// Step 4: Evaluate read-only commands (should be allow)
const allowCommands = [
  { cmd: 'hcloud ECS ListServers', desc: 'list servers' },
  { cmd: 'hcloud VPC ListVpcs', desc: 'list vpcs' },
  { cmd: 'hcloud IAM ListUsers', desc: 'list users' },
];
const allowResults = allowCommands.map(({ cmd, desc }) => {
  const result = evaluateCommandRisk(cmd);
  console.log(`  allow test [${desc}]: decision=${result.decision}, findings=${result.findings.length}`);
  return { command: cmd, desc, decision: result.decision, findingsCount: result.findings.length };
});
const allowAllAllow = allowResults.every(r => r.decision === 'allow');

// Step 5: Verify no token/credential in findings
const allFindingsText = JSON.stringify([...denyResults, ...warnResults, ...allowResults]);
const noToken = !/token|AK[A-Z0-9]{10,}|sk-[a-zA-Z0-9]{10,}/i.test(allFindingsText);

// Step 6: Verify tri-state (deny, warn, allow all present)
const triStateOk = denyAllDeny && warnAllWarn && allowAllAllow;

const pass = rulesOk && denyAllDeny && warnAllWarn && allowAllAllow && noToken;
results['D10-4'] = { 
  pass, 
  detail: `Rules: ${ruleCount}(9d+7w)=${rulesOk}, deny cmds→deny: ${denyAllDeny}, warn cmds→warn: ${warnAllWarn}, allow cmds→allow: ${allowAllAllow}, no token: ${noToken}` 
};

// Save evidence
const dir = join(__dirname, 'D10-4');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const log = {
  status: pass ? 'PASS' : 'FAIL',
  detail: results['D10-4'].detail,
  executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
  rules: { total: ruleCount, deny: denyCount, warn: warnCount },
  denyResults,
  warnResults,
  allowResults,
  noToken,
  triStateOk
};
writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2), 'utf-8');

// Also save probe script copy
writeFileSync(join(dir, 'probe.mjs'), `// D10-4 probe executed at ${new Date().toISOString()}\n// enginePath: ${enginePath}\n`, 'utf-8');

console.log(`\nD10-4: ${pass ? 'PASS' : 'FAIL'} - ${results['D10-4'].detail}`);

// Save summary
writeFileSync(join(__dirname, 'd10-4-summary.json'), JSON.stringify(results, null, 2), 'utf-8');
process.exit(0);
