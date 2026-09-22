// AI生成
// D1-40: 镜像lag下检测正确性 (P0)
// Set npm_config_registry to mirror, check version detection correctness
import { queryDistTagsSync, queryDistTags, judgeUpdate } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Step 1: Get official registry dist-tags
  const officialOut = execSync('npm view huaweicloud-devkit dist-tags --json --registry=https://registry.npmjs.org', {
    encoding: 'utf8', timeout: 30000,
    env: { ...process.env, PYTHONUTF8: '1' },
    shell: true
  });
  const officialTags = JSON.parse(officialOut);
  results.officialTags = officialTags;
  
  // Step 2: Get mirror registry dist-tags (npmmirror.com - may lag)
  let mirrorTags = null;
  let mirrorError = null;
  try {
    const mirrorOut = execSync('npm view huaweicloud-devkit dist-tags --json --registry=https://registry.npmmirror.com', {
      encoding: 'utf8', timeout: 30000,
      env: { ...process.env, PYTHONUTF8: '1' },
      shell: true
    });
    mirrorTags = JSON.parse(mirrorOut);
    results.mirrorTags = mirrorTags;
  } catch (e) {
    mirrorError = e.message;
    results.mirrorError = mirrorError;
  }
  
  // Step 3: Compare versions
  const officialLatest = officialTags.latest;
  const mirrorLatest = mirrorTags ? mirrorTags.latest : null;
  results.officialLatest = officialLatest;
  results.mirrorLatest = mirrorLatest;
  
  // Step 4: Simulate mirror lag scenario
  // If mirror lags behind official, judgeUpdate should NOT suggest downgrade
  // Test: current = officialLatest, distTags from mirror (which may be older)
  let lagTestResult = null;
  if (mirrorLatest) {
    // Simulate: user has officialLatest installed, mirror shows older version
    const simulatedMirrorTags = { latest: mirrorLatest };
    lagTestResult = await judgeUpdate(officialLatest, simulatedMirrorTags, null);
    results.lagTestResult = lagTestResult;
    
    // If mirror is behind, result should be up_to_date (not suggesting downgrade)
    // If mirror is same or ahead, result should be up_to_date
    results.noDowngradeSuggested = lagTestResult.result === 'up_to_date' || 
                                    (lagTestResult.result === 'update_available' && 
                                     lagTestResult.targetVersion !== mirrorLatest);
  }
  
  // Step 5: Also test with a clearly lagging mirror (simulate older version)
  const laggingTags = { latest: '1.0.0' }; // Much older version
  const laggingResult = await judgeUpdate(officialLatest, laggingTags, null);
  results.laggingResult = laggingResult;
  results.laggingNoDowngrade = laggingResult.result === 'up_to_date';
  
  // Step 6: Test with npm_config_registry env var set
  let envRegistryResult = null;
  try {
    const envRegistryOut = execSync('npm view huaweicloud-devkit dist-tags.latest --registry=https://registry.npmmirror.com', {
      encoding: 'utf8', timeout: 30000,
      env: { ...process.env, PYTHONUTF8: '1', npm_config_registry: 'https://registry.npmmirror.com' },
      shell: true
    });
    envRegistryResult = envRegistryOut.trim();
    results.envRegistryResult = envRegistryResult;
  } catch (e) {
    results.envRegistryError = e.message;
  }
  
  // Status: PASS if no version downgrade is suggested when mirror lags
  const status = (results.laggingNoDowngrade && laggingResult.result === 'up_to_date') ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? `镜像lag下不提示版本倒退。official=${officialLatest}, mirror=${mirrorLatest}, laggingTest(1.0.0)=up_to_date`
      : `镜像lag检测异常: laggingNoDowngrade=${results.laggingNoDowngrade}, laggingResult=${JSON.stringify(laggingResult)}`,
    executedAt: ts(),
    ...results
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
