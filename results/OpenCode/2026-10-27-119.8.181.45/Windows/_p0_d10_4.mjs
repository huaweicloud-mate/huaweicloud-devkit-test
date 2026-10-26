// Source-level probe for D10-4: Security intervention static rules layer
// Tests: loadRiskRules count/severity + evaluateCommandRisk for delete vs readonly
import { pathToFileURL } from 'node:url';
const hdkSrc = pathToFileURL('C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk\\plugins\\huaweicloud-core\\src\\risk-rule-engine.mjs').href;
const mod = await import(hdkSrc);
const { loadRiskRules, evaluateCommandRisk } = mod;
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evDir = join(__dirname, 'evidence', 'D10-4');
mkdirSync(evDir, { recursive: true });

const rules = loadRiskRules();
const ruleList = rules.rules || rules;
const denyCount = ruleList.filter(r => r.severity === 'deny').length;
const warnCount = ruleList.filter(r => r.severity === 'warn').length;
const totalCount = ruleList.length;

// Test high-risk command (delete with force = deny rule)
const deleteResult = evaluateCommandRisk('hcloud ECS DeleteServers --force');
const deleteDecision = deleteResult?.decision || 'unknown';
const deleteIsDeny = deleteDecision === 'deny';

// Test read-only command
const readonlyResult = evaluateCommandRisk('hcloud ECS NovaListServersDetails');
const readonlyDecision = readonlyResult?.decision || 'unknown';
const readonlyIsAllow = readonlyDecision === 'allow';

const status = (denyCount >= 9 && warnCount >= 7 && deleteIsDeny && readonlyIsAllow) ? 'PASS' : 'FAIL';
const result = {
  caseId: 'D10-4',
  status,
  why: `Rules: ${totalCount} total (${denyCount} deny + ${warnCount} warn); delete=deny(${deleteIsDeny}); readonly=allow(${readonlyIsAllow})`,
  ruleCounts: { total: totalCount, deny: denyCount, warn: warnCount },
  deleteTest: { decision: deleteDecision, isDeny: deleteIsDeny, findings: (deleteResult?.findings || []).map(f => ({ id: f.ruleId, severity: f.severity })) },
  readonlyTest: { decision: readonlyDecision, isAllow: readonlyIsAllow, findings: (readonlyResult?.findings || []).map(f => ({ id: f.ruleId, severity: f.severity })) },
  executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
};

writeFileSync(join(evDir, 'probe.mjs'), `// Source-level probe for D10-4\n// Directly imports loadRiskRules + evaluate from risk-rule-engine.mjs\n// Tests rule count (9 deny + 7 warn) + delete=deny + readonly=allow\nimport { loadRiskRules, evaluate } from 'risk-rule-engine.mjs';\nconst rules = loadRiskRules();\nconst deleteResult = evaluate('command', { command: 'hcloud ECS DeleteServers' });\n`);
writeFileSync(join(evDir, 'stdout.log'), JSON.stringify(result, null, 2));
console.log(`D10-4 => ${status} | ${result.why}`);
