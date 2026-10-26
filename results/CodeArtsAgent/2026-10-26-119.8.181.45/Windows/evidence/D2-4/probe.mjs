// D2-4 探针: 凭证脱敏正确性
// 测试 show_profile_redacted 输出无明文 AK/SK

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function log(caseId, status, data = {}) {
  results[caseId] = {
    caseId,
    status,
    executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    ...data
  };
}

// 测试 huaweicloud show_profile_redacted
console.log('[测试] 执行 huaweicloud show_profile_redacted');
const result = spawnSync('npx.cmd', ['huaweicloud', 'show_profile_redacted'], {
  encoding: 'utf8',
  timeout: 30000,
  shell: true,
  windowsHide: true
});

console.log('stdout:', result.stdout);
console.log('stderr:', result.stderr);
console.log('status:', result.status);

if (result.status === 0 && result.stdout) {
  const output = result.stdout;
  // 检查输出中是否有明文凭证
  const hasPlainTextAK = /AK[[:space:]]*[:=][[:space:]]*[A-Z0-9]{10,}/i.test(output);
  const hasPlainTextSK = /SK[[:space:]]*[:=][[:space:]]*[A-Za-z0-9]{10,}/i.test(output);
  
  if (!hasPlainTextAK && !hasPlainTextSK) {
    console.log('[通过] 输出无明文 AK/SK');
    log('D2-4', 'PASS', {
      outputPreview: output.substring(0, 200),
      note: '凭证脱敏正确'
    });
  } else {
    console.log('[失败] 输出包含明文凭证');
    log('D2-4', 'FAIL', {
      outputPreview: output.substring(0, 200),
      error: '输出包含明文 AK/SK'
    });
  }
} else {
  console.log('[失败] 命令执行失败');
  log('D2-4', 'FAIL', {
    error: result.stderr || '命令执行失败',
    status: result.status
  });
}

// 写入结果
const outputPath = join(__dirname, 'stdout.log');
const outputData = JSON.stringify(results, null, 2);
writeFileSync(outputPath, outputData, 'utf8');
console.log('[结果] 已写入:', outputPath);
console.log(outputData);
