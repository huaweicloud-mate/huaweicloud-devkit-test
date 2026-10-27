// D1-39: Windows 升级检测链可用性测试
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const results = {
  caseId: 'D1-39',
  status: 'NOT_RUN',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  why: '',
  details: {}
};

function testQueryDistTagsSync() {
  console.log('Testing queryDistTagsSync with shell: true...');
  const result = spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
    shell: true
  });
  
  console.log(`  status: ${result.status}`);
  console.log(`  error: ${result.error ? result.error.message : 'none'}`);
  
  if (result.status === 0) {
    try {
      const distTags = JSON.parse(result.stdout);
      console.log(`  dist-tags: ${JSON.stringify(distTags)}`);
      results.details.syncSuccess = true;
      results.details.distTags = distTags;
      return true;
    } catch (e) {
      console.log(`  parse error: ${e.message}`);
      results.details.syncParseError = e.message;
      return false;
    }
  } else {
    console.log(`  stderr: ${result.stderr}`);
    results.details.syncStderr = result.stderr;
    return false;
  }
}

try {
  console.log('=== D1-39: Windows 升级检测链可用性测试 ===');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node version: ${process.version}`);
  console.log(`NPM_BIN: ${NPM_BIN}`);
  console.log('');

  const syncOk = testQueryDistTagsSync();
  console.log('');

  if (syncOk) {
    results.status = 'PASS';
    results.why = 'Windows 检测链真实可用，shell:true 模式下无 EINVAL 静默失败';
    console.log('RESULT: PASS - 检测链可用');
  } else {
    results.status = 'FAIL';
    results.why = '检测链调用失败';
    console.log('RESULT: FAIL - 检测链调用失败');
  }
} catch (error) {
  results.status = 'FAIL';
  results.why = `测试执行异常: ${error.message}`;
  results.details.error = error.message;
  console.log(`ERROR: ${error.message}`);
}

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log('Results written to stdout.log');
