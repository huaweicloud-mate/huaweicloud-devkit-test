import { judgeUpdate, writeSkipState, resolveSkipFilePath, readSkipState } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
const distTags = { latest: '1.1.5', next: null };
const skipPath = resolveSkipFilePath('test-session-d1-31');
writeSkipState(skipPath, '1.1.5');
const skip = readSkipState(skipPath);
console.log('skip state:', JSON.stringify(skip));
const r = judgeUpdate('1.1.4', distTags, skip);
console.log('result:', r.result, 'dismissed:', r.dismissed, 'dismissExpiresAt:', r.dismissExpiresAt);
try { fs.rmSync(skipPath); } catch {}
if (r.result === 'dismissed' && r.dismissed === true) console.log('PASS');
else console.log('FAIL');