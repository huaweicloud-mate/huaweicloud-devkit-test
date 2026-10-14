import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,160), expected: String(expected).slice(0,160) }); }

const fs = await import('node:fs');
const mcp = fs.readFileSync('/home/testbot1/devkit-test/Hermes/hdk/mcp.json','utf8');
const has = /mcpServers|huaweicloud-devkit/i.test(mcp);
test('D1-8','mcp.json存在且含配置', has && mcp.length > 50, 'mcp.json ok', 'true');
const hasRemote = fs.existsSync('/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server-remote.mjs');
test('D1-8','remote transport实现', hasRemote, hasRemote, 'true');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'D1-8', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014152000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
