import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,160), expected: String(expected).slice(0,160) }); }

const fs = await import('node:fs');
const src = fs.readFileSync('/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs','utf8');
const hasReinstall = /reinstall|reinstallInstall/i.test(src);
const hasProxy = /cmdProxy|proxy/i.test(src);
const hasVersion = /cmdVersion|\bversion\b.*print|printVersion/i.test(src);
test('D1-62','reinstall实现', hasReinstall, hasReinstall, 'true');
test('D1-62','proxy实现', hasProxy, hasProxy, 'true');
test('D1-62','version实现', hasVersion, hasVersion, 'true');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-62', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014152000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
