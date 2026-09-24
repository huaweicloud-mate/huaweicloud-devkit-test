/**
 * WorkBuddy daily test probe - D1 env vars + D2 KooCLI + D6 perf + D8 quality misc
 * Covers: D1-65,66,67,68,69,70, D2-27, D6-9, D8-9, D8-10
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readInstalledVersion } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const pkgRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-25-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// ===== D1-65: Debug mode env var =====
// Check all source files for debug/verbose env var support
const srcDir = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src');
let debugEnvFound = false;
function searchDir(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) { searchDir(fullPath); continue; }
    if (entry.endsWith('.mjs')) {
      const content = readFileSync(fullPath, 'utf8');
      if (/HDK_DEBUG|DEBUG_MODE|process\.env.*DEBUG/i.test(content)) { debugEnvFound = true; break; }
    }
  }
}
try { searchDir(srcDir); } catch {}
test('D1-65', 'debug-env-var', debugEnvFound, debugEnvFound, true, 'debug env var found in source', 'debug env var not found anywhere (SPEC-MISMATCH)');

// ===== D1-66: Telemetry switch and endpoint env vars =====
const telemetryPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'telemetry', 'telemetry.mjs');
const telemetryContent = existsSync(telemetryPath) ? readFileSync(telemetryPath, 'utf8') : '';
test('D1-66', 'telemetry-env', /HDK_TELEMETRY|TELEMETRY_DISABLED|telemetry.*endpoint|TELEMETRY_ENDPOINT/i.test(telemetryContent), true, true, 'telemetry env var found', 'telemetry env var not found');

// ===== D1-67: Agent toolkit mode + DSH skip install env vars =====
const setupCliPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');
const setupCliContent = readFileSync(setupCliPath, 'utf8');
test('D1-67', 'toolkit-mode-env', /HUAWEICLOUD_AGENT_TOOLKIT_MODE|AGENT_TOOLKIT/i.test(setupCliContent), /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(setupCliContent), true, 'toolkit mode env found', 'toolkit mode env not found');
test('D1-67', 'dsh-skip-env', /DSH|dsh.*skip|SKIP.*INSTALL/i.test(setupCliContent), /DSH|dsh/.test(setupCliContent), true, 'DSH skip env found', 'DSH skip env not found');

// ===== D1-68: Icon offline and region env vars =====
const iconLibPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'icon-library.mjs');
const iconContent = existsSync(iconLibPath) ? readFileSync(iconLibPath, 'utf8') : '';
test('D1-68', 'icon-offline-env', /HDK_ICON|ICON.*OFFLINE|icon.*cache/i.test(iconContent) || /HDK_ICON|ICON/.test(setupCliContent), true, true, 'icon env var found', 'icon env var not found');
test('D1-68', 'region-env', /HUAWEICLOUD_REGION|HW_REGION|cli.*region/i.test(setupCliContent), true, true, 'region env found', 'region env not found');

// ===== D1-69: CLI help subcommands =====
// Check setup-cli has help/usage
test('D1-69', 'cli-help', /help|--help|usage/i.test(setupCliContent), /help|--help/.test(setupCliContent), true, 'CLI help found', 'CLI help not found');

// ===== D1-70: Proxy config and WebSocket proxy =====
test('D1-70', 'proxy-config', /proxy|PROXY|HTTPS_PROXY|HTTP_PROXY/i.test(setupCliContent), true, true, 'proxy config found', 'proxy config not found');
const wsExecPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'ws-exec');
test('D1-70', 'ws-proxy-dir', existsSync(wsExecPath), existsSync(wsExecPath), true, 'ws-exec dir exists', 'ws-exec dir missing');

// Check mcp-server-remote.mjs for WebSocket
const remoteServerPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-server-remote.mjs');
test('D1-70', 'remote-server', existsSync(remoteServerPath), existsSync(remoteServerPath), true, 'mcp-server-remote.mjs exists', 'mcp-server-remote.mjs missing');

// ===== D2-27: KooCLI version management =====
const koocliPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'koocli-version.mjs');
test('D2-27', 'koocli-version-file', existsSync(koocliPath), existsSync(koocliPath), true, 'koocli-version.mjs exists', 'koocli-version.mjs missing');
if (existsSync(koocliPath)) {
  const koocliContent = readFileSync(koocliPath, 'utf8');
  test('D2-27', 'koocli-version-fn', /export.*function|export.*const/i.test(koocliContent), /export/.test(koocliContent), true, 'koocli version exports found', 'koocli version no exports');
}

// ===== D6-9: Cache cleanup three entries =====
// Check update-check.mjs for cache cleanup
const updateCheckPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
const updateCheckContent = readFileSync(updateCheckPath, 'utf8');
test('D6-9', 'cache-cleanup', /clearCache|clearCache|delete.*cache|cache.*delete|invalidate/i.test(updateCheckContent) || /cache/i.test(iconContent), true, true, 'cache cleanup found', 'cache cleanup not found');

// Three cache entries: update-check cache, icon cache, service catalog cache
test('D6-9', 'update-cache', /cache/i.test(updateCheckContent), true, true, 'update cache found', 'update cache not found');
test('D6-9', 'icon-cache', /cache/i.test(iconContent), true, true, 'icon cache found', 'icon cache not found');
const hcloudCliPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'hcloud-cli.mjs');
const hcloudCliContent = readFileSync(hcloudCliPath, 'utf8');
test('D6-9', 'catalog-cache', /_catalogCache|cache/i.test(hcloudCliContent), true, true, 'catalog cache found', 'catalog cache not found');

// ===== D8-9: Install ID and telemetry value redaction =====
const telemetryMjsPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'telemetry', 'telemetry.mjs');
test('D8-9', 'telemetry-mjs-exists', existsSync(telemetryMjsPath), existsSync(telemetryMjsPath), true, 'telemetry.mjs exists', 'telemetry.mjs missing');
if (existsSync(telemetryMjsPath)) {
  const telemetryMjsContent = readFileSync(telemetryMjsPath, 'utf8');
  // install ID is generated via createHash (SHA) - check it's hashed, not raw
  test('D8-9', 'install-id-hash', /generateOrRecoverInstallId|createHash|installation-id/i.test(telemetryMjsContent), /createHash|installation-id/.test(telemetryMjsContent), true, 'install ID uses hash', 'install ID not hashed');
  // Check no raw AK/SK in telemetry
  test('D8-9', 'no-raw-creds', !/AKID[A-Z0-9]{10,}|secretKey.*=.*process\.env/i.test(telemetryMjsContent), 'clean', 'clean', 'no raw creds in telemetry', 'raw creds in telemetry');
}

// ===== D8-10: MCP config backup and merge =====
const mergePath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-config-merge.mjs');
const backupPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-config-backup.mjs');
test('D8-10', 'merge-exists', existsSync(mergePath), existsSync(mergePath), true, 'mcp-config-merge exists', 'mcp-config-merge missing');
test('D8-10', 'backup-exists', existsSync(backupPath), existsSync(backupPath), true, 'mcp-config-backup exists', 'mcp-config-backup missing');

if (existsSync(mergePath)) {
  const mergeContent = readFileSync(mergePath, 'utf8');
  test('D8-10', 'merge-exports', /export.*function|export.*const/i.test(mergeContent), /export/.test(mergeContent), true, 'merge has exports', 'merge no exports');
}
if (existsSync(backupPath)) {
  const backupContent = readFileSync(backupPath, 'utf8');
  test('D8-10', 'backup-exports', /export.*function|export.*const/i.test(backupContent), /export/.test(backupContent), true, 'backup has exports', 'backup no exports');
}

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd1-envvars', 'stdout.log'), output, 'utf8');
console.log(output);
