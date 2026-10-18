// Real probe for D4-28
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const HOOK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs';
function runHook(toolInput) { return spawnSync('node', [HOOK], { encoding: 'utf8', timeout: 15000, shell: false, windowsHide: true, input: JSON.stringify({ tool_input: toolInput }) }); }
const r1 = runHook({ command: 'cat ~/.hcloud/credentials.json' });
const r2 = runHook({ cmd: 'cat ~/.hcloud/credentials.json' });
const r3 = runHook({ script: 'cat ~/.hcloud/credentials.json' });
const r4 = runHook({ args: ['cat', '~/.hcloud/credentials.json'] });
const r5 = runHook({ command: 'hcloud ECS listServers --region cn-north-4' });
const parseOut = (r) => { try { return JSON.parse(r.stdout || '{}'); } catch { return {}; } };
const o1 = parseOut(r1), o2 = parseOut(r2), o3 = parseOut(r3), o4 = parseOut(r4), o5 = parseOut(r5);
const get = (o) => o?.hookSpecificOutput?.permissionDecision;
const allDeny = get(o1) === 'deny' && get(o2) === 'deny' && get(o3) === 'deny' && get(o4) === 'deny';
const noDenySafe = !get(o5) || get(o5) !== 'deny';
const status = (allDeny && noDenySafe) ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-28', status, why: 'allDeny=' + allDeny + ' noDenySafe=' + noDenySafe, executedAt: '20261019050816', result: { r1: get(o1), r2: get(o2), r3: get(o3), r4: get(o4), r5: get(o5) || 'none' } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

