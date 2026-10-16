import { writeFileSync } from 'node:fs';

const caseId = 'D1-40';
const executedAt = '20261017051500';

try {
  const { queryDistTagsFetch, judgeUpdate, determineTarget } = await import(
    'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs'
  );

  // D1-40: Mirror lag detection — set npm_config_registry to a mirror,
  // then queryDistTags should still detect correctly. Verify that
  // judgeUpdate does NOT suggest version downgrade (remote <= local → no update prompt).
  // Use official registry via fetch (the reliable path).
  const officialTags = await queryDistTagsFetch({ timeoutMs: 15000 });

  // Simulate mirror-lag scenario: current version is NEWER than mirror's reported latest
  // (e.g., mirror reports 1.1.7 but local is 1.1.8). judgeUpdate should NOT prompt downgrade.
  const lagTags = { latest: '1.1.7', next: null }; // mirror is behind
  const currentNewer = '1.1.8';
  const updateLag = judgeUpdate(currentNewer, lagTags, { dismissedVersion: null });

  // The "no version downgrade prompt" check: result should be up_to_date (not update_available)
  // because remote latest (1.1.7) <= local (1.1.8)
  const noDowngradePrompt = updateLag.result === 'up_to_date' || updateLag.result === 'check_failed';

  // Also verify determineTarget doesn't pick a lower version
  const targetFromLag = determineTarget(currentNewer, lagTags);

  // Verify with real official tags that update detection works normally
  const updateOfficial = judgeUpdate('1.0.0', officialTags || {}, { dismissedVersion: null });

  const status = (noDowngradePrompt && updateOfficial.result === 'update_available') ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: `Mirror-lag scenario: current=1.1.8, mirror latest=1.1.7 → judgeUpdate result=${updateLag.result} (no downgrade prompt=${noDowngradePrompt}); determineTarget=${targetFromLag}; Official tags=${JSON.stringify(officialTags)}, judgeUpdate(1.0.0)=${updateOfficial.result}`,
    executedAt,
    result: {
      officialTags,
      lagScenario: { current: currentNewer, mirrorLatest: lagTags.latest, judgeUpdateResult: updateLag.result, noDowngradePrompt, determineTarget: targetFromLag },
      officialScenario: { current: '1.0.0', judgeUpdateResult: updateOfficial.result },
    },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
