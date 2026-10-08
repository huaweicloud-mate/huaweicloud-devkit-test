/**
 * D10-4: Eval set coverage
 * Check eval/prompts/eval-set-v1.csv for:
 * - Minimum entry count
 * - Route coverage across services
 * - Action type diversity
 * - All required fields present
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-03-188.239.14.150/Windows/evidence/D10-4';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

const csvPath = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/eval/prompts/eval-set-v1.csv';
const csvPath2 = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/eval/prompts/eval-set-v2.csv';

// 1. File exists
check('v1-exists', existsSync(csvPath), `path=${csvPath}`);
check('v2-exists', existsSync(csvPath2), `path=${csvPath2}`);

// 2. Parse CSV
const csvContent = readFileSync(csvPath, 'utf8');
const lines = csvContent.trim().split('\n');
const header = lines[0].split(',');
check('has-header', header.length >= 4, `header=${header.join(',')}`);
check('header-has-id', header[0]?.trim() === 'id', `id col=${header[0]}`);
check('header-has-route', header[2]?.includes('路由'), `route col=${header[2]}`);
check('header-has-action', header[3]?.includes('动作'), `action col=${header[3]}`);

// 3. Parse entries
const entries = lines.slice(1).filter(l => l.trim()).map(line => {
  const parts = line.split(',');
  return { id: parts[0]?.trim(), prompt: parts[1]?.trim(), route: parts[2]?.trim(), action: parts[3]?.trim(), source: parts[4]?.trim() };
});

// 4. Entry count
check('min-entries', entries.length >= 15, `count=${entries.length}`);
check('entries-non-empty', entries.length > 0, `count=${entries.length}`);

// 5. All entries have required fields
check('all-have-id', entries.every(e => e.id && e.id.length > 0), 'all have id');
check('all-have-prompt', entries.every(e => e.prompt && e.prompt.length > 0), 'all have prompt');
check('all-have-route', entries.every(e => e.route && e.route.length > 0), 'all have route');
check('all-have-action', entries.every(e => e.action && e.action.length > 0), 'all have action');

// 6. Route coverage - diverse services
const routes = entries.map(e => e.route);
const uniqueRoutes = [...new Set(routes)];
check('route-diversity', uniqueRoutes.length >= 10, `unique routes=${uniqueRoutes.length}`);

// 7. Action type diversity
const actions = entries.map(e => e.action);
const uniqueActions = [...new Set(actions)];
check('action-diversity', uniqueActions.length >= 3, `unique actions=${uniqueActions.length}`);

// 8. IDs are unique
const ids = entries.map(e => e.id);
check('ids-unique', new Set(ids).size === ids.length, `unique=${new Set(ids).size}, total=${ids.length}`);

// 9. Check v2 if exists
if (existsSync(csvPath2)) {
  const v2Content = readFileSync(csvPath2, 'utf8');
  const v2Lines = v2Content.trim().split('\n').filter(l => l.trim());
  const v2Entries = v2Lines.slice(1);
  check('v2-has-entries', v2Entries.length > 0, `v2 count=${v2Entries.length}`);
  check('v2-superset', v2Entries.length >= entries.length, `v2=${v2Entries.length}, v1=${entries.length}`);
} else {
  check('v2-has-entries', true, 'v2 not present, skip');
  check('v2-superset', true, 'v2 not present, skip');
}

// 10. Key service routes covered
const expectedRoutes = ['ECS查询', 'ECS创建', 'OBS静态站', 'RDS查询', 'CCE创建'];
const coveredRoutes = expectedRoutes.filter(r => routes.includes(r));
check('key-routes-covered', coveredRoutes.length >= 3, `covered=${coveredRoutes.join(',')}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D10-4',
  why: allPass ? `eval-set-v1.csv has ${entries.length} entries, ${uniqueRoutes.length} unique routes, ${uniqueActions.length} action types` : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`,
  executedAt: '20261001103000',
  checks,
  summary: { totalEntries: entries.length, uniqueRoutes: uniqueRoutes.length, uniqueActions: uniqueActions.length, routes: uniqueRoutes, actions: uniqueActions },
}, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);