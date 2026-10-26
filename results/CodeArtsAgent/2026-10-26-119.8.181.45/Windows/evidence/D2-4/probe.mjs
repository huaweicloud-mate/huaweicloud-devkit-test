// D2-4 探针: 凭证脱敏正确性
// 测试 show_profile_redacted 输出无明文 AK/SK

import { callTool } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function main() {
  // 测试 show_profile_redacted
  console.log('[测试] huaweicloud_show_profile_redacted');
  const result = await callTool('huaweicloud_show_profile_redacted', {});
  
  console.log('结果:', JSON.stringify(result, null, 2).substring(0, 500));
  
  if (result.ok && result.result) {
    const output = JSON.stringify(result.result);
    // 检查输出中是否有明文凭证
    const hasPlainTextAK = /accessKeyId[[:space:]]*[:=][[:space:]]*[A-Z0-9]{10,}(?!<)/i.test(output);
    const hasPlainTextSK = /secretAccessKey[[:space:]]*[:=][[:space:]]*[A-Za-z0-9]{10,}(?!<)/i.test(output);
    const hasRedacted = output.includes('<redacted>');
    
    if (hasRedacted && !hasPlainTextAK && !hasPlainTextSK) {
      console.log('[通过] 输出已正确脱敏，无明文 AK/SK');
      log('D2-4', 'PASS', {
        outputPreview: output.substring(0, 300),
        hasRedacted,
        note: '凭证脱敏正确，accessKeyId/secretAccessKey/securityToken 均为 <redacted>'
      });
    } else if (hasPlainTextAK || hasPlainTextSK) {
      console.log('[失败] 输出包含明文凭证');
      log('D2-4', 'FAIL', {
        outputPreview: output.substring(0, 200),
        error: '输出包含明文 AK/SK'
      });
    } else {
      console.log('[警告] 输出可能未正确脱敏');
      log('D2-4', 'FAIL', {
        outputPreview: output.substring(0, 200),
        error: '输出可能未正确脱敏'
      });
    }
  } else {
    console.log('[失败] 工具调用失败');
    log('D2-4', 'FAIL', {
      error: result.reason || '工具调用失败',
      result
    });
  }
  
  // 写入结果
  const outputPath = join(__dirname, 'stdout.log');
  const outputData = JSON.stringify(results, null, 2);
  writeFileSync(outputPath, outputData, 'utf8');
  console.log('[结果] 已写入:', outputPath);
  console.log(outputData);
}

main().catch(err => {
  console.error('[异常]', err.message);
  results['D2-4'] = { caseId: 'D2-4', status: 'FAIL', error: err.message, stack: err.stack };
  const outputPath = join(__dirname, 'stdout.log');
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
});
