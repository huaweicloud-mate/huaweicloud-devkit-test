import { writeFileSync } from 'node:fs';
import { resolveSkipFilePath, skipFilePath, fallbackSkipFilePath } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-48 多 Agent 路径与多进程隔离：每个 agent/session 有独立 skip 文件路径，互不串用。
const pa = resolveSkipFilePath('agent-A');
const pb = resolveSkipFilePath('agent-B');
test('D1-48-1', 'distinct-per-session', typeof pa === 'string' && pa !== pb, `${pa} <-> ${pb}`, 'different paths');
test('D1-48-2', 'suffix-per-session', pa.endsWith('.agent-B') === false && pa.endsWith('.agent-A') === true && pb.endsWith('.agent-B') === true, `${pa} | ${pb}`, 'ends .agent-A/.agent-B');

const dflt = resolveSkipFilePath(null);
const dflt2 = resolveSkipFilePath('default');
const dflt3 = resolveSkipFilePath('stdin');
test('D1-48-3', 'default-null-stdin-same-file', dflt === dflt2 && dflt2 === dflt3, `${dflt} | ${dflt2} | ${dflt3}`, 'same path');

const sanitized = resolveSkipFilePath('a b/c$d');
test('D1-48-4', 'session-id-sanitized', sanitized.endsWith('.a_b_c_d') === true, sanitized, 'ends .a_b_c_d');

test('D1-48-5', 'skip-and-fallback-paths-are-strings', typeof skipFilePath() === 'string' && typeof fallbackSkipFilePath() === 'string', 'strings', 'strings');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-48', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);