import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,200), expected: String(expected).slice(0,200) }); }

const m = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs');
const r = m.mergeMcpServersFile({}, { mcpPath: '/tmp/hdk-mcp.mjs' });
const cfg = r && r.config ? r.config : r;
const merged = cfg && cfg.mcpServers && cfg.mcpServers['huaweicloud-devkit'];
test('merge','生成mcpServers.huaweicloud-devkit', !!merged, JSON.stringify(merged).slice(0,100), '含 huaweicloud-devkit');
test('merge','entry含command', merged && merged.command === 'node', String(merged && merged.command), 'node');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'EXP-D1-58-02', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014153000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
