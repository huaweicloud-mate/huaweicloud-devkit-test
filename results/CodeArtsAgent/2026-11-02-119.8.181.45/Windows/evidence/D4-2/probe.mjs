import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const rre = await import(fileUrl);
  const r1 = rre.evaluateCommandRisk ? rre.evaluateCommandRisk('env') : { decision: 'unknown' };
  const r2 = rre.evaluateCommandRisk ? rre.evaluateCommandRisk('printenv') : { decision: 'unknown' };
  const anyBlocked = r1.decision !== 'allow' || r2.decision !== 'allow';
  results['D4-2'] = { status: anyBlocked ? 'PASS' : 'FAIL', r1: r1.decision, r2: r2.decision, why: `env=${r1.decision}, printenv=${r2.decision}` };
} catch(e) { results['D4-2'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
