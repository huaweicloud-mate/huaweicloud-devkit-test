import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const rre = await import(fileUrl);
  const r = rre.evaluateCommandRisk ? rre.evaluateCommandRisk('hcloud ECS CreateServer --name=test --flavor_ref=test') : { decision: 'unknown' };
  results['D4-21'] = { status: r.decision === 'deny' ? 'PASS' : 'FAIL', decision: r.decision, why: `CreateServer: ${r.decision}` };
} catch(e) { results['D4-21'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
