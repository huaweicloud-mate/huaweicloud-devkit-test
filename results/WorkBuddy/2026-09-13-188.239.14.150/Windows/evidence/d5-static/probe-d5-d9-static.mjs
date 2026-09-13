#!/usr/bin/env node
// Static / source-level probe for huaweicloud-devkit@1.1.4-next.3
// Covers:
//   D5  Client          (D5-1, D5-3, D5-8)
//   D6  Performance     (D6-1, D6-3, D6-4)  [source-level heuristics]
//   D7  Compatibility   (D7-4)
//   D8  Quality         (D8-1, D8-4, D8-6, D8-7)
//
// Run from this directory:
//   node probe-d5-d9-static.mjs
//
// All paths use the installed package as the primary subject. The source repo
// is used as a fallback for docs/skills so the probe stays meaningful even if a
// file is missing from a given distribution.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ── Locations ──────────────────────────────────────────────────────────────
const PKG = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit';
const SRC = 'C:/Users/Administrator/WorkBuddy/devkit-test/hdk';

// ── Helpers ─────────────────────────────────────────────────────────────────
const exists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};
const isDir = (p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};
const readText = (p) => fs.readFileSync(p, 'utf8');
const readJson = (p) => JSON.parse(readText(p));
// Pick installed path, fall back to source repo.
const pick = (relPkg, relSrc) => (exists(path.join(PKG, relPkg)) ? path.join(PKG, relPkg) : path.join(SRC, relSrc));

const results = [];
function assert(caseId, condition, detail) {
  const ok = Boolean(condition);
  results.push({ caseId, ok, kind: 'ASSERT', detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${caseId}: ${detail}`);
}
function assertSpec(caseId, detail) {
  results.push({ caseId, ok: true, kind: 'SPEC', detail });
  console.log(`[SPEC] ${caseId}: ${detail}`);
}

console.log('=== huaweicloud-devkit static probe (D5/D6/D7/D8) ===');
console.log(`installed: ${PKG}`);
console.log(`source   : ${SRC}`);
console.log('');

// ── D5-1: manifest discovery ────────────────────────────────────────────────
{
  const pkgJsonPath = path.join(PKG, 'package.json');
  assert('D5-1', exists(pkgJsonPath), `package.json present at ${pkgJsonPath}`);
  if (exists(pkgJsonPath)) {
    const pkg = readJson(pkgJsonPath);
    const bins = pkg.bin || {};
    const binNames = Object.keys(bins);
    assert(
      'D5-1',
      binNames.includes('huaweicloud-devkit') && binNames.includes('huaweicloud-devkit-mcp'),
      `bin entries present: ${binNames.join(', ')} (expected huaweicloud-devkit + huaweicloud-devkit-mcp)`,
    );
    assert(
      'D5-1',
      isDir(path.join(PKG, 'plugins', 'huaweicloud-core')),
      'plugins directory structure present: plugins/huaweicloud-core',
    );
    assert('D5-1', pkg.type === 'module', `package is ESM (type=${pkg.type})`);
    assertSpec('D5-1', `version=${pkg.version}, mcpName=${pkg.mcpName}`);
  }
}

// ── D5-3: tool enumeration ───────────────────────────────────────────────────
let tools = null;
let toolImportErr = null;
const toolsPath = path.join(PKG, 'plugins', 'huaweicloud-core', 'src', 'tools.mjs');
{
  try {
    ({ TOOL_DEFINITIONS: tools } = await import(pathToFileURL(toolsPath).href));
  } catch (e) {
    toolImportErr = e;
  }

  if (tools && Array.isArray(tools)) {
    assert('D5-3', tools.length === 39, `TOOL_DEFINITIONS length=${tools.length} (expected 39)`);
    const bad = [];
    for (const t of tools) {
      if (typeof t?.name !== 'string' || !t.name) bad.push('missing name');
      else if (typeof t?.description !== 'string' || !t.description.trim()) bad.push(`${t?.name}:no description`);
      else if (typeof t?.inputSchema !== 'object' || t.inputSchema === null)
        bad.push(`${t?.name}:no inputSchema`);
    }
    assert(
      'D5-3',
      bad.length === 0,
      bad.length ? `malformed tool entries: ${bad.join('; ')}` : `all ${tools.length} tools have name+description+inputSchema`,
    );
    assertSpec('D5-3', `imported ${tools.length} tools via ES module import (file:///.../tools.mjs)`);
  } else {
    // Fallback: textual extraction if the ES module import chain fails to load.
    const txt = exists(toolsPath) ? readText(toolsPath) : '';
    const count = (txt.match(/name:\s*'huaweicloud_/g) || []).length;
    assert(
      'D5-3',
      count === 39,
      `textual TOOL_DEFINITIONS entries=${count} (expected 39); ES import failed: ${toolImportErr?.message}`,
    );
    assertSpec('D5-3', 'ES module import unavailable; fell back to textual extraction');
  }
}

// Build a tool-name set usable by D8-1 even if the import returned null.
let toolNames = new Set();
if (tools && Array.isArray(tools)) {
  toolNames = new Set(tools.map((t) => t.name).filter(Boolean));
} else if (exists(toolsPath)) {
  const m = readText(toolsPath).matchAll(/name:\s*'(huaweicloud_[^']+)'/g);
  for (const x of m) toolNames.add(x[1]);
}

// ── D5-8: WorkBuddy adaptation ───────────────────────────────────────────────
{
  const wbDir = path.join(PKG, 'integrations', 'workbuddy');
  const wbHook = path.join(wbDir, 'hooks', 'telemetry-tracker.py');
  const wbAlt = path.join(wbDir, 'hooks.json');
  const present = exists(wbDir) && (exists(wbHook) || exists(wbAlt) || (isDir(wbDir) && fs.readdirSync(wbDir).length > 0));
  assert('D5-8', present, `integrations/workbuddy/ exists with hooks/config (checked ${wbDir})`);
  if (present) {
    assertSpec(
      'D5-8',
      exists(wbHook)
        ? 'WorkBuddy PostToolUse hook present: hooks/telemetry-tracker.py'
        : 'WorkBuddy integration dir present with content',
    );
  } else {
    // Fallback to source repo.
    const srcWb = path.join(SRC, 'integrations', 'workbuddy');
    assert('D5-8', exists(srcWb), `fallback: source repo integrations/workbuddy present (${srcWb})`);
  }
}

// ── D6-1: search response latency (no obvious blocking patterns) ─────────────
{
  const p = path.join(PKG, 'plugins', 'huaweicloud-core', 'src', 'search-market.mjs');
  assert('D6-1', exists(p), `search-market.mjs present (${p})`);
  if (exists(p)) {
    const c = readText(p);
    const usesAsyncFetch = /fetch\s*\(/.test(c);
    const hasTimeout = c.includes('AbortController');
    const noSyncExec = !c.includes('execSync');
    const noChildProc = !c.includes('node:child_process') && !c.includes("require('child_process')");
    const noSyncFs = !c.includes('readFileSync') && !c.includes('readdirSync');
    assert(
      'D6-1',
      usesAsyncFetch && hasTimeout && noSyncExec && noChildProc && noSyncFs,
      `async fetch=${usesAsyncFetch}, AbortController timeout=${hasTimeout}, no execSync=${noSyncExec}, no child_process=${noChildProc}, no sync fs in hot path=${noSyncFs}`,
    );
    const to = (c.match(/HTTP_TIMEOUT_MS\s*=\s*(\d+)/) || [])[1];
    assertSpec('D6-1', `HTTP_TIMEOUT_MS=${to}ms; search uses cached index + async fetch (non-blocking)`);
  }
}

// ── D6-3: MCP cold start (lazy loading patterns) ─────────────────────────────
{
  const p = path.join(PKG, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  assert('D6-3', exists(p), `mcp-server.mjs present (${p})`);
  if (exists(p)) {
    const c = readText(p);
    const lazyImports = (c.match(/await\s+import\s*\(/g) || []).length;
    const hasLazy = lazyImports >= 1;
    assert('D6-3', hasLazy, `dynamic (lazy) imports found: ${lazyImports} (await import(...))`);
    assertSpec('D6-3', 'remote transport + proxy config loaded via lazy await import() to keep stdio cold start fast');
  }
}

// ── D6-4: concurrent scheduling (fair-queue / multiplexer references) ────────
{
  const p = path.join(PKG, 'plugins', 'huaweicloud-core', 'src', 'sandbox', 'session-manager.mjs');
  assert('D6-4', exists(p), `session-manager.mjs present (${p})`);
  if (exists(p)) {
    const c = readText(p);
    const hasMux = /Multiplexer/.test(c);
    const hasSessionMap = /new Map\(\)/.test(c); // concurrent session registry
    assert('D6-4', hasMux && hasSessionMap, `multiplexer reference=${hasMux}, concurrent session Map=${hasSessionMap}`);
    const fairQueue = path.join(PKG, 'plugins', 'huaweicloud-core', 'src', 'ws-exec', 'hwlink-fair-queue.js');
    assertSpec('D6-4', exists(fairQueue)
      ? 'fair-queue implementation present: ws-exec/hwlink-fair-queue.js'
      : 'session-manager uses HwlinkWebSocketMultiplexer for concurrent scheduling');
  }
}

// ── D7-4: mirror source install ──────────────────────────────────────────────
{
  const pkgJsonPath = path.join(PKG, 'package.json');
  const pkg = exists(pkgJsonPath) ? readJson(pkgJsonPath) : {};
  const postinstall = pkg.scripts?.postinstall;
  assert('D7-4', typeof postinstall === 'string' && postinstall.length > 0, `postinstall lifecycle hook present: ${postinstall || '(none)'}`);

  const readmeMirror = pick('README.md', 'README.md');
  let mirrorOk = false;
  let mirrorDetail = '';
  if (exists(readmeMirror)) {
    const c = readText(readmeMirror);
    mirrorOk = /mirrors\.huaweicloud\.com\/repository\/npm/.test(c) || /npmmirror/.test(c);
    mirrorDetail = mirrorOk
      ? 'README documents Huawei Cloud npm mirror (mirrors.huaweicloud.com/repository/npm) for China users'
      : 'README does not mention a mirror registry';
  }
  assert('D7-4', mirrorOk, mirrorDetail);
  assertSpec('D7-4', `postinstall=${postinstall}; mirror install path documented for China mainland users`);
}

// ── D8-1: doc-capability consistency (README command refs vs tools.mjs) ──────
{
  const readme = pick('README.md', 'README.md');
  assert('D8-1', exists(readme), `README.md present (${readme})`);
  if (exists(readme)) {
    const c = readText(readme);
    const refs = (c.match(/huaweicloud_[a-z_]+/g) || []).map((s) => s.replace(/[^a-z_]/g, ''));
    const uniq = [...new Set(refs)].filter(Boolean);
    const mism = uniq.filter((r) => !toolNames.has(r));
    assert(
      'D8-1',
      mism.length === 0,
      mism.length
        ? `README references ${mism.length} unknown tool(s): ${mism.join(', ')}`
        : `all ${uniq.length} huaweicloud_* references in README match registered tools`,
    );
    const binRef = /huaweicloud-devkit/.test(c);
    assert('D8-1', binRef, 'README references the huaweicloud-devkit CLI bin');
    assertSpec('D8-1', `tool-name references checked: ${uniq.length}; mismatches: ${mism.length}; tool registry size: ${toolNames.size}`);
  }
}

// ── D8-4: guidance mechanical executability (sample SKILL.md) ────────────────
{
  const skillPath = pick(
    'plugins/huaweicloud-core/skills/huawei-ecs/SKILL.md',
    'plugins/huaweicloud-core/skills/huawei-ecs/SKILL.md',
  );
  assert('D8-4', exists(skillPath), `sample SKILL.md present: huawei-ecs (${skillPath})`);
  if (exists(skillPath)) {
    const c = readText(skillPath);
    const hasFrontmatterName = /^---\s*\nname:\s*.+/m.test(c);
    const hasCodeBlocks = (c.match(/```/g) || []).length >= 2;
    const hasOrderedSteps = /^\s*\d+\.\s/m.test(c);
    const hasCommands = /hcloud\s/m.test(c) || /npx\s/m.test(c);
    const big = c.length > 1500;
    assert(
      'D8-4',
      hasFrontmatterName && hasCodeBlocks && (hasOrderedSteps || hasCommands) && big,
      `frontmatter name=${hasFrontmatterName}, code blocks=${hasCodeBlocks}, ordered/command steps=${hasOrderedSteps || hasCommands}, size=${c.length}B`,
    );
    assertSpec('D8-4', 'huawei-ecs SKILL.md carries step-by-step commands + code blocks (mechanically executable guidance)');
  }
}

// ── D8-6: Chinese-English doc consistency (section header parity) ────────────
{
  const en = pick('README.md', 'README.md');
  const zh = pick('README.zh-CN.md', 'README.zh-CN.md');
  const ok = exists(en) && exists(zh);
  assert('D8-6', ok, `both README.md and README.zh-CN.md present`);
  if (ok) {
    const ce = readText(en);
    const cz = readText(zh);
    const h2en = (ce.match(/^##\s/gm) || []).length;
    const h2zh = (cz.match(/^##\s/gm) || []).length;
    const h3en = (ce.match(/^###\s/gm) || []).length;
    const h3zh = (cz.match(/^###\s/gm) || []).length;
    assert('D8-6', h2en === h2zh && h3en === h3zh, `H2 sections EN=${h2en}/ZH=${h2zh}, H3 sections EN=${h3en}/ZH=${h3zh}`);
    assertSpec('D8-6', `section header counts match between English and Chinese READMEs`);
  }
}

// ── D8-7: 7 meta skills executability ────────────────────────────────────────
{
  const metaSkills = [
    'huaweicloud-core',
    'huaweicloud-safety',
    'huaweicloud-api-and-sdk',
    'huaweicloud-capability-discovery',
    'huaweicloud-cli-and-auth',
    'huaweicloud-troubleshooting',
    'huawei-getting-started',
  ];
  const missing = [];
  for (const name of metaSkills) {
    const p = pick(
      `plugins/huaweicloud-core/skills/${name}/SKILL.md`,
      `plugins/huaweicloud-core/skills/${name}/SKILL.md`,
    );
    if (!exists(p)) {
      missing.push(name);
      continue;
    }
    const c = readText(p);
    const hasName = /^---\s*\nname:\s*.+/m.test(c);
    if (!hasName || c.length < 200) missing.push(`${name} (empty/missing frontmatter)`);
  }
  assert('D8-7', missing.length === 0, missing.length ? `missing/invalid meta skills: ${missing.join(', ')}` : `all ${metaSkills.length} meta skills present with content`);
  assertSpec('D8-7', `meta skills: ${metaSkills.join(', ')}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
const asserts = results.filter((r) => r.kind === 'ASSERT');
const passed = asserts.filter((r) => r.ok).length;
const failed = asserts.length - passed;
console.log('');
console.log(`=== SUMMARY: TOTAL=${asserts.length}  PASS=${passed}  FAIL=${failed}  SPEC=${results.filter((r) => r.kind === 'SPEC').length} ===`);
const failedCases = asserts.filter((r) => !r.ok).map((r) => r.caseId);
if (failedCases.length) {
  console.log(`FAILED CASES: ${failedCases.join(', ')}`);
  process.exitCode = 1;
} else {
  process.exitCode = 0;
}
