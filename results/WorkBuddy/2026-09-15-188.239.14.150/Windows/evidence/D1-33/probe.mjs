import { writeSkipState, readSkipState, resolveSkipFilePath } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
const path = resolveSkipFilePath('test-d1-33');
writeSkipState(path, '1.1.5');
const state = readSkipState(path);
console.log('Skip state:', JSON.stringify(state));
console.log('Has dismissedVersion:', !!state?.dismissedVersion);
console.log('Has dismissedAt:', !!state?.dismissedAt);
console.log('Has expireAt:', !!state?.expireAt);
import { rmSync } from 'fs';
try { rmSync(path); } catch {}
if (state?.dismissedVersion === '1.1.5' && state?.dismissedAt && state?.expireAt) console.log('PASS');
else console.log('FAIL');