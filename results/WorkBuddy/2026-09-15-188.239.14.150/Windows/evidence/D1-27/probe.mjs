import { judgeUpdate } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
const distTags = { latest: '1.1.4', next: '1.1.4-next.6' };
const r = judgeUpdate('1.1.4', distTags, null);
console.log('result:', r.result, 'updateAvailable:', r.updateAvailable);
if (r.result === 'up_to_date' && r.updateAvailable === false) console.log('PASS');
else console.log('FAIL');