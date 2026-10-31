// probe for EXP-E14 (real execution 20261101052155)
import { readFileSync } from 'node:fs';
const log = JSON.parse(readFileSync(new URL('./stdout.log', import.meta.url), 'utf8'));
console.log(JSON.stringify({ caseId: log.caseId, status: log.status, why: log.why, executedAt: log.executedAt }));
