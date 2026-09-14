// AI生成
// D1-58 (P1): whitelist matrix
// Checks: bin entries, exports, MCP tool registration, all entry points valid
import { existsSync, readFileSync } from 'node:fs';

const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const results = {};

const pkg = JSON.parse(readFileSync(`${pkgRoot}\\package.json`, 'utf8'));

// 1. Bin entries
results.bin = {};
for (const [name, path] of Object.entries(pkg.bin || {})) {
  const fullPath = `${pkgRoot}\\${path.replace(/\//g, '\\')}`;
  results.bin[name] = { path, exists: existsSync(fullPath) };
}

// 2. Package exports/main
results.main = pkg.main || null;
results.exports = pkg.exports || null;
results.type = pkg.type || null;

// 3. MCP tool registration - check tools.mjs for tool definitions
const toolsPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\tools.mjs`;
try {
  const src = readFileSync(toolsPath, 'utf8');
  // Extract tool names from the tool definitions
  const toolNamePattern = /name:\s*'([^']+)'/g;
  const tools = [];
  let match;
  while ((match = toolNamePattern.exec(src)) !== null) {
    tools.push(match[1]);
  }
  results.registeredTools = tools;
  results.toolCount = tools.length;
} catch (e) {
  results.registeredTools = { error: e.message };
}

// 4. MCP server entry
const mcpServerPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\mcp-server.mjs`;
results.mcpServer = { path: 'plugins/huaweicloud-core/src/mcp-server.mjs', exists: existsSync(mcpServerPath) };

// 5. Plugin manifest files
const pluginManifests = [
  '.claude-plugin/plugin.json',
  '.codex-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  '.hermes-plugin/plugin.json',
  '.workbuddy-plugin/plugin.json',
  'openclaw.plugin.json',
];
results.pluginManifests = {};
for (const m of pluginManifests) {
  const fullPath = `${pkgRoot}\\plugins\\huaweicloud-core\\${m.replace(/\//g, '\\')}`;
  results.pluginManifests[m] = existsSync(fullPath);
}

// 6. MCP config
const mcpConfigPath = `${pkgRoot}\\plugins\\huaweicloud-core\\.mcp.json`;
results.mcpConfig = { exists: existsSync(mcpConfigPath) };

// 7. Safety policy
const safetyPath = `${pkgRoot}\\plugins\\huaweicloud-core\\safety\\policy.json`;
results.safetyPolicy = { exists: existsSync(safetyPath) };

// 8. All entry points valid
const allBinExist = Object.values(results.bin).every(b => b.exists);
results.allEntryPointsValid = allBinExist && results.mcpServer.exists && results.mcpConfig.exists && results.safetyPolicy.exists;

console.log(JSON.stringify(results, null, 2));
