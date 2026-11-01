import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const uc = await import(fileUrl);
  
  // Test: current == latest -> up_to_date
  const r1 = uc.judgeUpdate ? uc.judgeUpdate('1.1.2', { latest: '1.1.2' }, null) : null;
  const isUpToDate = r1 && r1.result === 'up_to_date' && r1.updateAvailable === false;
  
  results['D1-27'] = { 
    status: isUpToDate ? 'PASS' : 'FAIL',
    result: r1?.result,
    updateAvailable: r1?.updateAvailable,
    why: `current=1.1.2, latest=1.1.2 -> result=${r1?.result}, updateAvailable=${r1?.updateAvailable}`
  };
} catch(e) { results['D1-27'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
