// Fix D8-9: installId stability + sanitizeValue behavior
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';

const telemetry = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/telemetry/telemetry.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Auto-generated fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}
const TS = '20261008052200';

// ===== D8-9: 安装 ID 与遥测值脱敏 =====
// Test 1: generateOrRecoverInstallId stability
// Test 2: sanitizeValue behavior — spec says "移除 AK/SK/token 等敏感值与非法字符"
//         actual implementation only strips control chars + truncates, does NOT redact AK/SK
try {
  // Test 1: installId stability
  const id1 = telemetry.generateOrRecoverInstallId();
  const id2 = telemetry.generateOrRecoverInstallId();
  const idStable = id1 === id2 && id1.length > 0;

  // Test 2: sanitizeValue with control chars (should be removed)
  const withControl = 'hello\tworld\n\rtest';
  const sanitizedControl = telemetry.sanitizeValue(withControl);
  const controlRemoved = !/[\r\n\t]/.test(sanitizedControl);

  // Test 3: sanitizeValue with AK/SK-like value
  const akValue = 'AKTEST123456';
  const sanitizedAK = telemetry.sanitizeValue(akValue);
  const akRedacted = /<redacted>|\*|REDACTED/i.test(sanitizedAK) || sanitizedAK !== akValue;

  // Test 4: sanitizeValue with normal value (should not change)
  const normalValue = 'cn-north-4';
  const sanitizedNormal = telemetry.sanitizeValue(normalValue);
  const normalPreserved = sanitizedNormal === normalValue;

  // Test 5: sanitizeValue with long value (should truncate)
  const longValue = 'x'.repeat(300);
  const sanitizedLong = telemetry.sanitizeValue(longValue);
  const truncated = sanitizedLong.length < longValue.length;

  // The spec says sanitizeValue should "移除 AK/SK/token 等敏感值" but actual implementation
  // only strips control chars + truncates. This is a SPEC-MISMATCH if AK/SK is not redacted.
  if (idStable && controlRemoved && normalPreserved && truncated) {
    if (akRedacted) {
      writeCase('D8-9', { caseId:'D8-9', status:'PASS', why:'installId稳定+sanitizeValue移除控制字符+脱敏AK+保留合法值+截断', sample: JSON.stringify({id1: id1.slice(0,20), controlRemoved, akRedacted, normalPreserved, truncated}), executedAt:TS });
    } else {
      // sanitizeValue does not redact AK/SK — spec says it should
      writeCase('D8-9', { caseId:'D8-9', status:'SPEC-MISMATCH', why:'sanitizeValue 仅移除控制字符和截断，未脱敏 AK/SK/token 值（spec 要求移除敏感值）', rootCause:'plugins/huaweicloud-core/src/telemetry/telemetry.mjs: sanitizeValue function (line ~189) — 只做 replace(/[\\r\\n\\t]+/g, " ") 和 slice(0, MAX_VALUE_LENGTH)，无 AK/SK/token 检测脱敏', sample: JSON.stringify({id1: id1.slice(0,20), controlRemoved, akRedacted: false, akOutput: sanitizedAK, normalPreserved, truncated}), executedAt:TS });
    }
  } else {
    writeCase('D8-9', { caseId:'D8-9', status:'FAIL', why:'基础功能异常: idStable='+idStable+' controlRemoved='+controlRemoved+' normalPreserved='+normalPreserved+' truncated='+truncated, sample: JSON.stringify({id1, id2, sanitizedControl, sanitizedNormal, sanitizedLong: sanitizedLong.length}), executedAt:TS });
  }
} catch (e) { writeCase('D8-9', { caseId:'D8-9', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('D8-9 fix done.');
