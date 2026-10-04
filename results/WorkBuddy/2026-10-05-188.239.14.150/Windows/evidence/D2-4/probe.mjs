import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = process.env.HDK || 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const safety = await import('file:///' + HDK.replace(/\\/g,'/') + '/plugins/huaweicloud-core/src/safety-policy.mjs');
const auth = await import('file:///' + HDK.replace(/\\/g,'/') + '/plugins/huaweicloud-core/src/auth/credentials.mjs');
let status = 'PASS', why = '', sample = '';
try {
  // 直接调用 redactSecrets 验证凭证字段脱敏
  const sampleInput = {
    ak: 'AKIAIOSFODNN7EXAMPLE',
    sk: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    securityToken: 'STS_TOKEN_LONG_VALUE',
    region: 'cn-north-4',
  };
  const redacted = safety.redactSecrets(sampleInput);
  sample = JSON.stringify(redacted);
  const akStr = String(redacted.ak || redacted.AK || '');
  const skStr = String(redacted.sk || redacted.SK || '');
  // AK 中段应被脱敏；SK 应永不完整
  if (akStr.includes('IOSFODNN7') || skStr.includes('wJalrXUtnFEMI')) {
    status = 'FAIL'; why = '凭证字段未被脱敏: ' + sample;
  } else {
    why = '凭证字段已脱敏: ' + sample.slice(0, 200);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D2-4', status, why, sample, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
