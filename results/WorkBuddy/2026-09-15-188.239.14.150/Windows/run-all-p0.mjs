// -*- coding: utf-8 -*-
// Main test runner entry point
import { runP0, results } from './run-p0.mjs';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Starting P0 tests...');
  await runP0();
  
  console.log('\n=== P0 Results Summary ===');
  let pass = 0, fail = 0;
  for (const r of results) {
    console.log(r.caseId + ': ' + r.status);
    if (r.status === 'PASS') pass++;
    else if (r.status === 'FAIL') fail++;
  }
  console.log('PASS: ' + pass + ', FAIL: ' + fail);
  
  // Save results JSON
  fs.writeFileSync(
    path.join(path.dirname(import.meta.url.replace('file:///', '')), 'p0-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log('\nResults saved to p0-results.json');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
