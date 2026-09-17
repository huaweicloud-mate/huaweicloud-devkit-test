import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const hdkRoot = process.env.HDK_ROOT || 'C:/Users/Administrator/devkit-test/Codex/hdk';
const evidenceDir = process.env.HDK_EVIDENCE_DIR || path.resolve('realcloud-evidence');
const toolsUrl = pathToFileURL(path.join(hdkRoot, 'plugins/huaweicloud-core/src/tools.mjs')).href;
const { callTool } = await import(toolsUrl);

fs.mkdirSync(evidenceDir, { recursive: true });

function redact(value) {
  if (value == null) return value;
  if (typeof value === 'string') {
    return value
      .replace(/(AKIA|ASIA|HUAWEI)[A-Z0-9]{8,}/gi, '$1***REDACTED***')
      .replace(/"?(access[_-]?key|secret[_-]?key|security[_-]?token|token|password|ak|sk)"?\s*[:=]\s*"[^"\r\n]+"/gi, '"$1":"***REDACTED***"');
  }
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = /(^|[_-])(ak|sk|token|secret|password|accessKey|secretKey)($|[_-])/i.test(k)
        ? '***REDACTED***'
        : redact(v);
    }
    return out;
  }
  return value;
}

async function step(name, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    return { name, ok: true, elapsedMs: Date.now() - started, result: redact(result) };
  } catch (error) {
    return {
      name,
      ok: false,
      elapsedMs: Date.now() - started,
      error: redact({
        message: error?.message || String(error),
        code: error?.code,
        stack: error?.stack?.split('\n').slice(0, 4).join('\n'),
      }),
    };
  }
}

function readReadonlyCredentials() {
  const file = 'C:/Users/Administrator/.config/huaweicloud/credentials.readonly.json';
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ak = raw.ak || raw.accessKey || raw.access_key || raw.accessKeyId;
  const sk = raw.sk || raw.secretKey || raw.secret_key || raw.secretAccessKey;
  if (!ak || !sk) throw new Error('readonly credential file exists but AK/SK keys were not recognized');
  return { ak, sk };
}

const adminReadArgs = ['ECS', 'NovaListServers', '--cli-region=cn-north-4', '--cli-output=json'];
const obsReadArgs = ['OBS', 'ls'];
const ctsArgs = [
  'CTS',
  'ListTraces',
  '--cli-region=cn-north-4',
  '--trace_type=system',
  '--service_type=ECS',
  '--limit=10',
  '--cli-output=json',
];

const results = [];

results.push(await step('auth_status_before_sync', () => callTool('huaweicloud_auth_status', { target: 'codex' })));
results.push(await step('auth_sync_codex', () => callTool('huaweicloud_auth_sync', { target: 'codex' })));
results.push(await step('setup_obs_default', () => callTool('huaweicloud_setup_obs_config', { profile: 'default' })));
results.push(await step('sandbox_check_user', () => callTool('huaweicloud_sandbox_check_user', {})));
results.push(await step('check_cli', () => callTool('huaweicloud_check_cli', {})));
results.push(await step('list_operations_ecs', () => callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 60000 })));
results.push(await step('list_operations_obs', () => callTool('huaweicloud_list_operations', { service: 'OBS', timeoutMs: 60000 })));
results.push(await step('admin_run_readonly_ecs_list', () => callTool('huaweicloud_run_readonly_command', {
  args: adminReadArgs,
  timeoutMs: 60000,
  maxRetries: 1,
})));
results.push(await step('admin_run_readonly_obs_list', () => callTool('huaweicloud_run_readonly_command', {
  args: obsReadArgs,
  timeoutMs: 60000,
  maxRetries: 1,
})));

const savedEnv = {
  HW_ACCESS_KEY: process.env.HW_ACCESS_KEY,
  HW_SECRET_KEY: process.env.HW_SECRET_KEY,
  HW_SECURITY_TOKEN: process.env.HW_SECURITY_TOKEN,
};
results.push(await step('readonly_account_ecs_list', async () => {
  const creds = readReadonlyCredentials();
  process.env.HW_ACCESS_KEY = creds.ak;
  process.env.HW_SECRET_KEY = creds.sk;
  delete process.env.HW_SECURITY_TOKEN;
  return callTool('huaweicloud_run_readonly_command', {
    args: adminReadArgs,
    timeoutMs: 60000,
    maxRetries: 1,
  });
}));
for (const [key, value] of Object.entries(savedEnv)) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

results.push(await step('list_operations_cts', () => callTool('huaweicloud_list_operations', { service: 'CTS', timeoutMs: 60000 })));
results.push(await step('cts_list_traces_after_ecs_read', () => callTool('huaweicloud_run_readonly_command', {
  args: ctsArgs,
  timeoutMs: 60000,
  maxRetries: 1,
})));

const summary = {
  source: 'aligned local huaweicloud-devkit source',
  hdkRoot,
  evidenceDir,
  generatedAt: new Date().toISOString(),
  results,
};

fs.writeFileSync(path.join(evidenceDir, 'stdout.log'), JSON.stringify(redact(summary), null, 2) + '\n');
console.log(JSON.stringify({
  ok: results.every((r) => r.ok),
  total: results.length,
  passed: results.filter((r) => r.ok).length,
  failed: results.filter((r) => !r.ok).map((r) => r.name),
  evidence: path.join(evidenceDir, 'stdout.log'),
}, null, 2));
