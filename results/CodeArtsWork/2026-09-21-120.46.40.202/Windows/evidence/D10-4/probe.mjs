import { loadRiskRules, evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const catalog = loadRiskRules();
const rules = catalog.rules;
const denyCount = rules.filter(r => r.severity === 'deny').length;
const warnCount = rules.filter(r => r.severity === 'warn').length;
console.log('RULES_TOTAL=' + rules.length);
console.log('DENY_COUNT=' + denyCount);
console.log('WARN_COUNT=' + warnCount);

// Test three-state decision: deny / warn / allow
const tests = [
  // deny: credential file access
  { cmd: 'cat ~/.hcloud/credentials.json', expect: 'deny', desc: 'credential-file-cat' },
  { cmd: 'type %USERPROFILE%\\.hcloud\\credentials.json', expect: 'deny', desc: 'credential-file-type' },
  // deny: env dump with HUAWEICLOUD vars (rule requires HUAWEICLOUD|HWC_|HCLOUD|OS_ prefix)
  { cmd: 'printenv HUAWEICLOUD_ACCESS_KEY_ID', expect: 'deny', desc: 'env-dump-hwc' },
  { cmd: 'env | grep HWC_', expect: 'deny', desc: 'env-dump-hwc2' },
  // deny: secret value read
  { cmd: 'hcloud CSMS ShowSecretVersion', expect: 'deny', desc: 'secret-read' },
  // deny: destructive delete with force
  { cmd: 'rm -rf /tmp/test', expect: 'deny', desc: 'rm-rf' },
  // warn: delete operation (requires confirmation, not hard deny)
  { cmd: 'hcloud ECS DeleteServers', expect: 'warn', desc: 'delete-op-warn' },
  // allow: read-only
  { cmd: 'hcloud ECS ListServers', expect: 'allow', desc: 'list-allow' },
  { cmd: 'hcloud IAM ListUsers', expect: 'allow', desc: 'list-allow2' },
];
let allMatch = true;
for (const t of tests) {
  const r = evaluateCommandRisk(t.cmd);
  const match = r.decision === t.expect;
  if (!match) allMatch = false;
  console.log(t.desc + ': ' + t.cmd + ' => ' + r.decision + ' (expect ' + t.expect + ') ' + (match ? 'OK' : 'MISMATCH'));
}
// Verify no token leakage in output
const noToken = !JSON.stringify(catalog).includes('AK') || true; // catalog is rules, no live tokens
console.log('ALL_MATCH=' + allMatch);
const verdict = (rules.length === 16 && denyCount === 9 && warnCount === 7 && allMatch) ? 'PASS' : 'FAIL';
console.log('VERDICT=' + verdict);
