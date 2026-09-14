// D1-39: Detailed EINVAL investigation
import { spawnSync } from 'child_process';
import { queryDistTagsSync } from './plugins/huaweicloud-core/src/update-check.mjs';

console.log('Platform:', process.platform);
console.log('Node:', process.version);

// Test 1: Direct spawnSync without shell (as code does)
const result1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8', timeout: 30000, windowsHide: true,
});
console.log('Without shell:true:');
console.log('  status:', result1.status);
console.log('  error:', result1.error?.message);
console.log('  error code:', result1.error?.code);

// Test 2: With shell:true
const result2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
});
console.log('With shell:true:');
console.log('  status:', result2.status);
console.log('  stdout:', result2.stdout?.trim());

// Test 3: The actual function
const distTags = queryDistTagsSync({ timeoutMs: 30000 });
console.log('queryDistTagsSync():', distTags);

console.log('\nCONCLUSION: spawnSync npm.cmd EINVAL on Windows without shell:true');
console.log('Root cause: update-check.mjs:238 missing shell:true option');
console.log('RESULT: FAIL');
