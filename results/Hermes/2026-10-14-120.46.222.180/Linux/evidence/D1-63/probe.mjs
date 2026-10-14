import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,160), expected: String(expected).slice(0,160) }); }

const { readInstalledVersion } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs');
const v = readInstalledVersion();
test('D1-63','version-readable', typeof v === 'string' && v.length > 0, String(v).slice(0,30), 'string');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-63', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014152000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
