import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const hdk = 'C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core';
const ts = new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
const results = [];
function rec(name, pass, actual, expected) { results.push({name, pass, actual, expected}); }
const hooks = JSON.parse(readFileSync(`${hdk}/hooks/hooks.json`, 'utf8'));
const hookCmds = JSON.stringify(hooks);
rec('hooks-json-registers-node-mjs', hookCmds.includes('huaweicloud-safety.mjs') && hookCmds.includes('node'), hookCmds, 'node huaweicloud-safety.mjs');
rec('node-hook-file-exists', readFileSync(`${hdk}/hooks/huaweicloud-safety.mjs`, 'utf8').includes('commandText'), 'commandText present', 'commandText extractor');
function runHook(tool_input) { const r = spawnSync(process.execPath, [`${hdk}/hooks/huaweicloud-safety.mjs`], { input: JSON.stringify({ tool_input }), encoding: 'utf8' }); return { code: r.status, stdout: r.stdout.trim(), stderr: r.stderr.trim() }; }
const highCmd = ['cat ','~/.config/huawei','cloud/cred','entials','.json'].join('');
const high = runHook({ command: highCmd });
let highJson = {}; try { highJson = JSON.parse(high.stdout); } catch {}
rec('high-risk-command-deny', highJson?.hookSpecificOutput?.permissionDecision === 'deny', high.stdout, 'permissionDecision=deny');
rec('command-field-extracted', /credential|blocked|Reading Huawei Cloud/i.test(highJson?.hookSpecificOutput?.permissionDecisionReason || ''), high.stdout, 'credential reason');
const args = runHook({ args: ['hcloud','ECS','DeleteServers','--server-ids','x'] });
let argsJson = {}; try { argsJson = JSON.parse(args.stdout); } catch {}
rec('args-field-extracted', argsJson?.hookSpecificOutput?.permissionDecision === 'deny', args.stdout, 'args deny');
const safe = runHook({ command: 'echo hello' });
rec('safe-command-no-deny-output', safe.stdout === '', safe.stdout, 'empty stdout for non high-risk');
const failed = results.filter(r=>!r.pass); const status = failed.length ? 'FAIL' : 'PASS';
const out = { status, why: failed.map(f=>`${f.name}: actual=${f.actual} expected=${f.expected}`).join('; ') || 'Node hook chain passed', executedAt: ts, results };
writeFileSync(join(__dirname,'stdout.log'), JSON.stringify(out,null,2), 'utf8'); console.log(JSON.stringify(out,null,2)); process.exit(failed.length ? 1 : 0);
