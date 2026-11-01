import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const uc = await import(fileUrl);
  
  // Test: current < latest -> update_available
  const r1 = uc.judgeUpdate ? uc.judgeUpdate('1.1.1', { latest: '1.1.2' }, null) : null;
  const isUpdateAvailable = r1 && r1.result === 'update_available' && r1.updateAvailable === true && r1.targetVersion === '1.1.2';
  
  results['D1-28'] = { 
    status: isUpdateAvailable ? 'PASS' : 'FAIL',
    result: r1?.result,
    updateAvailable: r1?.updateAvailable,
    targetVersion: r1?.targetVersion,
    why: `current=1.1.1, latest=1.1.2 -> result=${r1?.result}, target=${r1?.targetVersion}`
  };
} catch(e) { results['D1-28'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
