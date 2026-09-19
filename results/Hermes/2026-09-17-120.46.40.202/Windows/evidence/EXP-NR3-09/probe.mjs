// EXP-NR3-09: Windows EINVAL direct capture - spawnSync npm.cmd
import { spawnSync } from 'node:child_process';

console.log('=== EXP-NR3-09: spawnSync npm.cmd EINVAL direct capture ===');

// Test 1: npm.cmd without shell:true (should get EINVAL)
const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8', timeout: 30000, windowsHide: true,
});
console.log(`Test 1 (no shell): error.code=${r1.error?.code || 'none'} status=${r1.status} stderr=${r1.stderr?.substring(0, 100) || 'empty'}`);
console.log(`  → EINVAL captured: ${r1.error?.code === 'EINVAL'}`);

// Test 2: npm.cmd with shell:true (should work)
const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
});
console.log(`Test 2 (shell:true): status=${r2.status} stdout=${r2.stdout?.substring(0, 100)}`);
console.log(`  → Success: ${r2.status === 0}`);

// Test 3: async spawn (queryDistTags path) 
import { spawn } from 'node:child_process';
const r3 = await new Promise((resolve) => {
  const child = spawn('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    windowsHide: true,
  });
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', d => stdout += d);
  child.stderr?.on('data', d => stderr += d);
  child.on('error', err => resolve({ error: err.code, stdout, stderr }));
  child.on('close', code => resolve({ code, stdout, stderr }));
  setTimeout(() => { child.kill(); resolve({ error: 'TIMEOUT' }); }, 15000);
});
console.log(`Test 3 (async spawn): code=${r3.code || r3.error} stdout=${r3.stdout?.substring(0, 100)}`);

// Summary
const einvalCaptured = r1.error?.code === 'EINVAL';
const shellFix = r2.status === 0;
console.log(`\nRESULT: ${einvalCaptured && shellFix ? 'PASS' : 'FAIL'}`);
console.log(`EINVAL reproduced: ${einvalCaptured}`);
console.log(`shell:true fix works: ${shellFix}`);
