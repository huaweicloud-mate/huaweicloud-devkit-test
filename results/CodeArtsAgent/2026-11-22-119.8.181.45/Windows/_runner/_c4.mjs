import { writeEvidence } from './lib.mjs';
import { readFileSync } from 'node:fs';
const arr = JSON.parse(readFileSync('C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-22-119.8.181.45/Windows/_exp_c4_result.json','utf8'));
const ok = arr.length === 22 && arr.every((x) => x.status === 'PASS');
writeEvidence('D3-C4', { status: ok ? 'PASS' : 'FAIL', why: '20+ services routing: ' + arr.filter(x=>x.status==='PASS').length + '/22 PASS (list_operations + plan read_only)', result: arr });
console.log('D3-C4', ok ? 'PASS' : 'FAIL', arr.filter(x=>x.status==='PASS').length + '/22');