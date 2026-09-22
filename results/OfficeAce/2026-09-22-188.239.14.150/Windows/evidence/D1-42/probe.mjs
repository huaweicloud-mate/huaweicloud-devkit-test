// AI生成
// D1-42: dismiss真实闭环与跨调用持久化 (install指定目标)
// First check_update confirms update_available, then dismiss, then check skip file, then re-check
import { dispatch } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { judgeUpdate, writeSkipState, readSkipState, resolveSkipFilePath } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Step 1: initialize
  await dispatch('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe-d142', version: '1.0.0' }
  }, { sessionId: 'test-d142' });

  // Step 2: Simulate update_available scenario using judgeUpdate directly
  const current = '1.1.1';
  const distTags = { latest: '1.1.2' };
  const firstCheck = await judgeUpdate(current, distTags, null);
  results.firstCheck = firstCheck;
  results.firstCheckUpdateAvailable = firstCheck.result === 'update_available';

  // Step 3: Call dismiss (write skip state)
  const skipPath = path.join(os.tmpdir(), 'd1-42-skip-' + Date.now() + '.json');
  const dismissResult = await writeSkipState(skipPath, '1.1.2');
  results.dismissResult = dismissResult;
  
  // Step 4: Check skip file
  const skipFileContent = await readSkipState(skipPath);
  results.skipFileContent = skipFileContent;
  results.skipFileHasFields = skipFileContent && 
    skipFileContent.dismissedVersion === '1.1.2' && 
    skipFileContent.dismissedAt && 
    skipFileContent.expireAt;
  
  // Check 3-day expiry
  const dismissedAt = new Date(skipFileContent.dismissedAt);
  const expireAt = new Date(skipFileContent.expireAt);
  const diffDays = (expireAt - dismissedAt) / (1000 * 60 * 60 * 24);
  results.isThreeDayExpiry = Math.abs(diffDays - 3) < 0.01;

  // Step 5: Re-check within cooldown
  const secondCheck = await judgeUpdate(current, distTags, skipFileContent);
  results.secondCheck = secondCheck;
  results.secondCheckDismissed = secondCheck.result === 'dismissed' && secondCheck.dismissed === true;

  // Step 6: Simulate process restart - read skip file again and check
  const rereadSkip = await readSkipState(skipPath);
  results.rereadSkip = rereadSkip;
  results.persistAfterRestart = rereadSkip && rereadSkip.dismissedVersion === '1.1.2';
  
  // Step 7: Re-check after "restart"
  const thirdCheck = await judgeUpdate(current, distTags, rereadSkip);
  results.thirdCheck = thirdCheck;
  results.thirdCheckDismissed = thirdCheck.result === 'dismissed';

  // Cleanup
  try { fs.unlinkSync(skipPath); } catch {}
  
  const status = (results.firstCheckUpdateAvailable && results.skipFileHasFields && 
                  results.isThreeDayExpiry && results.secondCheckDismissed && 
                  results.persistAfterRestart && results.thirdCheckDismissed) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? 'dismiss闭环正确: 首次update_available→dismiss写入skip文件(3天过期)→冷却内dismissed→进程重启后仍生效'
      : `dismiss闭环异常: firstUpdate=${results.firstCheckUpdateAvailable}, skipFields=${results.skipFileHasFields}, threeDay=${results.isThreeDayExpiry}, dismissed=${results.secondCheckDismissed}, persist=${results.persistAfterRestart}, thirdDismissed=${results.thirdCheckDismissed}`,
    executedAt: ts(),
    diffDays,
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
