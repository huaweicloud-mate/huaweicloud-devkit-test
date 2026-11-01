// probe for D3-S4 (real execution 20261102051902)
import { readFileSync } from 'node:fs';
const log = JSON.parse(readFileSync(new URL('./stdout.log', import.meta.url), 'utf8'));
console.log(JSON.stringify({ caseId: log.caseId, status: log.status, why: log.why, executedAt: log.executedAt }));
