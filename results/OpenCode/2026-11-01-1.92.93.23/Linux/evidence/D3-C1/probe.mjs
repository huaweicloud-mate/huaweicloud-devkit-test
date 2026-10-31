// probe D3-C1 real E2E 20261101054901
import { readFileSync } from 'node:fs';
const log=JSON.parse(readFileSync(new URL('./stdout.log', import.meta.url),'utf8'));
console.log(JSON.stringify({caseId:log.caseId,status:log.status,why:log.why}));
