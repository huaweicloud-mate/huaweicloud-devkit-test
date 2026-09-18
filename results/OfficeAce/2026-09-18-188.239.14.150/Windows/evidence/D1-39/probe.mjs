// AI生成
// D1-39 probe: verify update --check --target officeace works on Windows
// Source: update-check.mjs checkForUpdate() + setup-cli.mjs cmdUpdate()
import { spawnSync } from 'node:child_process';
const result = spawnSync('npx', ['huaweicloud-devkit', 'update', '--check', '--target', 'officeace'], {
  encoding: 'utf8', timeout: 60000, windowsHide: true,
});
console.log('exit:', result.status);
console.log('stdout:', result.stdout?.slice(0, 500));
// PASS if exit code 0 and output contains "Update complete" or version banner
const pass = result.status === 0 && /Update complete|HuaweiCloud DevKit/.test(result.stdout || '');
console.log('VERDICT:', pass ? 'PASS' : 'FAIL');
