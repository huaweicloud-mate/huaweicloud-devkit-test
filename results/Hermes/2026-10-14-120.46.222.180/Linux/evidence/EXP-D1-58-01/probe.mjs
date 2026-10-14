import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,200), expected: String(expected).slice(0,200) }); }

const fs = await import('node:fs');
const src = fs.readFileSync('/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs','utf8');
const hasClaude = /\.claude\.json|claude\.json/.test(src);
const hasCursor = /\.cursor|cursor.*mcp/.test(src);
test('detect','claude.json探测逻辑存在', hasClaude, hasClaude, 'true');
test('detect','cursor探测逻辑存在', hasCursor, hasCursor, 'true');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'EXP-D1-58-01', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014153000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
