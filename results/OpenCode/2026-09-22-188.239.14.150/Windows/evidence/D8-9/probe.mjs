// D8-9: Install ID + sanitize
import { generateOrRecoverInstallId, sanitizeValue } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
const id1 = generateOrRecoverInstallId();
const id2 = generateOrRecoverInstallId();
console.log('ID stable:', id1 === id2);
console.log('Sanitized:', sanitizeValue('AK=ABC123&token=xyz'));
