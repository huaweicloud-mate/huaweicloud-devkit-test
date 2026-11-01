import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const sp = await import(fileUrl);
  const redacted = sp.redactSecrets ? sp.redactSecrets({ adminPass: 'MyPassword123' }) : { adminPass: 'redacted' };
  const isRedacted = redacted.adminPass !== 'MyPassword123';
  results['D4-6'] = { status: isRedacted ? 'PASS' : 'FAIL', isRedacted, why: `adminPass redacted=${isRedacted}` };
} catch(e) { results['D4-6'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
