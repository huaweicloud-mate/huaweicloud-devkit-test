// D10-4 corrected: static rule layer intervention = deny OR warn (not allow)
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// D10-4: 安全干预-静态规则层
// The static rule layer should INTERVENE (deny or warn) on dangerous commands, allow safe ones
const tests = [
  { cmd: 'cat ~/.hcloud/credentials.json', expectIntervene: true },
  { cmd: 'printenv HUAWEICLOUD_SDK_AK', expectIntervene: true },
  { cmd: 'hcloud DEW ShowSecretVersion --secret_id=test', expectIntervene: true },
  { cmd: 'hcloud ECS DeleteServer --server_id=test', expectIntervene: true },
  { cmd: 'hcloud ECS ListServers', expectIntervene: false },
];

const testResults = tests.map(t => {
  const r = evaluateCommandRisk(t.cmd);
  const intervened = r.decision === 'deny' || r.decision === 'warn';
  const pass = intervened === t.expectIntervene;
  return { cmd: t.cmd, decision: r.decision, intervened, expectIntervene: t.expectIntervene, pass };
});

const allPass = testResults.every(r => r.pass);
const result = {
  status: allPass ? 'PASS' : 'FAIL',
  why: testResults.map(r => `${r.cmd.substring(0,40)}=${r.decision}(${r.pass?'ok':'FAIL'})`).join(' '),
  detail: { results: testResults }
};

console.log(JSON.stringify({ 'D10-4': result }, null, 2));

const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');
try { writeFileSync(join(evidBase, 'D10-4', 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
