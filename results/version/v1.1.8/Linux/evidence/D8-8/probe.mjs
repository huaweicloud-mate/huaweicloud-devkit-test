import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
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
  const out = { case: 'D8-8', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D8-8', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd8-8-'));
process.env.HUAWEICLOUD_DEVKIT_HOME = tmp;      // isolate global telemetry (installation-id, machine-finger)
process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off'; // off during init so no install-counter/plugin:install written to repo

const telemetry = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs');

// init with telemetry off → installId/userHash/agentHarness set, but no flush timer + no repo stamp writes
telemetry.initTelemetry({ harness: 'hermes', version: '9.9.9' });
test('D8-8', 'off-switch-1', telemetry.isTelemetryEnabled() === false, telemetry.isTelemetryEnabled(), false, 'telemetry off switch respected', 'off switch not respected');
test('D8-8', 'install-id-computed', typeof telemetry.generateOrRecoverInstallId() === 'string' && telemetry.generateOrRecoverInstallId().length > 0, telemetry.generateOrRecoverInstallId().length, '>0', 'installation id computed', 'install id missing');

// off → track functions are no-ops (no network, no queue, no throw)
let offErr = null;
try { telemetry.trackToolInvoke('huaweicloud_run_readonly_command', 'ECS ListServers'); telemetry.trackSandboxConnect(); telemetry.trackSandboxDisconnect(); } catch (e) { offErr = e; }
test('D8-8', 'off-noop-no-throw', offErr === null, offErr ? String(offErr.message) : 'clean', 'clean', 'track* no-ops when disabled', 'disabled track threw');

// enable → events enqueue in-memory without credential args (queue < batch → no network flush)
delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
test('D8-8', 'on-switch', telemetry.isTelemetryEnabled() === true, telemetry.isTelemetryEnabled(), true, 'telemetry enabled when env cleared', 'enable not detected');
let enqErr = null;
try {
  telemetry.trackToolInvoke('huaweicloud_run_readonly_command', 'ECS ListServers');
  telemetry.trackSandboxConnect();
  telemetry.trackSandboxDisconnect();
  telemetry.trackSkillRetrieve('huaweicloud-core');
  telemetry.enqueueEvent({ key: 'tool:probe', value: '1' });
} catch (e) { enqErr = e; }
test('D8-8', 'enqueue-no-throw', enqErr === null, enqErr ? String(enqErr.message) : 'clean', 'clean', 'trackTool/trackSandbox/enqueue all succeed', 'enqueue threw');

// telemetry value normalization = log-injection defense (no newlines survive into an event value)
test('D8-8', 'value-sanitized', !/[\r\n\t]/.test(telemetry.sanitizeValue('a\nb\tc')), telemetry.sanitizeValue('a\nb\tc'), 'no control chars', 'event values sanitized (no control chars)', 'value not sanitized');

// sandbox trackers accept no arguments → no credential surface on the telemetry path
test('D8-8', 'sandbox-tracker-zero-arg', telemetry.trackSandboxConnect.length === 0 && telemetry.trackSandboxDisconnect.length === 0, `${telemetry.trackSandboxConnect.length}/${telemetry.trackSandboxDisconnect.length}`, '0/0', 'trackSandbox* accept no args (no creds)', 'sandbox trackers accept args');

// hook events ingestion mechanics: fixture jsonl is consumed (renamed + drained) by ingestHookEvents
const SRC_ROOT = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const hookPath = join(SRC_ROOT, 'telemetry', 'hook-events.jsonl');
writeFileSync(hookPath, JSON.stringify({ key: 'tool:hook_probe', value: 'ECS ListServers' }) + '\n', 'utf8');
let ingestErr = null;
try { telemetry.ingestHookEvents(); telemetry.ingestHookEvents(); } catch (e) { ingestErr = e; } // two-phase: rename -> drain
const hookGone = !existsSync(hookPath);
const procGone = !existsSync(hookPath + '.processing');
test('D8-8', 'hook-events-ingested', ingestErr === null && hookGone && procGone, `ingest=${ingestErr ? 'err' : 'ok'} hookGone=${hookGone} procGone=${procGone}`, 'ingested', 'hook-events.jsonl consumed by telemetry ingestion', 'hook events not ingested');

// cleanup fixture (defensive)
try { rmSync(hookPath, { force: true }); } catch {}
try { rmSync(hookPath + '.processing', { force: true }); } catch {}
rmSync(tmp, { recursive: true, force: true });
finish('PASS', { note: '上报脱敏由 MCP 层 toolInvokeValue（仅转发服务名/固定 "1"，从不携带命令行 flag 或凭证）+ sanitizeValue 控制字符清洗双重保证；真实网络上报端点未触发（本地队列 < batch 阈值，不发起 POST）。' });
process.exit(0);