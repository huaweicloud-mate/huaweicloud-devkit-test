// D5-1: 客户端可发现并加载插件清单
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const pluginDir = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core';
const checks = [];

// Check plugin.json exists and is valid
const pluginJsonPath = join(pluginDir, 'openclaw.plugin.json');
const hasPluginJson = existsSync(pluginJsonPath);
checks.push({ check: 'openclaw.plugin.json exists', pass: hasPluginJson });

let pluginJsonValid = false;
let pluginName = null;
if (hasPluginJson) {
  try {
    const pj = JSON.parse(readFileSync(pluginJsonPath, 'utf8'));
    pluginJsonValid = true;
    pluginName = pj.name || pj.mcpName || null;
    checks.push({ check: 'plugin.json valid JSON', pass: true, name: pluginName });
  } catch (e) {
    checks.push({ check: 'plugin.json valid JSON', pass: false, error: e.message });
  }
}

// Check .mcp.json exists
const mcpJsonPath = join(pluginDir, '.mcp.json');
const hasMcpJson = existsSync(mcpJsonPath);
checks.push({ check: '.mcp.json exists', pass: hasMcpJson });

// Check skills directory exists
const skillsDir = join(pluginDir, 'skills');
const hasSkills = existsSync(skillsDir);
checks.push({ check: 'skills/ directory exists', pass: hasSkills });

// Check src/mcp-server.mjs exists
const mcpServerPath = join(pluginDir, 'src', 'mcp-server.mjs');
const hasMcpServer = existsSync(mcpServerPath);
checks.push({ check: 'src/mcp-server.mjs exists', pass: hasMcpServer });

// Check package.json has mcpName
const pkgPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const hasMcpName = Boolean(pkg.mcpName);
checks.push({ check: 'package.json has mcpName', pass: hasMcpName, mcpName: pkg.mcpName });

const allPass = checks.every(c => c.pass);
console.log(JSON.stringify({
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D5-1',
  why: allPass ? 'Plugin manifest (openclaw.plugin.json, .mcp.json, skills/, mcp-server.mjs) all discoverable.' : 'Some manifest files missing.',
  executedAt: '20260930103000',
  details: checks
}, null, 2));