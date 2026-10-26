import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function log(caseId, status, data) {
  results[caseId] = { caseId, status, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14), ...data };
}

console.log('Testing security intervention - static rules layer...');

// Load risk rules
const rulesPath = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json';
const rulesContent = readFileSync(rulesPath, 'utf8');
const rulesData = JSON.parse(rulesContent);
const rules = rulesData.rules || rulesData;

console.log('Rules loaded:', Array.isArray(rules) ? rules.length : 'not array');

// Check rules structure
if (Array.isArray(rules) && rules.length >= 10) {
  const denyCount = rules.filter(r => r.severity === 'deny').length;
  const warnCount = rules.filter(r => r.severity === 'warn').length;
  
  console.log('Deny rules:', denyCount, 'Warn rules:', warnCount);
  
  if (denyCount >= 5 && warnCount >= 5) {
    console.log('PASS: Risk rules loaded correctly');
    log('D10-4', 'PASS', {
      ruleCount: rules.length,
      denyCount,
      warnCount,
      note: '规则库完整加载，deny/warn 分布合理'
    });
  } else {
    console.log('FAIL: Risk rules distribution incorrect');
    log('D10-4', 'FAIL', {
      ruleCount: rules.length,
      denyCount,
      warnCount,
      error: '规则分布不合理'
    });
  }
} else {
  console.log('FAIL: Risk rules not loaded');
  log('D10-4', 'FAIL', { error: '规则库加载失败', ruleCount: rules?.length });
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Done');