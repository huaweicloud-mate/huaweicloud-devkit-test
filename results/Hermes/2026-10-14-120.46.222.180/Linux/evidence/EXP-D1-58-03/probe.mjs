import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,200), expected: String(expected).slice(0,200) }); }

const m = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs');
const e = m.mergeArgsStyle(undefined, { mcpPath: '/tmp/x.mjs' }).entry;
const cfg = { mcpServers: { 'huaweicloud-devkit': e } };
const changed = m.mergeArgsStyle(e, { mcpPath: '/tmp/x.mjs' }).changed;
test('skip','同key无变更', changed === false, String(changed), 'false');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'EXP-D1-58-03', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014153000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
