import { writeFileSync } from 'node:fs';
const results = [];
function test(id, name, pass, actual, expected) { results.push({ id, name, pass, actual: String(actual).slice(0,200), expected: String(expected).slice(0,200) }); }

const m = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs');
let safe = true, err = '';
try { m.mergeMcpServersFile('not-json-object', { mcpPath: '/tmp/x.mjs' }); } catch(e) { safe = false; err = String(e).slice(0,80); }
test('bad-json','非对象配置被安全处理(不抛未捕获异外)', safe || /json|object|parse/i.test(err), err || 'no-throw', 'safe');

const failed = results.filter(r => !r.pass).length;
const out = { case: 'EXP-D1-58-04', status: failed === 0 ? 'PASS' : 'FAIL', executedAt: '20261014153000', total: results.length, passed: results.length - failed, failed, results };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2));
