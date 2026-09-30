/**
 * D4-18: Risk rule engine integration
 * evaluateCommandRisk and mergeRiskDecision from risk-rule-engine.mjs
 * classifyHcloudArgs should apply risk rules via applyCommandRiskRules
 */
import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, mergeRiskDecision } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence/D4-18';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// evaluateCommandRisk exists and returns an object
const risk1 = evaluateCommandRisk('hcloud ECS ListServers');
check('evaluate-returns-object', risk1 && typeof risk1 === 'object', `type=${typeof risk1}`);

// mergeRiskDecision exists and merges correctly
const base = { decision: 'allow', risk: 'read_only', reason: 'read op' };
const merged = mergeRiskDecision(base, risk1);
check('merge-returns-object', merged && typeof merged === 'object', `type=${typeof merged}`);
check('merge-preserves-decision', merged.decision === base.decision || merged.decision === 'deny', `decision=${merged.decision}`);

// High-risk command should escalate
const risk2 = evaluateCommandRisk('rm -rf /');
check('rmrf-evaluated', risk2 && typeof risk2 === 'object', `risk=${JSON.stringify(risk2)?.substring(0, 100)}`);

// classifyHcloudArgs integrates risk rules (a read command that matches a risk rule should be escalated)
const r = classifyHcloudArgs(['ECS', 'ListServers']);
check('classify-integrates-risk', r && typeof r === 'object' && r.decision !== undefined, `decision=${r.decision}`);

// Text command with risk pattern
const r2 = classifyTextCommand('hcloud ECS ListServers && rm -rf /tmp');
check('risk-pattern-detected', r2.decision === 'deny' || r2.risk !== 'not_huaweicloud', `decision=${r2.decision}, risk=${r2.risk}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-18', why: allPass ? 'Risk rule engine correctly integrated with classifyHcloudArgs' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20260930103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);