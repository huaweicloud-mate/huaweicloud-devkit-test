import { queryDistTagsSync, queryDistTagsFetch, judgeUpdate, semverCompare, determineTarget } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/update-check.mjs';

// D1-39: Windows 升级检测链可用性
console.log('=== D1-39: Windows update detection chain ===');
// Test queryDistTagsSync - should not EINVAL on Windows
let d39pass = true;
try {
  const tags = queryDistTagsSync({ timeoutMs: 10000 });
  console.log('  queryDistTagsSync result: ' + JSON.stringify(tags));
  if (tags && (tags.latest || tags.error)) {
    console.log('  queryDistTagsSync returned without EINVAL: OK');
  } else {
    console.log('  queryDistTagsSync returned empty');
  }
} catch (e) {
  console.log('  queryDistTagsSync threw: ' + e.message);
  if (e.code === 'EINVAL') {
    d39pass = false;
    console.log('  EINVAL detected: FAIL');
  }
}

// Also test async fetch
try {
  const tagsAsync = await queryDistTagsFetch({ timeoutMs: 10000 });
  console.log('  queryDistTagsFetch result: ' + JSON.stringify(tagsAsync));
} catch (e) {
  console.log('  queryDistTagsFetch threw: ' + e.message);
}
console.log('D1-39_VERDICT=' + (d39pass ? 'PASS' : 'FAIL'));

// D1-40: 镜像 lag 下检测正确性
console.log('=== D1-40: mirror lag detection ===');
// Test judgeUpdate with lagging mirror (remote version <= local)
const localVersion = '1.1.5';
const laggingTags = { latest: '1.1.4' }; // mirror behind
const lagResult = judgeUpdate(localVersion, laggingTags, null);
console.log('  local=1.1.5, mirror latest=1.1.4 => ' + JSON.stringify(lagResult));
// Should NOT suggest update when remote <= local
const noFalseUpdate = !lagResult.update || lagResult.target === null;
console.log('  no false update suggestion=' + noFalseUpdate);

// Test with ahead version
const aheadTags = { latest: '1.1.6' };
const aheadResult = judgeUpdate(localVersion, aheadTags, null);
console.log('  local=1.1.5, remote latest=1.1.6 => ' + JSON.stringify(aheadResult));
const correctUpdate = aheadResult.update || aheadResult.target !== null;
console.log('  correct update suggestion=' + correctUpdate);

const d40pass = noFalseUpdate && correctUpdate;
console.log('D1-40_VERDICT=' + (d40pass ? 'PASS' : 'FAIL'));
