// AI生成
// D1-69: CLI help子命令
// Execute help subcommand and verify output
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Find the CLI entry point
  const cliPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/setup-cli.mjs';
  const nodePath = process.execPath;
  
  // Execute: node setup-cli.mjs help
  const r = spawnSync(nodePath, [cliPath, 'help'], {
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, PYTHONUTF8: '1' }
  });
  
  results.exitCode = r.status;
  results.stdout = r.stdout?.slice(0, 500) || '';
  results.stderr = r.stderr?.slice(0, 500) || '';
  results.hasOutput = (r.stdout?.length || 0) > 0;
  results.isExit0 = r.status === 0;
  results.notTODO = !results.stdout.includes('TODO') && !results.stdout.includes('todo');
  results.notEmpty = results.hasOutput;
  
  // Check for help-like content
  const lowerOut = (r.stdout || '').toLowerCase();
  results.hasUsage = lowerOut.includes('usage') || lowerOut.includes('用法');
  results.hasCommands = lowerOut.includes('command') || lowerOut.includes('命令') || lowerOut.includes('install') || lowerOut.includes('help');
  
  const status = (results.isExit0 && results.notEmpty && results.notTODO && results.hasCommands) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? `help子命令输出帮助文本, 退出码0, 非TODO/空输出`
      : `help子命令异常: exit=${results.exitCode}, hasOutput=${results.hasOutput}, notTODO=${results.notTODO}, hasCommands=${results.hasCommands}`,
    executedAt: ts(),
    ...results
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
