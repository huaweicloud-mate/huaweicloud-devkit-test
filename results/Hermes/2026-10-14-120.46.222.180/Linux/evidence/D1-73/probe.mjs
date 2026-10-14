import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,160), expected: String(expected).slice(0,160) }); }

const fs = await import('node:fs');
const src = fs.readFileSync('/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs','utf8');
const hasSkip = /HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT/.test(src);
test('D1-73','SKIP env处理存在', hasSkip, hasSkip, 'true');
const returnsNull = /HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT\s*===?\s*['"']1['"']\)?\s*return\s+null/.test(src) || /SKIP_OFFICEACE_DETECT[\s\S]{0,60}return null/.test(src);
test('D1-73','env=1返回null跳过探测', returnsNull, returnsNull, 'true');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-73', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014152000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
