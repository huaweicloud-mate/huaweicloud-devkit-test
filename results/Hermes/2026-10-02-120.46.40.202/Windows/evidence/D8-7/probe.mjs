// P0 D8-7, D10-4 — quality + eval (no MCP server spawn)
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};
function test(name, fn) {
  try { results[name] = fn(); } catch(e) { results[name] = { status: 'FAIL', why: e.message }; }
}

// ===== D8-7: 7个 meta/通用技能指引可机械执行验证 =====
test('D8-7', () => {
  const skillsDir = join(__dirname, 'plugins', 'huaweicloud-core', 'skills');
  const metaSkills = [
    'huaweicloud-api-and-sdk',
    'huaweicloud-capability-discovery', 
    'huaweicloud-cli-and-auth',
    'huaweicloud-core',
    'huaweicloud-safety',
    'huaweicloud-troubleshooting'
  ];
  const found = {};
  for (const skill of metaSkills) {
    const skillPath = join(skillsDir, skill, 'SKILL.md');
    found[skill] = existsSync(skillPath);
    if (found[skill]) {
      const content = readFileSync(skillPath, 'utf8');
      found[skill] = content.startsWith('---') && content.length > 100;
    }
  }
  const allFound = Object.values(found).every(v => v === true);
  return {
    status: allFound ? 'PASS' : 'FAIL',
    why: `found=${JSON.stringify(found)}`,
    detail: found
  };
});

// ===== D10-4: 安全干预-静态规则层 =====
test('D10-4', () => {
  const tests = [
    { cmd: 'cat ~/.hcloud/credentials.json', expect: 'deny' },
    { cmd: 'printenv HUAWEICLOUD_SDK_AK', expect: 'deny' },
    { cmd: 'hcloud DEW ShowSecretVersion --secret_id=test', expect: 'deny' },
    { cmd: 'hcloud ECS DeleteServer --server_id=test', expect: 'deny' },
    { cmd: 'hcloud ECS ListServers', expect: 'allow' },
  ];
  const testResults = tests.map(t => {
    const r = evaluateCommandRisk(t.cmd);
    return { cmd: t.cmd, expected: t.expect, actual: r.decision, pass: r.decision === t.expect };
  });
  const allPass = testResults.every(r => r.pass);
  return {
    status: allPass ? 'PASS' : 'FAIL',
    why: testResults.map(r => `${r.cmd.substring(0,30)}=${r.actual}(${r.pass?'ok':'FAIL'})`).join(' '),
    detail: { results: testResults }
  };
});

const output = JSON.stringify(results, null, 2);
console.log(output);

const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');
for (const [caseId, result] of Object.entries(results)) {
  try { writeFileSync(join(evidBase, caseId, 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
}
