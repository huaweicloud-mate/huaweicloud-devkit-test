// D1-28: judgeUpdate update_available
import { judgeUpdate } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const r = judgeUpdate('1.1.4', { latest: '1.1.5', next: '1.1.6-next.0' }, null);
console.log(JSON.stringify(r));
