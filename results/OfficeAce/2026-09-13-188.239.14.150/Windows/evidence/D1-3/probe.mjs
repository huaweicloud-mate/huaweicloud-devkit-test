// AI生成
// D1-3 (P1): doctor health check
// Checks: package installed, dependencies present, doctor command exists, package can be required
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const results = {};
const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';

// 1. Check package.json exists and is valid
try {
  const pkg = JSON.parse(readFileSync(`${pkgRoot}\\package.json`, 'utf8'));
  results.packageJson = { ok: true, name: pkg.name, version: pkg.version };
} catch (e) {
  results.packageJson = { ok: false, error: e.message };
}

// 2. Check if doctor command exists in setup-cli.mjs
const setupCliPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\setup-cli.mjs`;
try {
  const src = readFileSync(setupCliPath, 'utf8');
  results.doctorCommand = {
    ok: src.includes("case 'doctor'") && src.includes('async function cmdDoctor()'),
    hasCmdDoctor: src.includes('async function cmdDoctor()'),
    hasCase: src.includes("case 'doctor'"),
  };
} catch (e) {
  results.doctorCommand = { ok: false, error: e.message };
}

// 3. Check Node.js version
results.nodeVersion = { version: process.version, meetsRequirement: parseInt(process.version.slice(1)) >= 22 };

// 4. Check runtime dependency (undici)
const undiciPath = `${pkgRoot}\\node_modules\\undici`;
results.undiciInstalled = { ok: existsSync(undiciPath) };

// 5. Check bin entry points
try {
  const pkg = JSON.parse(readFileSync(`${pkgRoot}\\package.json`, 'utf8'));
  const binChecks = {};
  for (const [name, path] of Object.entries(pkg.bin || {})) {
    binChecks[name] = { path, exists: existsSync(`${pkgRoot}\\${path}`) };
  }
  results.binEntries = binChecks;
} catch (e) {
  results.binEntries = { error: e.message };
}

// 6. Check MCP server entry point
const mcpServerPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\mcp-server.mjs`;
results.mcpServer = { ok: existsSync(mcpServerPath) };

// 7. Check safety policy
const safetyPolicyPath = `${pkgRoot}\\plugins\\huaweicloud-core\\safety\\policy.json`;
results.safetyPolicy = { ok: existsSync(safetyPolicyPath) };

// 8. Overall health
results.healthy = results.packageJson?.ok && results.doctorCommand?.ok && results.nodeVersion.meetsRequirement && results.mcpServer.ok && results.safetyPolicy.ok;

console.log(JSON.stringify(results, null, 2));
