import { queryDistTagsSync, parseDistTagsOutput, semverParse, determineTarget, judgeUpdate } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const caseId = 'D1-39';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  // Step 1: Real call queryDistTagsSync on Windows
  const result = queryDistTagsSync({ timeoutMs: 15000 });
  
  // Step 2: Also directly test npm view to understand the output format
  const npmResult = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
    shell: true,
  });
  
  const rawNpmOutput = npmResult.stdout?.trim() || '';
  const npmExitCode = npmResult.status;
  
  // Try parsing the raw output
  let parsedRaw = null;
  try {
    parsedRaw = JSON.parse(rawNpmOutput);
  } catch(e) {
    parsedRaw = { parseError: e.message };
  }
  
  // Test parseDistTagsOutput with the raw output
  const parsedTags = parseDistTagsOutput(rawNpmOutput);
  
  // Check if the issue is array-wrapped output
  const isArrayWrapped = Array.isArray(parsedRaw);
  const firstElement = isArrayWrapped ? parsedRaw[0] : parsedRaw;
  
  // Test with unwrapped data
  const unwrappedTags = isArrayWrapped ? parsedRaw[0] : parsedRaw;
  const target = unwrappedTags ? determineTarget('1.1.8', unwrappedTags) : null;
  const updateInfo = unwrappedTags ? judgeUpdate('1.1.8', unwrappedTags, null) : null;
  
  // Determine status: PASS if queryDistTagsSync returns valid tags (no EINVAL), FAIL if it returns null
  const hasEINVAL = result === null && npmExitCode !== 0;
  const hasParseFailure = result === null && npmExitCode === 0 && rawNpmOutput.length > 0;
  
  const status = (result && result.latest) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `queryDistTagsSync returned valid tags on Windows: latest=${result.latest}, next=${result.next}; no EINVAL`
    : hasParseFailure
      ? `queryDistTagsSync returned null due to parse failure: npm output is array-wrapped [{}] but parseDistTagsOutput rejects arrays (line 86: Array.isArray check). npm exit=${npmExitCode}, raw output type=${isArrayWrapped ? 'array' : typeof parsedRaw}. No EINVAL but detection chain broken.`
      : `queryDistTagsSync returned null: npm exit=${npmExitCode}, EINVAL=${hasEINVAL}, raw output length=${rawNpmOutput.length}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      queryDistTagsSyncResult: result,
      npmExitCode,
      npmOutputType: isArrayWrapped ? 'array' : typeof parsedRaw,
      npmOutputSample: rawNpmOutput.slice(0, 200),
      parsedTags,
      unwrappedTags,
      target,
      updateStatus: updateInfo?.result,
      platform: process.platform,
      hasEINVAL,
      hasParseFailure,
      rootCause: hasParseFailure ? 'update-check.mjs:86 parseDistTagsOutput rejects Array.isArray(parsed) but npm view returns array-wrapped output' : null
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `queryDistTagsSync threw: ${e.message}`,
    executedAt: execTs,
    error: e.message,
    stack: e.stack?.split('\n').slice(0,5)
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
