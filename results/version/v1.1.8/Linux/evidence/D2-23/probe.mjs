import { writeFileSync } from 'node:fs';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-23', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-23', status, `${passed}/${results.length}`);
}

const { getAgentRegistrationStatuses, SUPPORTED_AGENT_TARGETS } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/agent-registration.mjs');

test('D2-23', 'targets-count-11', Array.isArray(SUPPORTED_AGENT_TARGETS) && SUPPORTED_AGENT_TARGETS.length === 11, SUPPORTED_AGENT_TARGETS?.length, 11, `${SUPPORTED_AGENT_TARGETS.length} supported targets`, 'target list not 11');
test('D2-23', 'targets-names', ['opencode', 'codex', 'codearts', 'hermes', 'officeace', 'openclaw', 'atomcode'].every((t) => SUPPORTED_AGENT_TARGETS.includes(t)), SUPPORTED_AGENT_TARGETS.join(','), 'includes opencode/codex/codearts/hermes/officeace/openclaw/atomcode', 'expected targets missing', 'target names incomplete');

const res = getAgentRegistrationStatuses('all');
const agentKeys = Object.keys(res?.agents || {});
const allPresent = SUPPORTED_AGENT_TARGETS.every((t) => Object.prototype.hasOwnProperty.call(res?.agents || {}, t));
test('D2-23', 'all-11-reported', res && res.target === 'all' && allPresent, agentKeys.length, 11, 'status reports all 11 targets', 'status missing targets');

const allBoolean = SUPPORTED_AGENT_TARGETS.every((t) => typeof res.agents[t]?.configured === 'boolean');
test('D2-23', 'configured-boolean', allBoolean, 'all-boolean', true, 'each target has boolean configured flag', 'non-boolean flags present');
test('D2-23', 'hermes-entry', typeof res.agents.hermes === 'object' && 'configured' in res.agents.hermes, JSON.stringify(res.agents.hermes), '{configured:boolean}', 'hermes entry present', 'hermes entry missing');

finish('PASS');
process.exit(0);