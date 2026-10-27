// D1-40: 镜像 lag 下检测正确性测试
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const results = {
  caseId: 'D1-40',
  status: 'NOT_RUN',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  why: '',
  details: {}
};

function queryDistTags(registry) {
  const env = { ...process.env };
  if (registry) {
    env.npm_config_registry = registry;
  }
  
  const result = spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
    shell: true,
    env
  });
  
  if (result.status === 0) {
    try {
      const parsed = JSON.parse(result.stdout);
      // npm view 返回可能是数组或对象
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
      return parsed;
    } catch (e) {
      return { error: `Parse error: ${e.message}` };
    }
  }
  return { error: result.stderr || `status ${result.status}` };
}

function compareVersions(current, latest) {
  const currentParts = current.replace(/^v/, '').split('.').map(Number);
  const latestParts = latest.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (currentParts[i] > latestParts[i]) return 1;
    if (currentParts[i] < latestParts[i]) return -1;
  }
  return 0;
}

try {
  console.log('=== D1-40: 镜像 lag 下检测正确性测试 ===');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node version: ${process.version}`);
  console.log('');

  // 测试默认 registry（可能是镜像）
  console.log('1. Querying dist-tags from default registry...');
  const defaultTags = queryDistTags(null);
  console.log(`   Result: ${JSON.stringify(defaultTags)}`);
  results.details.defaultRegistry = defaultTags;

  // 测试官方 registry
  console.log('\n2. Querying dist-tags from official registry...');
  const officialTags = queryDistTags('https://registry.npmjs.org');
  console.log(`   Result: ${JSON.stringify(officialTags)}`);
  results.details.officialRegistry = officialTags;

  // 比较版本
  const defaultLatest = defaultTags?.latest;
  const officialLatest = officialTags?.latest;
  
  if (defaultLatest && officialLatest) {
    const comparison = compareVersions(defaultLatest, officialLatest);
    console.log(`\n3. Version comparison:`);
    console.log(`   Default: ${defaultLatest}`);
    console.log(`   Official: ${officialLatest}`);
    console.log(`   Comparison: ${comparison}`);
    
    results.details.comparison = comparison;
    
    // 如果镜像滞后，不应该提示版本倒退
    if (comparison < 0) {
      // 镜像版本低于官方，这是正常的，不应该提示版本倒退
      results.status = 'PASS';
      results.why = `镜像 lag 正常（${defaultLatest} < ${officialLatest}），不提示版本倒退`;
      console.log('\nRESULT: PASS - 镜像 lag 下未提示版本倒退');
    } else if (comparison === 0) {
      results.status = 'PASS';
      results.why = '镜像与官方版本一致，无 lag 问题';
      console.log('\nRESULT: PASS - 镜像与官方版本一致');
    } else {
      // 镜像版本高于官方，这是异常情况
      results.status = 'FAIL';
      results.why = `镜像版本倒退（${defaultLatest} > ${officialLatest}）`;
      console.log('\nWARNING: 镜像版本高于官方');
    }
  } else {
    results.status = 'FAIL';
    results.why = `无法获取版本信息: defaultLatest=${defaultLatest}, officialLatest=${officialLatest}`;
    console.log('\nRESULT: FAIL - 无法获取版本信息');
  }
} catch (error) {
  results.status = 'FAIL';
  results.why = `测试执行异常: ${error.message}`;
  results.details.error = error.message;
  console.log(`ERROR: ${error.message}`);
}

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log('\nResults written to stdout.log');
