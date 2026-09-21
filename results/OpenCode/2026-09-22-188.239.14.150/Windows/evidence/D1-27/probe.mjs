// D1-27: judgeUpdate up_to_date
import { judgeUpdate } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const r = judgeUpdate('1.1.5', { latest: '1.1.5', next: null }, null);
console.log(JSON.stringify(r));
