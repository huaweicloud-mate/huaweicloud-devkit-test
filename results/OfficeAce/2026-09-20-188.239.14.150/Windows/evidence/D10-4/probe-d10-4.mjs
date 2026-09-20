// AI生成
/**
 * P0 Test Case D10-4: 安全干预-静态规则层
 * Probe script — directly imports risk-rule-engine.mjs and validates:
 *   ① loadRiskRules: rule count + severity distribution (9 deny + 7 warn)
 *   ② evaluateCommandRisk: high-risk commands → deny/warn, read-only → allow
 *   ③ decision three-state: deny / warn / allow
 *
 * Evidence: this script + stdout.log → evidence/D10-4/
 */

import { loadRiskRules, evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const rulesPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json';

// ─── Helpers ──────────────────────────────────────────────
function ts() { return new Date().toISOString(); }
const log = [];
function out(msg) { const line = `[${ts()}] ${msg}`; log.push(line); console.log(line); }
function pass(cond, label) {
  const tag = cond ? '✅ PASS' : '❌ FAIL';
  out(`${tag} | ${label}`);
  return cond;
}

// ─── Step ①: loadRiskRules — rule count & severity distribution ───
out('═══════════════════════════════════════════════════════');
out('Step ①: loadRiskRules — rule count & severity distribution');
out('═══════════════════════════════════════════════════════');

const catalog = loadRiskRules({ path: rulesPath });
const rules = catalog.rules;
const total = rules.length;
const denyCount = rules.filter(r => r.severity === 'deny').length;
const warnCount = rules.filter(r => r.severity === 'warn').length;
const infoCount = rules.filter(r => r.severity === 'info').length;

out(`Catalog version: ${catalog.version}`);
out(`Total rules loaded: ${total}`);
out(`Severity distribution: deny=${denyCount}, warn=${warnCount}, info=${infoCount}`);
out('');
out('Rule inventory:');
for (const r of rules) {
  out(`  [${r.severity.toUpperCase().padEnd(4)}] ${r.id} — ${r.title} (stages: ${r.stages.join(',')})`);
}
out('');

const assertTotal   = pass(total === 16, `Total rules = 16 (got ${total})`);
const assertDeny    = pass(denyCount === 9, `Deny rules = 9 (got ${denyCount})`);
const assertWarn    = pass(warnCount === 7, `Warn rules = 7 (got ${warnCount})`);

// ─── Step ②: evaluateCommandRisk — high-risk & read-only commands ───
out('═══════════════════════════════════════════════════════');
out('Step ②: evaluateCommandRisk — high-risk & read-only commands');
out('═══════════════════════════════════════════════════════');

const testCases = [
  // High-risk commands (expect deny or warn, NOT allow)
  { label: 'cat credentials file',     cmd: 'cat ~/.hcloud/credentials.json',     expect: 'deny'  },
  { label: 'env-dump HUAWEICLOUD',     cmd: 'env | grep HUAWEICLOUD_ACCESS_KEY_ID', expect: 'deny'  },
  { label: 'echo secret env var',      cmd: 'echo $HW_SECRET_ACCESS_KEY',          expect: 'deny'  },
  { label: 'hcloud ECS DeleteServers', cmd: 'hcloud ECS DeleteServers --server-ids i-123', expect: 'warn'  },
  // Read-only commands (expect allow)
  { label: 'hcloud ECS ListServers',   cmd: 'hcloud ECS ListServers',              expect: 'allow' },
  { label: 'hcloud VPC ListVpcs',      cmd: 'hcloud VPC ListVpcs',                 expect: 'allow' },
];

const decisions = new Set();
const cmdResults = [];

for (const tc of testCases) {
  const result = evaluateCommandRisk(tc.cmd, { path: rulesPath });
  decisions.add(result.decision);
  const matched = result.findings.map(f => `${f.ruleId}(${f.severity})`).join(', ') || '—none—';
  out(`  [${result.decision.toUpperCase().padEnd(5)}] ${tc.label.padEnd(28)} │ cmd: "${tc.cmd}"`);
  out(`           expected=${tc.expect}, matched: ${matched}`);
  if (result.findings.length > 0) {
    for (const f of result.findings) {
      out(`           ↳ ${f.ruleId}: ${f.message}`);
    }
  }
  out('');
  cmdResults.push({ ...tc, actual: result.decision, findings: result.findings });
}

// ─── Step ③: decision three-state verification ───
out('═══════════════════════════════════════════════════════');
out('Step ③: decision three-state verification (deny/warn/allow)');
out('═══════════════════════════════════════════════════════');

out(`Distinct decisions observed: ${[...decisions].sort().join(', ')}`);
const assertThreeState = pass(
  decisions.has('deny') && decisions.has('warn') && decisions.has('allow'),
  `All three decision states observed: deny=${decisions.has('deny')}, warn=${decisions.has('warn')}, allow=${decisions.has('allow')}`
);

// ─── Per-command assertions ───
out('');
out('Per-command assertions:');

const assertCatDeny = pass(
  cmdResults[0].actual === 'deny',
  `cat credentials → deny (got ${cmdResults[0].actual})`
);
const assertEnvDeny = pass(
  cmdResults[1].actual === 'deny',
  `env-dump HUAWEICLOUD → deny (got ${cmdResults[1].actual})`
);
const assertEchoDeny = pass(
  cmdResults[2].actual === 'deny',
  `echo $HW_SECRET_ACCESS_KEY → deny (got ${cmdResults[2].actual})`
);
const assertDeleteWarn = pass(
  cmdResults[3].actual === 'warn' || cmdResults[3].actual === 'deny',
  `hcloud ECS DeleteServers → warn/deny (got ${cmdResults[3].actual})`
);
const assertListAllow = pass(
  cmdResults[4].actual === 'allow',
  `hcloud ECS ListServers → allow (got ${cmdResults[4].actual})`
);
const assertVpcAllow = pass(
  cmdResults[5].actual === 'allow',
  `hcloud VPC ListVpcs → allow (got ${cmdResults[5].actual})`
);

// ─── Token leakage check ───
out('');
out('Token leakage check: no real tokens in evidence output');
const allOutput = log.join('\n');
const tokenPatterns = [
  /AK[A-Z0-9]{10,}/,
  /sk-[a-zA-Z0-9]{20,}/,
  /[a-f0-9]{32,}/i,
];
const hasLeak = tokenPatterns.some(p => p.test(allOutput));
const assertNoLeak = pass(!hasLeak, 'No token-like strings found in output');

// ─── Final verdict ───
out('');
out('═══════════════════════════════════════════════════════');
out('FINAL VERDICT');
out('═══════════════════════════════════════════════════════');

const allAsserts = [
  ['Total rules = 16',          assertTotal],
  ['Deny rules = 9',            assertDeny],
  ['Warn rules = 7',            assertWarn],
  ['Three-state decisions',     assertThreeState],
  ['cat credentials → deny',    assertCatDeny],
  ['env-dump → deny',           assertEnvDeny],
  ['echo secret → deny',        assertEchoDeny],
  ['DeleteServers → warn/deny', assertDeleteWarn],
  ['ListServers → allow',       assertListAllow],
  ['ListVpcs → allow',          assertVpcAllow],
  ['No token leakage',          assertNoLeak],
];

for (const [name, ok] of allAsserts) {
  out(`  ${ok ? '✅' : '❌'} ${name}`);
}

const passed = allAsserts.every(([, ok]) => ok);
out('');
out(`RESULT: ${passed ? 'PASS ✅' : 'FAIL ❌'}`);
out(`Asserts: ${allAsserts.filter(([, ok]) => ok).length}/${allAsserts.length} passed`);
out('');
out('=== END OF PROBE ===');
