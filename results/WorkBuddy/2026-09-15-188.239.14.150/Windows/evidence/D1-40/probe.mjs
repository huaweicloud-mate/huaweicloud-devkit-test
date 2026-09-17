import { queryDistTagsSync, judgeUpdate, semverCompare } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
try {
  // Test with default registry
  const tags = queryDistTagsSync('huaweicloud-devkit');
  console.log('dist-tags:', JSON.stringify(tags));
  
  // Test judgeUpdate - should not suggest downgrade
  const result = judgeUpdate('99.99.99', tags);
  console.log('judgeUpdate(higher_local):', JSON.stringify(result));
  
  // Verify: when remote <= local, should NOT suggest update
  if (result && result.updateAvailable === false) {
    console.log('PASS: no version downgrade suggested');
  } else {
    console.log('FAIL: version downgrade check failed');
  }
} catch(e) {
  console.log('ERROR:', e.message);
  console.log('FAIL');
}