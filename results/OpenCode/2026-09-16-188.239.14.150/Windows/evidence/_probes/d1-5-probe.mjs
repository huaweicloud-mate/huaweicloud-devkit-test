// D1-5: 卸载后无功能残留
// 执行: uninstall --target opencode → 扫描残留 → reinstall → 验证
// 用法: node d1-5-probe.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';

const NPX = process.execPath.replace(/node(\.exe)?$/, '') + 'npx.cmd';
const home = homedir();

// OpenCode config/skill/plugin paths (from setup-cli.mjs uninstallOpenCode)
function configRoot(name) {
  return join(home, '.config', name);
}
const opencodeSkillsDir = () => join(home, '.config', 'opencode', 'skills');
const opencodeCommandsDir = () => join(home, '.config', 'opencode', 'commands');
const opencodePluginsDir = () => join(home, '.config', 'opencode', 'plugins');
const pluginFile = join(configRoot('opencode'), 'plugins', 'skill-tracker.js');

console.log('===== D1-5 卸载残留扫描 =====');

// 1. 记录卸载前状态
function scanState(label) {
  const state = {};
  const paths = {
    'skillsDir': opencodeSkillsDir(),
    'commandsDir': opencodeCommandsDir(),
    'pluginsDir': opencodePluginsDir(),
    'pluginFile': pluginFile,
  };
  for (const [name, path] of Object.entries(paths)) {
    if (existsSync(path)) {
      if (existsSync(path) && statSync(path).isDirectory()) {
        const huaweiEntries = readdirSync(path).filter(f => f.startsWith('huawei'));
        state[name] = { exists: true, huaweiCount: huaweiEntries.length, entries: huaweiEntries };
      } else {
        state[name] = { exists: true };
      }
    } else {
      state[name] = { exists: false };
    }
  }
  console.log(`[${label}] 状态:`, JSON.stringify(state));
  return state;
}

const beforeState = scanState('卸载前');

// 2. 执行卸载
console.log('\n--- 执行 uninstall --target opencode ---');
const uninstallResult = spawnSync('npx.cmd', ['-y', '-p', 'huaweicloud-devkit', 'huaweicloud-devkit', 'uninstall', '--target', 'opencode'], {
  cwd: process.cwd(),
  encoding: 'utf-8',
  timeout: 60000,
  env: { ...process.env },
  shell: true,
});
console.log('uninstall stdout:', (uninstallResult.stdout || '').slice(0, 500));
console.log('uninstall stderr:', (uninstallResult.stderr || '').slice(0, 300));
console.log('uninstall exitCode:', uninstallResult.status);

// 3. 扫描残留
const afterState = scanState('卸载后');

// 检查残留
let hasResidual = false;
for (const [name, s] of Object.entries(afterState)) {
  if (s.exists && s.huaweiCount > 0) {
    console.log(`[残留] ${name} 仍有 ${s.huaweiCount} 个 huawei 文件: ${s.entries?.join(', ')}`);
    hasResidual = true;
  }
  if (name === 'pluginFile' && s.exists) {
    console.log(`[残留] ${name} 仍存在`);
    hasResidual = true;
  }
}

console.log('\n卸载后无功能残留:', !hasResidual);

// 4. 重新安装
console.log('\n--- 执行 install --target opencode ---');
const installResult = spawnSync('npx.cmd', ['-y', '-p', 'huaweicloud-devkit', 'huaweicloud-devkit', 'install', '--target', 'opencode'], {
  cwd: process.cwd(),
  encoding: 'utf-8',
  timeout: 60000,
  env: { ...process.env },
  shell: true,
});
console.log('install stdout:', (installResult.stdout || '').slice(0, 500));
console.log('install exitCode:', installResult.status);

// 5. 验证重装
const reinstalledState = scanState('重装后');
let reinstalledOk = false;
if (reinstalledState.skillsDir?.exists && reinstalledState.skillsDir?.huaweiCount > 0) {
  reinstalledOk = true;
  console.log('重装验证: skills 恢复', reinstalledState.skillsDir.huaweiCount, '个');
} else {
  console.log('重装验证: skills 未恢复');
}

console.log('\n===== D1-5 结论 =====');
console.log('卸载后无功能残留:', !hasResidual);
console.log('重装成功:', reinstalledOk);
console.log('D1-5:', !hasResidual ? 'PASS' : 'FAIL');

console.log('===== END D1-5 =====');
