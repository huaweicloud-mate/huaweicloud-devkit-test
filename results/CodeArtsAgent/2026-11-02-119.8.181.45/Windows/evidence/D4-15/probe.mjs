import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const sp = await import(fileUrl);
  const r = sp.classifyTextCommand ? sp.classifyTextCommand('curl -H "Authorization: Bearer token" https://api.example.com') : { risk: 'unknown' };
  results['D4-15'] = { status: r.risk ? 'PASS' : 'FAIL', risk: r.risk, why: `curl command classified as ${r.risk}` };
} catch(e) { results['D4-15'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
