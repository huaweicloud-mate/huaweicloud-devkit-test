import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,160), expected: String(expected).slice(0,160) }); }

const { resolveStsInjectArgs } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs');
process.env.HUAWEICLOUD_INJECT_STS_CMD = '0';
const r0 = resolveStsInjectArgs(['VPC','ListVpcs']);
test('D1-74','env=0禁用注入', Array.isArray(r0) && r0.length === 0, JSON.stringify(r0), '[]');
process.env.HUAWEICLOUD_INJECT_STS_CMD = 'false';
const rf = resolveStsInjectArgs(['VPC','ListVpcs']);
test('D1-74','env=false禁用注入', Array.isArray(rf) && rf.length === 0, JSON.stringify(rf), '[]');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-74', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014152000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
