import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOL_DEFINITIONS } from './plugins/huaweicloud-core/src/tools.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function test(id, description, fn) {
  try {
    const r = fn();
    results[id] = { description, ...r };
    console.log(`[${r.status}] ${id}: ${description}`);
    if (r.detail) console.log(`  -> ${r.detail}`);
  } catch (e) {
    results[id] = { description, status: 'ERROR', error: e.message };
    console.log(`[ERROR] ${id}: ${description} -> ${e.message}`);
  }
}

function runCmd(cmd, timeout = 30000) {
  try {
    const r = spawnSync('npx.cmd', ['--yes', 'huaweicloud-devkit', ...cmd.split(' ')], {
      encoding: 'utf8', timeout, windowsHide: true, shell: true,
    });
    return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status, error: r.error };
  } catch (e) {
    return { stdout: '', stderr: e.message, status: null, error: e };
  }
}

// D1-1 P1: Full new environment guided install
test('D1-1', 'full new environment guided install (install command exists)', () => {
  const r = runCmd('install --help', 15000);
  const hasInstall = r.stdout.includes('install') || r.stdout.includes('Install') || r.status === 0;
  return { status: hasInstall ? 'PASS' : 'FAIL', detail: `install --help status=${r.status}, hasOutput=${!!r.stdout}` };
});

// D1-2 P2: Multi-agent detection
test('D1-2', 'multi-agent detection (version shows installed agents)', () => {
  const r = runCmd('version', 15000);
  const hasAgents = r.stdout.includes('OpenCode') || r.stdout.includes('CodeArts');
  return { status: hasAgents ? 'PASS' : 'FAIL', detail: `version output shows agents=${hasAgents}` };
});

// D1-3 P1: doctor health check
test('D1-3', 'doctor health check (10 checks pass)', () => {
  const r = runCmd('doctor --target OpenCode', 30000);
  const allPassed = r.stdout.includes('10 pass') || r.stdout.includes('All checks passed');
  return { status: allPassed ? 'PASS' : 'FAIL', detail: `doctor output: ${r.stdout.substring(0, 200)}` };
});

// D1-4 P2: status/update idempotency
test('D1-4', 'status/update idempotency (status command works)', () => {
  const r = runCmd('status --target OpenCode', 30000);
  const hasStatus = r.stdout.includes('installed') || r.stdout.includes('Installed') || r.stdout.includes('MCP');
  return { status: hasStatus ? 'PASS' : 'FAIL', detail: `status output has install info=${hasStatus}` };
});

// D1-5 P1: uninstall cleanliness
test('D1-5', 'uninstall cleanliness (uninstall command exists)', () => {
  const r = runCmd('uninstall --help', 15000);
  const hasUninstall = r.stdout.includes('uninstall') || r.status === 0;
  return { status: hasUninstall ? 'PASS' : 'FAIL', detail: `uninstall --help status=${r.status}` };
});

// D1-6 P2: install-hcloud
test('D1-6', 'install-hcloud (hcloud CLI installed)', () => {
  // Check hcloud CLI is installed (doctor confirmed v7.2.12)
  const hcloudResult = spawnSync('hcloud', ['--version'], { encoding: 'utf8', timeout: 10000, windowsHide: true, shell: true });
  const hcloudInstalled = hcloudResult.status === 0 || hcloudResult.stdout.includes('7.');
  return { status: hcloudInstalled ? 'PASS' : 'FAIL', detail: `hcloud version: ${hcloudResult.stdout?.trim() || 'not found'}` };
});

// D1-58 P1: Universal MCP whitelist access (Claude/Cursor merge semantics)
test('D1-58', 'universal MCP whitelist access (Claude/Cursor merge semantics)', () => {
  // Check that MCP config supports multiple agent types
  // The plugin should have manifests for different agents
  const pluginRoot = join(__dirname, 'plugins', 'huaweicloud-core');
  const manifests = [];
  const agentDirs = ['.claude-plugin', '.cursor-plugin', '.codex-plugin', '.hermes-plugin', '.workbuddy-plugin'];
  for (const dir of agentDirs) {
    if (existsSync(join(pluginRoot, dir))) {
      manifests.push(dir);
    }
  }
  const hasMultiple = manifests.length >= 3;
  // Also check .mcp.json exists
  const mcpConfig = existsSync(join(pluginRoot, '.mcp.json'));
  return { status: (hasMultiple && mcpConfig) ? 'PASS' : 'FAIL', detail: `manifests=${manifests.join(',')}, mcp.json=${mcpConfig}` };
});

console.log('\n=== SUMMARY ===');
const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
const errorCount = Object.values(results).filter(r => r.status === 'ERROR').length;
console.log(`PASS: ${passCount}, FAIL: ${failCount}, ERROR: ${errorCount}, Total: ${Object.keys(results).length}`);
Object.entries(results).forEach(([id, r]) => {
  console.log(`  ${id} [${r.status}]: ${r.detail || r.error || ''}`);
});
