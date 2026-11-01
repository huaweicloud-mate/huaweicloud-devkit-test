import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const auth = await import(fileUrl);
  const hasResolve = typeof auth.resolveCredentials === 'function';
  results['D2-5'] = { status: hasResolve ? 'PASS' : 'FAIL', hasResolve, why: `resolveCredentials=${hasResolve}` };
} catch(e) { results['D2-5'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
