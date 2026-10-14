import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,160), expected: String(expected).slice(0,160) }); }

const skill = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/skills/huaweicloud-core/SKILL.md';
const content = (await import('node:fs')).readFileSync(skill, 'utf8');
test('D1-37','skill-exists', content.length > 100, 'len=' + content.length, 'content');
test('D1-37','check_update指令', /check[_ ]?update/i.test(content), 'matched', 'check_update');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-37', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014152000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
