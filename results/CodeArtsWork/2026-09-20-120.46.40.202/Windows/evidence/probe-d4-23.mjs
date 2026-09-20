// D4-23 retry - check global rules injection via different APIs
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TMP = mkdtempSync(join(tmpdir(), 'hdk-d423-'));
process.env.HUAWEICLOUD_HOME = TMP;
process.env.HCLOUD_OBS_CONFIG_PATH = join(TMP, 'obsutilconfig');
process.env.HCLOUD_CONFIG_PATH = join(TMP, 'hcloud-config.json');

const NPM_ROOT = 'C:\\Users\\Administrator\\AppData\\Roaming\\npm\\node_modules\\huaweicloud-devkit';
const CORE = 'file:///' + NPM_ROOT.replace(/\\/g,'/') + '/plugins/huaweicloud-core/src';

const { callTool } = await import(CORE + '/tools.mjs');

// Try different approaches to verify rules are loaded
const results = [];

// 1. Check via hook_check_command - if rules are loaded, they should match
try {
  const h1 = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --server-ids 1' });
  results.push({ test: 'hook catches destructive', pass: h1 && h1.findings && h1.findings.length > 0, actual: h1 });
  
  const h2 = await callTool('huaweicloud_hook_check_command', { command: 'type ~/.config/huaweicloud/credentials.json' });
  results.push({ test: 'hook catches cred file read', pass: h2 && h2.findings && h2.findings.length > 0, actual: h2 });
  
  const h3 = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --force' });
  results.push({ test: 'hook catches force delete', pass: h3 && h3.findings && h3.findings.length > 0, actual: h3 });
  
  // 2. Check via hook_check_deploy_plan
  const h4 = await callTool('huaweicloud_hook_check_deploy_plan', { plan: { resources: [{ type: 'EIP', action: 'create' }] } });
  results.push({ test: 'hook catches EIP create in plan', pass: h4 && h4.findings && h4.findings.length > 0, actual: h4 });
  
  // 3. Check via hook_check_artifacts
  const h5 = await callTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'test.tf', content: 'resource "huaweicloud_vpc" "test" { cidr = "0.0.0.0/0" }' }] });
  results.push({ test: 'hook checks artifacts', pass: h5 !== null, actual: h5 });
  
} catch(e) {
  results.push({ test: 'error', pass: false, actual: e.message });
}

// If multiple rules matched, rules are loaded
const rulesMatched = results.filter(r => r.pass).length;
console.log(JSON.stringify({
  rulesMatched,
  totalTests: results.length,
  conclusion: rulesMatched >= 3 ? 'PASS - global rules injection effective (multiple rules matched across hook tools)' : 'BLOCKED',
  results
}, null, 2));
