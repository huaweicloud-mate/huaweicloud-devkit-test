import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const rre = await import(fileUrl);
  const r = rre.evaluateCommandRisk ? rre.evaluateCommandRisk('hcloud CSMS ShowSecretVersion --secret_name=mysecret') : { decision: 'unknown' };
  results['D4-3'] = { status: r.decision === 'deny' ? 'PASS' : 'FAIL', decision: r.decision, why: `Expected deny, got ${r.decision}` };
} catch(e) { results['D4-3'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
