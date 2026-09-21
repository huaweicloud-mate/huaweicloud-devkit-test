import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core';
const hook = join(root, 'hooks', 'huaweicloud-safety.mjs');
const hooks = JSON.parse(readFileSync(join(root, 'hooks', 'hooks.json'), 'utf8'));
const results = [];

function run(name, tool_input, denied) {
  const r = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input }),
    encoding: 'utf8',
  });
  const out = r.stdout.trim();
  let parsed = null;
  try { parsed = out ? JSON.parse(out) : null; } catch {}
  const actual = parsed?.hookSpecificOutput?.permissionDecision ?? 'none';
  results.push({ name, pass: r.status === 0 && (denied ? actual === 'deny' : actual !== 'deny'), actual, expected: denied ? 'deny' : 'no deny' });
}

results.push({ name: 'hooks-json-node-registration', pass: JSON.stringify(hooks).includes('.mjs'), actual: JSON.stringify(hooks), expected: '.mjs registration' });
run('command credential read', { command: 'Get-Content ~/.hcloud/config.json' }, true);
run('cmd credential read', { cmd: 'cat ~/.config/huaweicloud/credentials.json' }, true);
run('script credential read', { script: 'printenv HUAWEICLOUD_ACCESS_KEY_ID' }, true);
run('args destructive command', { args: ['hcloud', 'ECS', 'DeleteServers', '--delete-all'] }, true);
run('safe command', { command: 'git status --short' }, false);

const failed = results.filter((r) => !r.pass);
const output = {
  status: failed.length ? 'FAIL' : 'PASS',
  why: failed.map((r) => `${r.name}: actual=${r.actual}; expected=${r.expected}`).join(' | '),
  executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14),
  results,
};
console.log(JSON.stringify(output, null, 2));
