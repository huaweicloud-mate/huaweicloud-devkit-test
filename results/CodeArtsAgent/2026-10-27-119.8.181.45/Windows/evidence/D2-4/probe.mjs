// D2-4: 凭证脱敏正确性测试
import { spawnSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

const results = {
  caseId: 'D2-4',
  status: 'NOT_RUN',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  why: '',
  details: {}
};

function testCredentialRedaction() {
  console.log('=== D2-4: 凭证脱敏正确性测试 ===');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node version: ${process.version}`);
  console.log('');

  // 读取凭证文件
  const credPath = process.env.HUAWEICLOUD_CREDENTIALS || 
    `${process.env.HOME || process.env.USERPROFILE}/.config/huaweicloud/credentials.json`;
  
  console.log(`1. Reading credentials from: ${credPath}`);
  let credentials;
  try {
    credentials = JSON.parse(readFileSync(credPath, 'utf8'));
    console.log(`   AK: ${credentials.ak}`);
    console.log(`   SK: ${credentials.sk ? '[hidden]' : 'missing'}`);
    results.details.credentialsLoaded = true;
  } catch (error) {
    results.status = 'BLOCKED';
    results.why = `无法读取凭证文件: ${error.message}`;
    console.log(`   ERROR: ${error.message}`);
    return;
  }

  // 执行 hcloud configure show 查看输出
  console.log('\n2. Executing hcloud configure show...');
  const hcloudBin = process.platform === 'win32' ? 'hcloud.cmd' : 'hcloud';
  const result = spawnSync(hcloudBin, ['configure', 'show'], {
    encoding: 'utf8',
    timeout: 10000,
    shell: true
  });

  console.log(`   stdout: ${result.stdout}`);
  if (result.stderr) {
    console.log(`   stderr: ${result.stderr}`);
  }

  results.details.hcloudOutput = result.stdout;

  // 检查输出中是否有明文凭证
  console.log('\n3. Checking for plaintext credentials in output...');
  
  const akInOutput = result.stdout.includes(credentials.ak);
  const skInOutput = credentials.sk && result.stdout.includes(credentials.sk);
  
  console.log(`   AK in output: ${akInOutput}`);
  console.log(`   SK in output: ${skInOutput}`);

  results.details.akInOutput = akInOutput;
  results.details.skInOutput = skInOutput;

  if (!akInOutput && !skInOutput) {
    results.status = 'PASS';
    results.why = '输出中无明文 AK/SK，凭证脱敏正确';
    console.log('\nRESULT: PASS - 凭证脱敏正确');
  } else if (akInOutput || skInOutput) {
    results.status = 'FAIL';
    results.why = `输出中存在明文凭证 (AK:${akInOutput}, SK:${skInOutput})`;
    console.log('\nRESULT: FAIL - 凭证脱敏失败');
  } else {
    results.status = 'FAIL';
    results.why = '无法判断凭证脱敏状态';
    console.log('\nRESULT: FAIL - 无法判断');
  }
}

try {
  testCredentialRedaction();
} catch (error) {
  results.status = 'FAIL';
  results.why = `测试执行异常: ${error.message}`;
  results.details.error = error.message;
  console.log(`ERROR: ${error.message}`);
}

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log('\nResults written to stdout.log');
