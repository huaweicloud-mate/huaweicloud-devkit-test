import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,160), expected: String(expected).slice(0,160) }); }

const { maybePreinstallKooCli } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/preflight.mjs');
process.env.HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL = '1';
const r = await maybePreinstallKooCli({});
test('D1-75','env=1禁用预装', r && r.launched === false, JSON.stringify(r).slice(0,120), 'launched=false');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-75', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014152000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
