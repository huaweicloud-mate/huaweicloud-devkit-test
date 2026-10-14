import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,200), expected: String(expected).slice(0,200) }); }

const ad = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/agent-detect.mjs');
const ar = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/agent-registry.mjs');
const ag = ad.detectAgent({ name: 'Hermes', version: '1.0' });
test('D1-64','detectAgent-对象含harness', ag && typeof ag.harness === 'string' && ag.harness.length>0, JSON.stringify(ag), 'object');
const dh = ad.detectAgentHarness({ name: 'Hermes', version: '1.0' });
test('D1-64','detectAgentHarness=hermes', dh === 'hermes', String(dh), 'hermes');
test('D1-64','detectVersion-null=null', ar.detectVersion(null) === null, String(ar.detectVersion(null)), 'null');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-64', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014153000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
