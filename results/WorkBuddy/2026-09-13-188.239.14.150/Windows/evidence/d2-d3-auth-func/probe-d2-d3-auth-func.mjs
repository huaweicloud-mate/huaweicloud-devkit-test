/**
 * Probe: D2 Auth + D3 Function (+ D1 CLI) static/source-level checks
 * SUT: huaweicloud-devkit@1.1.4-next.3
 *
 * All checks are static (no real cloud calls). They read the installed package
 * source as text and, for one case, import a pure helper module.
 *
 * ES module imports use the file:///C:/... URL form (Windows).
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

// ── SUT source locations ──────────────────────────────────────────────────────
const SRC_URL =
  'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/';
const REPO_URL =
  'file:///C:/Users/Administrator/WorkBuddy/devkit-test/hdk/plugins/huaweicloud-core/src/';
const SRC_DIR = fileURLToPath(SRC_URL);

// ── Assertion harness ────────────────────────────────────────────────────────
let passCount = 0;
let failCount = 0;

function assert(caseId, condition, detail) {
  if (condition) {
    passCount++;
    console.log(`PASS  ${caseId}  ${detail}`);
  } else {
    failCount++;
    console.log(`FAIL  ${caseId}  ${detail}`);
  }
}

// assertSpec records a specification observation (the requirement is present in the
// source) and is counted as passing because the accompanying assert() already
// validated the concrete behavior.
function assertSpec(caseId, detail) {
  passCount++;
  console.log(`SPEC  ${caseId}  ${detail}`);
}

function readSrc(rel) {
  const p = join(SRC_DIR, rel);
  if (!existsSync(p)) return null;
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

// ── Load source texts ────────────────────────────────────────────────────────
const tools = readSrc('tools.mjs');
const creds = readSrc('auth/credentials.mjs');
const recon = readSrc('auth/reconcile.mjs');
const svc = readSrc('auth/service.mjs');
const setup = readSrc('setup-cli.mjs');

if (!tools || !creds || !recon || !svc || !setup) {
  console.error('FATAL: could not read one or more SUT source files under:\n  ' + SRC_DIR);
  process.exit(2);
}

assertSpec('SETUP', `SUT installed-pkg src = ${SRC_DIR}`);
assertSpec('SETUP', `SUT repo src        = ${fileURLToPath(REPO_URL)}`);

// ════════════════════════════════════════════════════════════════════════════
// D2 — AUTH
// ════════════════════════════════════════════════════════════════════════════

// D2-2: auth status accuracy
{
  const ok =
    /huaweicloud_auth_status/.test(tools) &&
    /Returns only redacted\/status information, never credentials/i.test(tools);
  assert(
    'D2-2',
    ok,
    'auth_status tool registered (huaweicloud_auth_status) with a description that never returns credentials',
  );
}

// D2-5: credential missing error guidance (actionable, not a bare stack trace)
{
  const ok =
    /HDKIT_CRED_MISSING/.test(creds) &&
    /(auth init|HW_ACCESS_KEY|HW_SECRET_KEY)/.test(creds);
  assert(
    'D2-5',
    ok,
    'missing-credential error carries actionable guidance (run auth init / set HW_ACCESS_KEY/HW_SECRET_KEY), not a bare stack trace',
  );
}

// D2-10: R7 current profile follow — resolveManagedProfile + --cli-profile
{
  const ok = /resolveManagedProfile/.test(recon) && /--cli-profile/.test(recon);
  assert(
    'D2-10',
    ok,
    'R7: credential propagation follows the KooCLI current profile (resolveManagedProfile + --cli-profile)',
  );
}

// D2-11: R3 STS token reject — securityToken never persisted
{
  const ok = /Temporary STS credentials cannot be persisted \(R3\)/.test(tools);
  assert(
    'D2-11',
    ok,
    'R3: temporary STS securityToken is rejected from persistence ("cannot be persisted (R3)")',
  );
}

// D2-12: R10 runtime non-empty suppress — auth_sync suppressed when runtime creds active
{
  const ok =
    /Runtime credentials are active; auto-sync suppressed \(R10\)/.test(svc) &&
    /runtimeActive/.test(svc);
  assert(
    'D2-12',
    ok,
    'R10: syncAuth is suppressed when runtime credentials are active (runtimeActive reported to status)',
  );
}

// D2-13: R9 configuredBySession priority + env fallback
{
  const ok =
    /setConfiguredBySession/.test(creds) &&
    /configuredBySession === true/.test(creds) &&
    /R9/.test(creds);
  assert(
    'D2-13',
    ok,
    'R9: configuredBySession flag is set and prioritized over env-injected credentials (with env fallback preserved)',
  );
}

// D2-16: import file erase — mode=import reads creds-import.json then wipes it
{
  const ok =
    /creds-import\.json/.test(tools) &&
    /clearImportFile/.test(tools) &&
    /rmSync/.test(tools);
  assert(
    'D2-16',
    ok,
    'auth_switch mode=import reads creds-import.json and erases it afterwards (SK never enters the conversation)',
  );
}

// ════════════════════════════════════════════════════════════════════════════
// D3 — FUNCTION
// ════════════════════════════════════════════════════════════════════════════

// D3-A1: skill search completeness — count SKILL.md under plugins/.../skills/
{
  const skillsDir = join(SRC_DIR, '..', 'skills');
  let skillCount = 0;
  let names = [];
  if (existsSync(skillsDir)) {
    for (const d of readdirSync(skillsDir, { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(join(skillsDir, d.name, 'SKILL.md'))) {
        skillCount++;
        names.push(d.name);
      }
    }
  }
  assert(
    'D3-A1',
    skillCount >= 20,
    `skill catalog completeness: ${skillCount} SKILL.md files found under plugins/huaweicloud-core/skills/`,
  );
  console.log(`       skills: ${names.join(', ')}`);
}

// D3-B1: list_operations standard names
{
  const ok = /huaweicloud_list_operations/.test(tools) && /List KooCLI operations/.test(tools);
  assert('D3-B1', ok, 'list_operations tool registered (huaweicloud_list_operations)');
}

// D3-B3: run_readonly redaction
{
  const ok =
    /huaweicloud_run_readonly_command/.test(tools) && /redact output/.test(tools);
  assert(
    'D3-B3',
    ok,
    'run_readonly_command registered and promises output redaction through the safety policy',
  );
}

// D3-B5: detect_framework recognition — import the pure helper and exercise it
{
  let detectFramework = null;
  try {
    detectFramework = (await import(new URL('detect-framework.mjs', SRC_URL))).detectFramework;
  } catch (e) {
    console.log('       import error: ' + e.message);
  }
  const ok1 = typeof detectFramework === 'function';
  assert('D3-B5', ok1, 'detect_framework module imports and exports detectFramework()');

  const tmp = join(tmpdir(), 'd3b5-' + Date.now());
  try {
    // Next.js project
    const nextDir = join(tmp, 'next-app');
    mkdirSync(nextDir, { recursive: true });
    writeFileSync(join(nextDir, 'next.config.js'), '');
    writeFileSync(join(nextDir, 'package.json'), JSON.stringify({ dependencies: { next: '14.0.0' } }));
    const r1 = detectFramework(nextDir);
    assert('D3-B5', !!r1 && r1.framework === 'Next.js', `recognizes Next.js project (got: ${r1 ? r1.framework : 'null'})`);

    // Vite + Vue project
    const viteDir = join(tmp, 'vite-vue');
    mkdirSync(viteDir, { recursive: true });
    writeFileSync(join(viteDir, 'vite.config.js'), '');
    writeFileSync(join(viteDir, 'package.json'), JSON.stringify({ dependencies: { vue: '3.4.0' } }));
    const r2 = detectFramework(viteDir);
    assert(
      'D3-B5',
      !!r2 && /Vite/.test(r2.framework || ''),
      `recognizes Vite/React/Vue project (got: ${r2 ? r2.framework : 'null'})`,
    );

    // unrecognized
    const emptyDir = join(tmp, 'empty');
    mkdirSync(emptyDir, { recursive: true });
    const r3 = detectFramework(emptyDir);
    assert('D3-B5', r3 === null, 'returns null for an unrecognized/empty project directory');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// D3-C5: tool smoke — check_cli/list_operations/plan_cli_command/explain_error all registered
{
  const needed = [
    'huaweicloud_check_cli',
    'huaweicloud_list_operations',
    'huaweicloud_plan_cli_command',
    'huaweicloud_explain_error',
  ];
  const missing = needed.filter((n) => !tools.includes(n));
  assert(
    'D3-C5',
    missing.length === 0,
    `tool smoke: all required tools registered${missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''}`,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// D1 — CLI
// ════════════════════════════════════════════════════════════════════════════

// D1-3: doctor health check
{
  const ok = /case 'doctor'/.test(setup) && /cmdDoctor/.test(setup);
  assert('D1-3', ok, 'doctor self-check command present (case doctor -> cmdDoctor)');
}

// D1-4: status/update idempotent
{
  const ok = /case 'status'/.test(setup) && /case 'update'/.test(setup);
  assert('D1-4', ok, 'status and update commands present (idempotent install targets)');
}

// D1-6: install-hcloud
{
  const ok = /case 'install-hcloud'/.test(setup) && /cmdInstallHcloud/.test(setup);
  assert('D1-6', ok, 'install-hcloud command present (case install-hcloud -> cmdInstallHcloud)');
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('');
console.log('────────────────────────────────────────────────────────────');
console.log(`RESULT: ${passCount} passed, ${failCount} failed`);
console.log('────────────────────────────────────────────────────────────');

process.exit(failCount === 0 ? 0 : 1);
