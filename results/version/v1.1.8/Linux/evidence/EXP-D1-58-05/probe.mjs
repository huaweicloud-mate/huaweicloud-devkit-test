import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,200), expected: String(expected).slice(0,200) }); }

const fs = await import('node:fs');
const src = fs.readFileSync('/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs','utf8');
const hasMcpServers = /mcpServers/.test(src);
const hasRemote = /remote|9528|Streamable/.test(src);
test('snippet','含 mcpServers 片段', hasMcpServers, hasMcpServers, 'true');
test('snippet','含 remote 提示', hasRemote, hasRemote, 'true');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'EXP-D1-58-05', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014153000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
