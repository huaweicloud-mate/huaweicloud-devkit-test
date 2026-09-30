/**
 * D4-19: Merge risk decision
 * mergeRiskDecision must correctly merge risk evaluation results into base classification
 * Risk eval format: { decision, findings: [{ ruleId, title, ... }] }
 */
import { mergeRiskDecision, evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence/D4-19';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// 1. evaluateCommandRisk on destructive command → deny with findings
const riskDeny = evaluateCommandRisk('rm -rf /tmp');
check('eval-rmrf-deny', riskDeny?.decision === 'deny', `decision=${riskDeny?.decision}`);
check('eval-rmrf-findings', Array.isArray(riskDeny?.findings) && riskDeny.findings.length > 0, `findings=${riskDeny?.findings?.length}`);

// 2. mergeRiskDecision: allow base + deny risk → deny
const allowBase = { decision: 'allow', risk: 'read_only', reason: 'read op' };
const merged1 = mergeRiskDecision(allowBase, riskDeny);
check('deny-overrides-allow', merged1.decision === 'deny', `decision=${merged1.decision}`);

// 3. mergeRiskDecision: allow base + no-risk → allow
const noRisk = evaluateCommandRisk('hcloud ECS ListServers');
const merged2 = mergeRiskDecision(allowBase, noRisk);
check('allow-preserved-no-risk', merged2.decision === 'allow', `decision=${merged2.decision}`);

// 4. mergeRiskDecision: deny base + any risk → deny (deny is sticky)
const denyBase = { decision: 'deny', risk: 'write', reason: 'blocked' };
const merged3 = mergeRiskDecision(denyBase, noRisk);
check('deny-sticky', merged3.decision === 'deny', `decision=${merged3.decision}`);

// 5. mergeRiskDecision: null risk → base preserved
const merged4 = mergeRiskDecision(allowBase, null);
check('null-risk-preserves', merged4.decision === 'allow', `decision=${merged4.decision}`);

// 6. Integration: classifyTextCommand with destructive pattern → deny
const r = classifyTextCommand('hcloud ECS ListServers && rm -rf /tmp');
check('integration-destructive', r.decision === 'deny', `decision=${r.decision}, risk=${r.risk}`);

// 7. Integration: clean read command → allow
const r2 = classifyTextCommand('hcloud ECS ListServers');
check('integration-clean-read', r2.decision === 'allow', `decision=${r2.decision}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-19', why: allPass ? 'mergeRiskDecision correctly merges risk evaluation results; deny overrides allow' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20260930103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);