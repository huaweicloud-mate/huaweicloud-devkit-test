import { callTool } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function log(caseId, status, data) {
  results[caseId] = { caseId, status, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14), ...data };
}

async function main() {
  console.log('Testing tools/call credential redaction...');
  
  // Test 1: show_profile_redacted should not leak credentials
  const profileResult = await callTool('huaweicloud_show_profile_redacted', {});
  console.log('Profile result:', JSON.stringify(profileResult).substring(0, 200));
  
  const profileOutput = JSON.stringify(profileResult);
  const hasPlainTextAK = /accessKeyId[=:][A-Z0-9]{10,}(?!<)/i.test(profileOutput);
  const hasPlainTextSK = /secretAccessKey[=:][A-Za-z0-9]{10,}(?!<)/i.test(profileOutput);
  const hasRedacted = profileOutput.includes('<redacted>');
  
  console.log('Has redacted:', hasRedacted, 'Has plain AK:', hasPlainTextAK, 'Has plain SK:', hasPlainTextSK);
  
  // Test 2: run_readonly_command should work
  const readonlyResult = await callTool('huaweicloud_run_readonly_command', { args: ['IAM', 'KeystoneListRegions'] });
  console.log('Readonly result:', readonlyResult?.ok ? 'OK' : 'FAIL');
  
  if (hasRedacted && !hasPlainTextAK && !hasPlainTextSK && readonlyResult?.ok) {
    console.log('PASS: Credentials redacted and readonly commands work');
    log('D9-13', 'PASS', {
      profileRedacted: hasRedacted,
      readonlyWorks: readonlyResult?.ok,
      note: '凭证脱敏正确，只读命令可执行'
    });
  } else {
    console.log('FAIL: Credential redaction or readonly command failed');
    log('D9-13', 'FAIL', {
      profileRedacted: hasRedacted,
      readonlyWorks: readonlyResult?.ok,
      hasPlainTextAK,
      hasPlainTextSK
    });
  }
  
  const outputPath = join(__dirname, 'stdout.log');
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Done');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  results['D9-13'] = { caseId: 'D9-13', status: 'FAIL', error: err.message };
  const outputPath = join(__dirname, 'stdout.log');
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
});