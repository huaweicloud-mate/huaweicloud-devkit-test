import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const uc = await import(fileUrl);
  const tests = uc.semverCompare ? [
    uc.semverCompare('1.1.2', '1.1.1') > 0,
    uc.semverCompare('1.1.0', '1.1.0-next.9') > 0,
    uc.semverCompare('1.1.0', '1.1.0') === 0
  ] : [false, false, false];
  results['D1-30'] = { status: tests.every(t => t) ? 'PASS' : 'FAIL', tests, why: `semver tests: ${tests.join(', ')}` };
} catch(e) { results['D1-30'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
