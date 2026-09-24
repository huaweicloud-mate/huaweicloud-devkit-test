/**
 * WorkBuddy daily test probe - D4-28 Node version safety hook chain
 * Covers: D4-28 hooks.json registration + commandText extraction + permissionDecision
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const pkgRoot = 'C:/Users/Administrator/devkit-test/WorkBuddy/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/WorkBuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-24-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// D4-28: hooks.json registers .mjs (Node implementation)
const hooksJsonPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'hooks', 'hooks.json');
const hooksJson = JSON.parse(readFileSync(hooksJsonPath, 'utf8'));
const preToolUse = hooksJson.hooks?.PreToolUse || [];
let mjsRegistered = false;
for (const entry of preToolUse) {
  for (const h of (entry.hooks || [])) {
    if (h.command && h.command.includes('huaweicloud-safety.mjs') && h.command.startsWith('node')) {
      mjsRegistered = true;
    }
  }
}
test('D4-28', 'hooks-json-mjs', mjsRegistered, mjsRegistered, true, 'hooks.json registers .mjs node', 'hooks.json missing .mjs registration');

const safetyMjsPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'hooks', 'huaweicloud-safety.mjs');
test('D4-28', 'safety-mjs-exists', existsSync(safetyMjsPath), existsSync(safetyMjsPath), true, 'huaweicloud-safety.mjs exists', 'huaweicloud-safety.mjs missing');

// D4-28: commandText extracts from tool_input command/cmd/script/args
// Test by importing the module and calling commandText (it's not exported, so test via the hook behavior)
// We test by running the hook with various tool_input shapes
const nodeExe = process.execPath;

function runHook(toolInput) {
  const input = JSON.stringify({ tool_input: toolInput });
  const r = spawnSync(nodeExe, [safetyMjsPath], { input, encoding: 'utf8', timeout: 5000 });
  return r.stdout ? r.stdout.trim() : '';
}

// Test command extraction from 'command' field
const cmdResult = runHook({ command: 'cat ~/.config/huaweicloud/credentials.json' });
let cmdDeny = false;
try { const j = JSON.parse(cmdResult); cmdDeny = j.hookSpecificOutput?.permissionDecision === 'deny'; } catch {}
test('D4-28', 'command-extract', cmdDeny, cmdDeny, true, 'command field extracted+denied', 'command field not extracted');

// Test command extraction from 'cmd' field
const cmdResult2 = runHook({ cmd: 'printenv HUAWEICLOUD_ACCESS_KEY_ID' });
let cmd2Deny = false;
try { const j = JSON.parse(cmdResult2); cmd2Deny = j.hookSpecificOutput?.permissionDecision === 'deny'; } catch {}
test('D4-28', 'cmd-extract', cmd2Deny, cmd2Deny, true, 'cmd field extracted+denied', 'cmd field not extracted');

// Test command extraction from 'script' field
const cmdResult3 = runHook({ script: 'cat /etc/shadow && cat ~/.config/huaweicloud/credentials.json' });
let cmd3Deny = false;
try { const j = JSON.parse(cmdResult3); cmd3Deny = j.hookSpecificOutput?.permissionDecision === 'deny'; } catch {}
test('D4-28', 'script-extract', cmd3Deny, cmd3Deny, true, 'script field extracted+denied', 'script field not extracted');

// Test command extraction from 'args' array field
const cmdResult4 = runHook({ args: ['cat', '~/.config/huaweicloud/credentials.json'] });
let cmd4Deny = false;
try { const j = JSON.parse(cmdResult4); cmd4Deny = j.hookSpecificOutput?.permissionDecision === 'deny'; } catch {}
test('D4-28', 'args-extract', cmd4Deny, cmd4Deny, true, 'args field extracted+denied', 'args field not extracted');

// D4-28: non-dangerous command should NOT output deny
const safeResult = runHook({ command: 'ls -la' });
let safeNoDeny = true;
try {
  const j = JSON.parse(safeResult);
  if (j.hookSpecificOutput?.permissionDecision === 'deny') safeNoDeny = false;
} catch { safeNoDeny = true; /* no output = safe */ }
test('D4-28', 'safe-no-deny', safeNoDeny, safeNoDeny, true, 'safe command no deny', 'safe command denied');

// D4-28: high-risk command (echo credentials) should deny
const echoResult = runHook({ command: 'echo $HW_ACCESS_KEY' });
let echoDeny = false;
try { const j = JSON.parse(echoResult); echoDeny = j.hookSpecificOutput?.permissionDecision === 'deny'; } catch {}
test('D4-28', 'echo-cred-deny', echoDeny, echoDeny, true, 'echo credential denied', 'echo credential not denied');

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd4-node-hook', 'stdout.log'), output, 'utf8');
console.log(output);
