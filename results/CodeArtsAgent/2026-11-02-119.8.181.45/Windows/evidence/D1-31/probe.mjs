import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const uc = await import(fileUrl);
  results['D1-31'] = { status: uc.writeSkipState && uc.judgeUpdate ? 'PASS' : 'FAIL', why: 'dismiss cooling functions exist' };
} catch(e) { results['D1-31'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
