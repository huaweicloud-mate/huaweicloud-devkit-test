import { DIST, mcpTool, runNode, HOME, VC_QUOTE } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const uc = await import('file:///' + DIST + '/update-check.js');
console.log('judge older:', JSON.stringify(uc.judgeUpdate('1.1.14', { latest: '1.1.13', next: null }, null)));
console.log('judge newer:', JSON.stringify(uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, null)));
console.log('judge same:', JSON.stringify(uc.judgeUpdate('1.1.14', { latest: '1.1.14', next: null }, null)));
const rr = await import('file:///' + DIST + '/risk-rule-engine.js');
const rules = rr.loadRiskRules();
console.log('rules type:', Array.isArray(rules) ? 'array' : typeof rules, JSON.stringify(Array.isArray(rules) ? rules.length : Object.keys(rules || {})).slice(0, 200));
const rulesArr = Array.isArray(rules) ? rules : (rules && rules.rules) || [];
console.log('rule sample:', JSON.stringify(rulesArr[0]).slice(0, 300));
console.log('deny count:', rulesArr.filter(r => (r.severity || r.decision) === 'deny').length, 'warn:', rulesArr.filter(r => (r.severity || r.decision) === 'warn').length);
console.log('eval delete:', JSON.stringify(rr.evaluateCommandRisk('hcloud ECS DeleteServers --server_id=x')).slice(0, 400));
console.log('eval read:', JSON.stringify(rr.evaluateCommandRisk('hcloud ECS ListServersDetails')).slice(0, 300));
const cmds = ['hcloud ECS DELETESERVERS --server_id=x', 'hcloud ECS DeleteServers%20--server_id=x', 'hcloud ECS "Delete""Servers" --server_id=x', 'cmd /c hcloud ECS DeleteServers --server_id=x', 'hcloud KMS DecryptData --cipher_text=abc', 'hcloud CSMS ShowSecretVersion --secret_name=x'];
for (const c of cmds) {
  const r = await mcpTool('huaweicloud_hook_check_command', { command: c }, 45000);
  console.log('HOOK', JSON.stringify(c), '=>', r.parsed && r.parsed.decision, (r.parsed && r.parsed.findings || []).map(f => f.ruleId).join(','));
}
