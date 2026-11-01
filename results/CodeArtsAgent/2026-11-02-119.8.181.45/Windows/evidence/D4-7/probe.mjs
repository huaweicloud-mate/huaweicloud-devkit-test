import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const rre = await import(fileUrl);
  const hasEvaluate = typeof rre.evaluateCommandRisk === 'function';
  results['D4-7'] = { status: hasEvaluate ? 'PASS' : 'FAIL', hasEvaluate, why: `evaluateCommandRisk exists=${hasEvaluate}` };
} catch(e) { results['D4-7'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
