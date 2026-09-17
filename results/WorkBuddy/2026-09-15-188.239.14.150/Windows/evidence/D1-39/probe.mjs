import { queryDistTagsSync, queryDistTags } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
try {
  const syncResult = queryDistTagsSync('huaweicloud-devkit');
  console.log('queryDistTagsSync result:', JSON.stringify(syncResult));
  if (syncResult && (syncResult.latest || syncResult.error)) {
    console.log('PASS');
  } else {
    console.log('FAIL: no result and no error');
  }
} catch(e) {
  if (e.code === 'EINVAL') {
    console.log('FAIL: EINVAL error on Windows - ' + e.message);
  } else {
    console.log('PASS (error handled gracefully): ' + e.message);
  }
}