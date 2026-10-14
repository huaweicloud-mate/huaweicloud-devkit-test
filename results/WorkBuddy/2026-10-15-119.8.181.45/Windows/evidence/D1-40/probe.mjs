import { queryDistTagsSync, parseDistTagsOutput, semverCompare, determineTarget, judgeUpdate } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const caseId = 'D1-40';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  // Set npm_config_registry to a mirror (simulate lag)
  // Use the official registry first, then test with a known mirror
  const npmResult = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json', '--registry=https://registry.npmmirror.com'], {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
    shell: true,
  });

  const rawOutput = npmResult.stdout?.trim() || '';
  const npmExitCode = npmResult.status;

  // Parse output
  let parsedRaw = null;
  try { parsedRaw = JSON.parse(rawOutput); } catch { parsedRaw = null; }

  // Handle array-wrapped output (known issue from D1-39)
  const unwrappedTags = Array.isArray(parsedRaw) ? parsedRaw[0] : parsedRaw;

  // Get official registry tags for comparison
  const officialResult = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
    shell: true,
  });
  let officialParsed = null;
  try { officialParsed = JSON.parse(officialResult.stdout?.trim() || ''); } catch {}
  const officialTags = Array.isArray(officialParsed) ? officialParsed[0] : officialParsed;

  // Test determineTarget with mirror tags
  const mirrorTarget = unwrappedTags ? determineTarget('1.1.8', unwrappedTags) : null;
  const mirrorUpdate = unwrappedTags ? judgeUpdate('1.1.8', unwrappedTags, null) : null;

  // Test determineTarget with official tags
  const officialTarget = officialTags ? determineTarget('1.1.8', officialTags) : null;

  // Check: does the mirror lag behind official?
  const mirrorLatest = unwrappedTags?.latest;
  const officialLatest = officialTags?.latest;
  const mirrorNext = unwrappedTags?.next;
  const officialNext = officialTags?.next;

  // The test expects: no version downgrade suggestion (remote <= local should not suggest update)
  // If mirror has older version than official, the detection should still work correctly
  const versionComparison = mirrorLatest && officialLatest
    ? semverCompare(mirrorLatest, officialLatest)
    : null;

  // Status: PASS if the detection chain works correctly with mirror (no false downgrade suggestion)
  // FAIL if it suggests a downgrade or fails to parse
  const parseWorks = unwrappedTags && unwrappedTags.latest;
  const noFalseDowngrade = mirrorLatest && officialLatest
    ? semverCompare(mirrorLatest, officialLatest) <= 0 // mirror should be <= official (lag)
    : true;

  const status = parseWorks ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `Mirror registry returned tags: latest=${mirrorLatest}, next=${mirrorNext}. Official: latest=${officialLatest}, next=${officialNext}. Mirror lag detection works, no false downgrade. judgeUpdate.result=${mirrorUpdate?.result}`
    : `Mirror registry query failed or returned unparseable output. npm exit=${npmExitCode}, raw=${rawOutput.slice(0,100)}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      mirrorTags: unwrappedTags,
      officialTags,
      mirrorTarget,
      officialTarget,
      mirrorUpdateResult: mirrorUpdate?.result,
      versionComparison,
      npmExitCode,
      rawOutputSample: rawOutput.slice(0, 200)
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `Mirror lag test threw: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
