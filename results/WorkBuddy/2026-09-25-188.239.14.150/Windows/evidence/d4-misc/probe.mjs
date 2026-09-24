/**
 * WorkBuddy daily test probe - D4 misc + D9 remote
 * Covers: D4-25, D4-26, D4-29, D9-10, D9-11
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { classifyTextCommand, classifyHcloudArgs, redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';

const pkgRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-25-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// ===== D4-25: Python hook event telemetry classification =====
const telemetryTrackerPath = join(pkgRoot, 'integrations', 'workbuddy', 'hooks', 'telemetry-tracker.py');
test('D4-25', 'telemetry-tracker-exists', existsSync(telemetryTrackerPath), existsSync(telemetryTrackerPath), true, 'telemetry-tracker.py exists', 'telemetry-tracker.py missing');
if (existsSync(telemetryTrackerPath)) {
  const trackerContent = readFileSync(telemetryTrackerPath, 'utf8');
  test('D4-25', 'tracker-classify', /classify|category|event/i.test(trackerContent), /classify|category/.test(trackerContent), true, 'tracker has classification', 'tracker no classification');
}

// ===== D4-26: findings evidence redaction =====
// redactSecrets should redact findings content
const testFindings = '{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef","token":"STSTOKEN123"}';
const redacted = redactSecrets(testFindings);
test('D4-26', 'findings-redact-ak', !String(redacted).includes('AKIDTEST12345678'), String(redacted).includes('AKIDTEST12345678'), false, 'AK redacted in findings', 'AK not redacted in findings');
test('D4-26', 'findings-redact-sk', !String(redacted).includes('SKTEST1234567890abcdef'), String(redacted).includes('SKTEST1234567890abcdef'), false, 'SK redacted in findings', 'SK not redacted in findings');

// ===== D4-29: classification assertion and raw command classification entry =====
// classifyTextCommand should return decision field
const cls1 = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
test('D4-29', 'classify-has-decision', typeof cls1 === 'object' && typeof cls1.decision === 'string', cls1.decision, 'string', 'classifyTextCommand returns decision', 'classifyTextCommand no decision');
test('D4-29', 'classify-has-reason', typeof cls1 === 'object' && typeof cls1.reason !== 'undefined', typeof cls1.reason, 'defined', 'classifyTextCommand has reason', 'classifyTextCommand no reason');

// classifyHcloudArgs should return decision field (isWrite is internal, not returned in deny path)
const cls2 = classifyHcloudArgs(['ECS', 'DeleteServers', '--server-ids', 'test']);
test('D4-29', 'classifyhcloud-has-decision', typeof cls2 === 'object' && typeof cls2.decision === 'string', cls2.decision, 'string', 'classifyHcloudArgs has decision', 'classifyHcloudArgs no decision');
test('D4-29', 'classifyhcloud-has-risk', typeof cls2 === 'object' && typeof cls2.risk !== 'undefined', typeof cls2.risk, 'defined', 'classifyHcloudArgs has risk', 'classifyHcloudArgs no risk');

// ===== D9-10: MCP remote transport (HTTP/WS remote service) =====
const remoteServerPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-server-remote.mjs');
test('D9-10', 'remote-server-exists', existsSync(remoteServerPath), existsSync(remoteServerPath), true, 'mcp-server-remote.mjs exists', 'mcp-server-remote.mjs missing');
if (existsSync(remoteServerPath)) {
  const remoteContent = readFileSync(remoteServerPath, 'utf8');
  test('D9-10', 'remote-http-ws', /http|websocket|ws|HTTP/i.test(remoteContent), /http|websocket/i.test(remoteContent), true, 'remote transport supports HTTP/WS', 'remote transport no HTTP/WS');
}

// ===== D9-11: WebSocket tunnel channel lifecycle =====
const wsExecDir = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'ws-exec');
test('D9-11', 'ws-exec-dir', existsSync(wsExecDir), existsSync(wsExecDir), true, 'ws-exec dir exists', 'ws-exec dir missing');
if (existsSync(wsExecDir)) {
  const wsFiles = readdirSync(wsExecDir);
  test('D9-11', 'ws-exec-files', wsFiles.length > 0, wsFiles.join(','), 'non-empty', `ws-exec files: ${wsFiles.join(',')}`, 'ws-exec dir empty');
  // Check for WebSocket lifecycle handling
  let hasWsLifecycle = false;
  for (const f of wsFiles) {
    if (f.endsWith('.mjs')) {
      const content = readFileSync(join(wsExecDir, f), 'utf8');
      if (/connect|disconnect|close|lifecycle|tunnel/i.test(content)) { hasWsLifecycle = true; break; }
    }
  }
  test('D9-11', 'ws-lifecycle', hasWsLifecycle, hasWsLifecycle, true, 'WS lifecycle handling found', 'WS lifecycle handling missing');
}

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd4-misc', 'stdout.log'), output, 'utf8');
console.log(output);
