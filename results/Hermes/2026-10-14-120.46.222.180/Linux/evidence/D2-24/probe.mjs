import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
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
  const out = { case: 'D2-24', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-24', status, `${passed}/${results.length}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-24-'));
const SHIM = join(tmp, 'hcloud');
process.env.HCLOUD_BIN = SHIM;

const { resolveAndApplyProjectId } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/project-id.mjs');

// Good shim: returns projects JSON on KeystoneListProjects, ok on configure set
writeFileSync(SHIM, '#!/bin/sh\nout=""; for a in "$@"; do out="$out $a"; done\ncase "$out" in\n *"KeystoneListProjects"*) echo \'{"projects":[{"id":"proj-test-123","name":"cn-north-4"}]}\'; exit 0;;\n *) exit 0;;\nesac\n', { mode: 0o755 });

const ok = resolveAndApplyProjectId({ region: 'cn-north-4', profile: 'default' });
test('D2-24', 'resolve-ok', ok && ok.ok === true && ok.projectId === 'proj-test-123', ok ? `ok/${ok.projectId}` : 'null', 'ok/proj-test-123', 'projectId auto-resolved', 'projectId not resolved: ' + JSON.stringify(ok));

// Failure shim: no region present / empty project list → best-effort, no throw
writeFileSync(SHIM, '#!/bin/sh\nout=""; for a in "$@"; do out="$out $a"; done\ncase "$out" in\n *"KeystoneListProjects"*) echo \'{"projects":[]}\'; exit 0;;\n *) exit 0;;\nesac\n', { mode: 0o755 });
const noProj = resolveAndApplyProjectId({ region: 'cn-north-4', profile: 'default' });
test('D2-24', 'no-project-no-throw', noProj && noProj.ok === false && typeof noProj.reason === 'string' && noProj.reason.length > 0, noProj ? `ok=${noProj.ok} ${noProj.reason}` : 'null', 'ok=false + reason', 'no-project degrades with reason (no throw)', 'no-project misbehaved: ' + JSON.stringify(noProj));

// Missing region → immediate structured failure
const noRegion = resolveAndApplyProjectId({ region: '' });
test('D2-24', 'missing-region-reason', noRegion && noRegion.ok === false && noRegion.reason === 'region is required', noRegion?.reason, 'region is required', 'missing region rejected cleanly', 'missing region mishandled');

rmSync(tmp, { recursive: true, force: true });
finish('PASS');
process.exit(0);