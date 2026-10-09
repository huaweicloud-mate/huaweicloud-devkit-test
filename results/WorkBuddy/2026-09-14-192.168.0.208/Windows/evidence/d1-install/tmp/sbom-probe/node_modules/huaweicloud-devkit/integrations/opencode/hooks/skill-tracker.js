import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true';

const selfDir = dirname(fileURLToPath(import.meta.url));
const agentDir = join(selfDir, '..', 'huaweicloud-plugins', 'telemetry');
if (!existsSync(agentDir)) mkdirSync(agentDir, { recursive: true });

function debugLog(msg) {
  if (!DEBUG) return;
  try {
    appendFileSync(join(agentDir, 'plugin-debug.log'), `${new Date().toISOString()} ${msg}\n`);
  } catch (_) {}
}

function isHuaweiCloudSkill(name) {
  return typeof name === 'string' && name && /^huawei/i.test(name);
}

function writeEvent(key, value, extra = {}) {
  const data = JSON.stringify({ key, value, ...extra }) + '\n';
  try {
    appendFileSync(join(agentDir, 'hook-events.jsonl'), data);
  } catch (_) {}
}

// ── CLI command classification ────────────────────────────────

const HCLOUD_RE = /(?:^|[;&|]\s*)hcloud(?:\.exe)?\s+([^\s;&|"<>]+(?:\s+[^\s;&|"<>]+){0,3})/i;
const READ_VERBS = /\b(List|Show|Get|Describe|NovaList|NovaShow)\w*/i;
const WRITE_VERBS = new RegExp(
  '\\b(Create|Delete|Update|Modify|Remove|Revoke|Grant|Attach|Detach|' +
    'Enable|Disable|Set|Add|Bind|Unbind|Reset|Change|Activate|Deactivate|' +
    'Register|Unregister|Import|Export|Download|Upload|Copy|Move|Convert|' +
    'Migrate|Run|Execute|Invoke|Trigger|Deploy|Push|Start|Stop|Restart|' +
    'Reboot|Suspend|Resume|Terminate|Release|Allocate)\\w*',
  'i',
);

function classifyHcloud(text) {
  const m = HCLOUD_RE.exec(text);
  if (!m) return null;
  const raw = m[1].trim();
  if (!raw) return null;
  const cmdTokens = [];
  for (const t of raw.split(/\s+/)) {
    if (t.startsWith('--')) break;
    cmdTokens.push(t);
  }
  if (cmdTokens.length === 0) return null;
  const cmd = cmdTokens.join(' ');
  if (READ_VERBS.test(cmd)) return { key: 'cli:read', value: `hcloud ${cmd}` };
  if (WRITE_VERBS.test(cmd)) return { key: 'cli:write', value: `hcloud ${cmd}` };
  return { key: 'cli:invoke', value: `hcloud ${cmd}` };
}

// ── Shared hooks ──────────────────────────────────────────────

function getHooks() {
  return {
    'tool.execute.before': function (input, output) {
      try {
        debugLog(`HOOK tool.execute.before tool=${input?.tool}`);
        if (input.tool === 'skill') {
          const name = output?.args?.name;
          debugLog(`SKILL name=${name}`);
          if (isHuaweiCloudSkill(name)) {
            writeEvent('skill:retrieve', name);
            debugLog(`SKILL TRACKED: ${name}`);
          }
          return;
        }
        if (input.tool === 'bash') {
          const cmd = output?.args?.command || '';
          if (!cmd) return;
          const result = classifyHcloud(cmd);
          if (result) writeEvent(result.key, result.value, { capability: 'cli' });
        }
      } catch (error) {
        debugLog(`HOOK ERROR: ${error?.message || error}`);
      }
    },
    event: function ({ event }) {
      try {
        if (event?.type === 'message.part.updated') {
          const text = event?.properties?.part?.text;
          if (typeof text === 'string') {
            const m = text.match(/Base directory for this skill:\s*.*?skills[/\\]([a-z0-9-]+)/i);
            if (m && isHuaweiCloudSkill(m[1])) writeEvent('skill:retrieve', m[1]);
          }
        }
      } catch (error) {
        debugLog(`EVENT ERROR: ${error?.message || error}`);
      }
    },
  };
}

// ── Export: function-as-object serves both IDE and CLI ────────
//
//  IDE : plugin.default()      -> returns hooks
//  CLI : plugin.default.server -> returns hooks (via { id, server })

function plugin() {
  debugLog('=== PLUGIN EXPORT CALLED ===');
  return getHooks();
}

plugin.id = 'huaweicloud-skill-tracker';
plugin.server = async () => getHooks();

export default plugin;

debugLog('=== PLUGIN INIT DONE ===');
