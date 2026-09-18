// AI生成
// Debug D4-9 regex matching
import { readFileSync } from 'node:fs';

const rulesPath = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\safety\\rules\\cloud-risk-rules.json';
const catalog = JSON.parse(readFileSync(rulesPath, 'utf8'));

const iamRule = catalog.rules.find(r => r.id === 'hwc-iam-admin-policy');
console.log('IAM rule:', JSON.stringify(iamRule, null, 2));

const testText = '{"Statement": [{"Action": "*", "Effect": "Allow"}]}';
console.log('\nTest text:', testText);

for (const cond of iamRule.match.all) {
  const regex = new RegExp(cond.regex, 'ims');
  const matches = regex.test(testText);
  console.log(`  Condition field=${cond.field} regex=${cond.regex.substring(0, 60)}... => matches: ${matches}`);
}

// Also test with the evaluateDeployPlan function
import { evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const result = evaluateDeployPlan({ plan: testText });
console.log('\nevaluateDeployPlan result:', JSON.stringify(result, null, 2));
