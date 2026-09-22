// AI生成
// EXP-D5-7-1: OfficeAce客户端可发现并加载插件清单
// Reuse D5-1 probe logic for expanded case
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' :: ' + detail : ''}`);
}

console.log('=== EXP-D5-7-1: OfficeAce客户端可发现并加载插件清单 ===');

const officeAceRoot = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce';
const devkitRoot = join(officeAceRoot, 'tools', 'node', 'node_modules', 'huaweicloud-devkit');
const pluginRoot = join(officeAceRoot, '.office-claw', 'huaweicloud-plugins');

// T1: devkit package.json
const pkgPath = join(devkitRoot, 'package.json');
let pkg = null;
try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); } catch {}
check('T1.1 devkit package.json 存在', !!pkg, pkg ? `v${pkg.version}` : 'not found');
check('T1.2 devkit 版本为 1.1.5', pkg?.version === '1.1.5', `version: ${pkg?.version}`);
check('T1.3 devkit 名称正确', pkg?.name === 'huaweicloud-devkit', `name: ${pkg?.name}`);

// T2: MCP server file
const mcpServerPath = join(devkitRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
check('T2.1 MCP server 文件存在', existsSync(mcpServerPath), mcpServerPath);

// T3: bin entries
check('T3.1 bin.huaweicloud-devkit 存在', !!pkg?.bin?.['huaweicloud-devkit'], `bin: ${pkg?.bin?.['huaweicloud-devkit']}`);
check('T3.2 bin.huaweicloud-devkit-mcp 存在', !!pkg?.bin?.['huaweicloud-devkit-mcp'], `bin: ${pkg?.bin?.['huaweicloud-devkit-mcp']}`);

// T4: OfficeAce plugin directory
check('T4.1 huaweicloud-plugins 目录存在', existsSync(pluginRoot), pluginRoot);
check('T4.2 .installed 标记文件存在', existsSync(join(pluginRoot, '.installed')), 'marker file');

// T5: safety policy
check('T5.1 safety 目录存在', existsSync(join(pluginRoot, 'safety')), 'safety dir');
const safetyFiles = ['policy.json', 'rules/cloud-risk-rules.json'].filter(f => existsSync(join(pluginRoot, 'safety', f)));
check('T5.2 safety 策略文件存在', safetyFiles.length > 0, `files: ${safetyFiles.join(', ')}`);

// T6: skills directory
const skillsDir = join(officeAceRoot, 'office-claw-skills');
check('T6.1 skills 目录存在', existsSync(skillsDir), skillsDir);

// T7: status command
let statusOutput = '';
try {
  const env = { ...process.env, PATH: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node;' + (process.env.PATH || '') };
  statusOutput = execSync('huaweicloud-devkit status', { encoding: 'utf8', timeout: 30000, env });
} catch(e) {
  statusOutput = e.stdout || e.message || '';
}
const statusPlain = statusOutput.replace(/\x1b\[[0-9;]*m/g, '');
check('T7.1 status 命令可执行', statusOutput.length > 0, `output length: ${statusOutput.length}`);
check('T7.2 status 含 OfficeAce', statusPlain.includes('OfficeAce'), 'OfficeAce found in status');
check('T7.3 OfficeAce MCP Server Installed', /OfficeAce[\s\S]*?MCP Server:\s*Installed/.test(statusPlain), 'MCP Server: Installed');
check('T7.4 OfficeAce Safety Policy Installed', /OfficeAce[\s\S]*?Safety Policy:\s*Installed/.test(statusPlain), 'Safety Policy: Installed');
check('T7.5 OfficeAce Skills installed', /OfficeAce[\s\S]*?Skills:\s*\d+\s*installed/.test(statusPlain), 'Skills: N installed');
check('T8.1 status 含版本号 1.1.5', statusOutput.includes('1.1.5'), 'v1.1.5 in status');

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

const ts = new Date();
const executedAt = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`;
const evidence = {
  status: overallPass ? 'PASS' : 'FAIL',
  why: overallPass ? `OfficeAce客户端插件清单验证通过: ${passed}/${results.length} checks passed` : `${failed} checks failed`,
  executedAt,
  testCase: 'EXP-D5-7-1',
  designCaseId: 'D5-1',
  checks: results
};
console.log('\n=== RESULT ===');
console.log(JSON.stringify(evidence));
process.exit(overallPass ? 0 : 1);
