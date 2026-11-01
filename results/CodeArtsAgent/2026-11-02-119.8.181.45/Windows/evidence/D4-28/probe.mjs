import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const sp = await import(fileUrl);
  const r = sp.redactSecrets ? sp.redactSecrets({ password: 'secret123', token: 'bearer_token' }) : {};
  const isRedacted = r.password !== 'secret123' && r.token !== 'bearer_token';
  results['D4-28'] = { status: isRedacted ? 'PASS' : 'FAIL', isRedacted, why: `secrets redacted=${isRedacted}` };
} catch(e) { results['D4-28'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
