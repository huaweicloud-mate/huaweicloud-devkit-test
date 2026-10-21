import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const mod = await import(pathToFileURL(join(hdkSrc, 'safety-policy.mjs')).href);
const fn = mod.classifyTextCommand;

// Test various commands
const cmds = [
  'cat ~/.hcloud/credentials.json',
  'printenv HW_SECRET_KEY',
  'echo $HW_SECRET_ACCESS_KEY',
  'printenv AK',
  'echo $SK',
  'hcloud KMS ListSecrets',
  'hcloud CSMS ShowSecret --secret-id=abc',
  'hcloud KMS CreateKey --alias=test',
  'hcloud ECS DeleteServer --instance_id=abc',
  'hcloud ECS ListServersDetails',
];
for (const cmd of cmds) {
  const r = fn(cmd);
  console.log(JSON.stringify({cmd: cmd.slice(0,40), decision: r?.decision, reason: (r?.reason||'').slice(0,60)}));
}

// Test redactSecrets
const rs = mod.redactSecrets;
const testInputs = [
  'AK: AKTEST123456789',
  'SK: sk-test-123456789abcdef',
  'secret token: abcdefghijklmnop123456',
  'normal text',
];
console.log('\n--- redactSecrets ---');
for (const input of testInputs) {
  const out = rs(input);
  console.log(JSON.stringify({input: input.slice(0,30), output: out.slice(0,50), changed: out !== input}));
}

// Test risk-rule-engine
const rre = await import(pathToFileURL(join(hdkSrc, 'risk-rule-engine.mjs')).href);
const evalRisk = rre.evaluateCommandRisk;
console.log('\n--- evaluateCommandRisk ---');
const riskCmds = ['cat ~/.hcloud/credentials.json','printenv HW_SECRET_KEY','hcloud ECS DeleteServer --instance_id=abc','hcloud ECS ListServersDetails'];
for (const cmd of riskCmds) {
  try {
    const r = evalRisk(cmd);
    console.log(JSON.stringify({cmd: cmd.slice(0,40), decision: r?.decision, reason: (r?.reason||'').slice(0,60)}));
  } catch(e) {
    console.log(JSON.stringify({cmd: cmd.slice(0,40), error: e.message.slice(0,80)}));
  }
}
const rules = rre.loadRiskRules();
console.log('\nrules count:', Array.isArray(rules) ? rules.length : Object.keys(rules||{}).length);
if (Array.isArray(rules)) {
  for (const r of rules) {
    console.log('  rule:', r.id || r.name || JSON.stringify(r).slice(0,60));
  }
}
