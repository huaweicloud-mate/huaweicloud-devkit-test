// Real probe for D1-39
// Real execution: 20261019050941
import { queryDistTagsSync, queryDistTagsFetch } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const sync = queryDistTagsSync({ timeoutMs: 60000 });
const fetch = await queryDistTagsFetch({ timeoutMs: 30000 });
const anyWorked = (sync && (sync.latest || sync.next)) || (fetch && (fetch.latest || fetch.next));
const status = anyWorked ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-39', status, why: 'sync=' + JSON.stringify(sync) + ' fetch=' + JSON.stringify(fetch), executedAt: '20261019050941', result: { sync, fetch } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
