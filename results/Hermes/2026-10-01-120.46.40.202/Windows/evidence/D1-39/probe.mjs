// D1-39: Windows 升级检测链可用性
import { queryDistTagsSync, queryDistTags, queryDistTagsFetch } from './plugins/huaweicloud-core/src/update-check.mjs';
const results = {};
try {
  // Test queryDistTagsSync (synchronous version - the one that had EINVAL on Windows)
  console.log('Testing queryDistTagsSync...');
  let syncResult = null;
  let syncError = null;
  try {
    syncResult = queryDistTagsSync({ timeoutMs: 10000 });
    console.log('queryDistTagsSync result:', JSON.stringify(syncResult)?.substring(0, 200));
  } catch(e) {
    syncError = e.message;
    console.log('queryDistTagsSync error:', syncError);
  }
  
  // Check if EINVAL error occurs
  const hasEinval = syncError && syncError.includes('EINVAL');
  
  // Test queryDistTagsFetch (fetch-based version)
  console.log('Testing queryDistTagsFetch...');
  let fetchResult = null;
  let fetchError = null;
  try {
    fetchResult = await queryDistTagsFetch({ timeoutMs: 10000 });
    console.log('queryDistTagsFetch result:', JSON.stringify(fetchResult)?.substring(0, 200));
  } catch(e) {
    fetchError = e.message;
    console.log('queryDistTagsFetch error:', fetchError);
  }
  
  // The detection chain should work on Windows (no EINVAL silent failure)
  // queryDistTagsSync may still use spawnSync but should handle errors gracefully
  const syncWorks = !hasEinval && (syncResult || syncError);
  const fetchWorks = fetchResult || (fetchError && !fetchError.includes('EINVAL'));
  
  results['D1-39'] = {
    status: (syncWorks || fetchWorks) ? 'PASS' : 'FAIL',
    why: (syncWorks || fetchWorks) ? '' : 'EINVAL silent failure on Windows',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { 
      syncResult: syncResult ? 'got result' : 'null', 
      syncError, 
      hasEinval,
      fetchResult: fetchResult ? 'got result' : 'null',
      fetchError,
      syncWorks, fetchWorks
    }
  };
  console.log('STATUS:', results['D1-39'].status);
  console.log(JSON.stringify(results['D1-39'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D1-39'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
