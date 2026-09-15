import { judgeUpdate } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
const distTags = { latest: '1.1.5', next: '1.1.5-next.1' };
const r = judgeUpdate('1.1.4', distTags, null);
console.log('result:', r.result, 'updateAvailable:', r.updateAvailable, 'targetVersion:', r.targetVersion);
if (r.result === 'update_available' && r.updateAvailable === true) console.log('PASS');
else console.log('FAIL');