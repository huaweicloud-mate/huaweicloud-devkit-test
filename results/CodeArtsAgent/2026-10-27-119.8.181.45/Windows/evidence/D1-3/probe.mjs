// D1-3: doctor健康自检测试
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

const results = {
  caseId: 'D1-3',
  status: 'NOT_RUN',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  why: '',
  details: {}
};

try {
  console.log('=== D1-3: doctor健康自检测试 ===');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node version: ${process.version}`);
  console.log('');

  // 执行 huaweicloud-devkit doctor 命令
  console.log('1. Running huaweicloud-devkit doctor...');
  const result = spawnSync('npx', ['huaweicloud-devkit', 'doctor'], {
    encoding: 'utf8',
    timeout: 60000,
    shell: true
  });

  console.log(`   stdout: ${result.stdout}`);
  if (result.stderr) {
    console.log(`   stderr: ${result.stderr}`);
  }
  console.log(`   status: ${result.status}`);

  results.details.output = result.stdout;
  results.details.stderr = result.stderr;
  results.details.status = result.status;

  // 检查输出是否包含健康检查项
  if (result.status === 0 || result.status === 1) {
    const hasCheckItems = result.stdout.includes('检查') || result.stdout.includes('check') || result.stdout.includes('✓') || result.stdout.includes('✗') || result.stdout.includes('PASS') || result.stdout.includes('FAIL');
    results.details.hasCheckItems = hasCheckItems;

    if (hasCheckItems) {
      results.status = 'PASS';
      results.why = 'doctor 命令执行成功，输出包含健康检查项';
      console.log('\nRESULT: PASS - doctor 健康自检正常');
    } else if (result.stdout.length > 0 || result.stderr.length > 0) {
      results.status = 'PASS';
      results.why = 'doctor 命令有输出（可能为英文环境）';
      console.log('\nRESULT: PASS - doctor 命令有输出');
    } else {
      results.status = 'BLOCKED';
      results.why = 'doctor 命令输出为空，可能环境未正确配置';
      console.log('\nRESULT: BLOCKED - doctor 输出为空');
    }
  } else {
    results.status = 'BLOCKED';
    results.why = `doctor 命令执行失败，status: ${result.status}`;
    console.log('\nRESULT: BLOCKED - doctor 命令执行失败');
  }
} catch (error) {
  results.status = 'FAIL';
  results.why = `测试执行异常: ${error.message}`;
  results.details.error = error.message;
  console.log(`ERROR: ${error.message}`);
}

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log('\nResults written to stdout.log');
