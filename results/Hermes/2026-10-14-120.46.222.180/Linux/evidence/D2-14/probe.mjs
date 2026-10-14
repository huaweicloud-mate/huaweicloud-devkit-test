import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D2-14', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-14', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-14-'));
const HOME = join(tmp, 'home');
const credDir = join(HOME, '.config', 'huaweicloud');
mkdirSync(credDir, { recursive: true });
const AKA = 'AKACCOUNTAAAAAAA01';
const SKA = 'SKACCOUNTAAAAAAA01';
const AKB = 'AKINTRUDERBBBBBB01';
const SKB = 'SKINTRUDERBBBBBB01';
writeFileSync(join(credDir, 'credentials.json'), JSON.stringify({ ak: AKA, sk: SKA, securityToken: '', region: 'cn-north-4' }), 'utf8');
writeFileSync(join(credDir, 'creds-import.json'), JSON.stringify({ ak: AKB, sk: SKB, region: 'cn-north-4' }), 'utf8');

process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_CONFIG_PATH = join(tmp, 'hcloud-config.json');
process.env.HCLOUD_OBS_CONFIG_PATH = join(tmp, 'obsconfig');
process.env.HCLOUD_BIN = '/bin/true';
process.env.HUAWEICLOUD_DEVKIT_HOME = join(tmp, 'dh');

const { callTool } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs');
const { readGlobalCredentials } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');

let sw = null, swErr = null;
try { sw = await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'persist' }); } catch (e) { swErr = e; }

test('D2-14', 'conflict-needs-confirmation', sw && sw.status === 'needs_confirmation', sw?.status, 'needs_confirmation', 'conflict detected, R2 arbitration raised', 'no needs_confirmation: ' + (swErr?.message ?? ''));
test('D2-14', 'confirm-token-issued', !!(sw && typeof sw.confirmToken === 'string' && sw.confirmToken.length > 0), sw?.confirmToken ? 'issued' : 'missing', 'non-empty', 'confirmToken issued', 'confirmToken missing');
test('D2-14', 'both-options', !!(sw && Array.isArray(sw.options) && sw.options.some((o) => o.key === 's1') && sw.options.some((o) => o.key === 'newImported')), sw?.options?.map((o) => o.key).join(','), 's1,newImported', 'both arbitration options present', 'options incomplete');

const token = sw?.confirmToken;

let confirm = null;
try { confirm = await callTool('huaweicloud_auth_confirm', { token, decision: 's1' }); } catch (e) { swErr = e; }
test('D2-14', 'confirm-s1-aborted', confirm && confirm.status === 'ok' && confirm.outcome === 'aborted', confirm ? `${confirm.status}/${confirm.outcome}` : 'err', 'ok/aborted', 'decision=s1 keeps S1 (aborted)', 'wrong outcome: ' + JSON.stringify(confirm));

const s1After = readGlobalCredentials();
test('D2-14', 's1-preserved', s1After && s1After.ak === AKA && s1After.sk === SKA, s1After?.ak, AKA, 'S1 truth preserved after abort', 'S1 overwritten with imported account');

let confirm2 = null;
try { confirm2 = await callTool('huaweicloud_auth_confirm', { token, decision: 's1' }); } catch (e) {}
test('D2-14', 'repeat-already-processed', confirm2 && confirm2.status === 'ok' && confirm2.outcome === 'already_processed', confirm2?.outcome, 'already_processed', 'repeat confirm flagged already_processed', 'repeat confirm not guarded');

let confirm3 = null;
try { confirm3 = await callTool('huaweicloud_auth_confirm', { token: 'bogus-token', decision: 's1' }); } catch (e) {}
test('D2-14', 'unknown-token-rejected', confirm3 && confirm3.status === 'rejected' && confirm3.code === 'CONFIRM_TOKEN_NOT_FOUND', confirm3?.code, 'CONFIRM_TOKEN_NOT_FOUND', 'unknown token rejected cleanly', 'unknown token mishandled');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);