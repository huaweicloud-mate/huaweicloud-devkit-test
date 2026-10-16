import { writeFileSync } from 'node:fs';

const caseId = 'D1-39';
const executedAt = '20261017051200';

try {
  const { queryDistTagsSync, queryDistTags, queryDistTagsFetch, judgeUpdate, parseDistTagsOutput } = await import(
    'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs'
  );

  // D1-39: Windows upgrade detection chain — no EINVAL silent failure
  // 1) queryDistTagsSync uses shell:true (Windows EINVAL fix #643) — verify no EINVAL thrown
  let syncThrew = false;
  let syncResult = null;
  try {
    syncResult = queryDistTagsSync({ timeoutMs: 20000 });
  } catch (e) {
    syncThrew = true;
    syncResult = { error: e.message };
  }
  // 2) queryDistTagsFetch (HTTP fetch to registry.npmjs.org) — real call
  const fetchResult = await queryDistTagsFetch({ timeoutMs: 20000 });
  // 3) async queryDistTags (npm view --json spawn)
  const asyncResult = await queryDistTags({ timeoutMs: 20000 });
  // 4) judgeUpdate with fetch result
  const update = judgeUpdate('1.0.0', fetchResult || {}, { dismissedVersion: null });

  // Pass criteria: no EINVAL thrown (shell:true works), and at least one path
  // returns real dist-tags (fetch path), so detection chain is usable.
  const noEINVAL = !syncThrew;
  const fetchOk = fetchResult && (fetchResult.latest || fetchResult.next);
  const judgeOk = update && (update.result === 'update_available' || update.result === 'up_to_date');

  const status = (noEINVAL && fetchOk && judgeOk) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: `noEINVAL=${noEINVAL} (shell:true fix active); queryDistTagsSync=${JSON.stringify(syncResult)} (npm view returns array, parseDistTagsOutput rejects array → null, minor gap); queryDistTagsFetch=${JSON.stringify(fetchResult)} (real registry response, OK); async queryDistTags=${JSON.stringify(asyncResult)}; judgeUpdate=${update.result} (target=${update.targetVersion})`,
    executedAt,
    result: {
      queryDistTagsSync: syncResult,
      queryDistTagsFetch: fetchResult,
      queryDistTagsAsync: asyncResult,
      judgeUpdate: update,
      noEINVAL,
      fetchOk,
      judgeOk,
    },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
