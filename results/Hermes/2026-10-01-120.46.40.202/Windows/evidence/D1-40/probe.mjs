// D1-40: 镜像 lag 下检测正确性
import { queryDistTagsFetch, judgeUpdate, semverCompare, determineTarget } from './plugins/huaweicloud-core/src/update-check.mjs';
const results = {};
try {
  // Simulate mirror lag: distTags show older version than installed
  const currentVersion = '1.1.8-next.1'; // installed version
  const mirrorLagDistTags = {
    latest: '1.1.7',       // mirror shows older latest
    next: '1.1.8-next.1',  // mirror shows current next
  };
  
  const target = determineTarget(currentVersion, mirrorLagDistTags);
  console.log('Determine target (mirror lag):', target);
  
  const judge = judgeUpdate(currentVersion, mirrorLagDistTags, null);
  console.log('Judge update (mirror lag):', JSON.stringify(judge)?.substring(0, 200));
  
  // Should NOT suggest downgrade (remote <= local should not trigger update)
  const noDowngrade = judge.status !== 'update_available' || 
    (judge.target && semverCompare(judge.target, currentVersion) >= 0);
  
  // Test with official source (simulated)
  const officialDistTags = {
    latest: '1.1.7',
    next: '1.1.8-next.1',
  };
  const judgeOfficial = judgeUpdate(currentVersion, officialDistTags, null);
  console.log('Judge update (official):', JSON.stringify(judgeOfficial)?.substring(0, 200));
  
  results['D1-40'] = {
    status: noDowngrade ? 'PASS' : 'FAIL',
    why: noDowngrade ? '' : 'Version downgrade suggested (mirror lag issue)',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { 
      currentVersion, mirrorLagDistTags, target,
      judgeStatus: judge.status, judgeTarget: judge.target,
      noDowngrade
    }
  };
  console.log('STATUS:', results['D1-40'].status);
  console.log(JSON.stringify(results['D1-40'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D1-40'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
