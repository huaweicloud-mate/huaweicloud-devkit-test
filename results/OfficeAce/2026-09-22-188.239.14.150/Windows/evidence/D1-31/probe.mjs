// AI生成
// D1-31: dismiss冷却期 (跨版本检测)
// Test writeSkipState/judgeUpdate with dismiss mechanism
import { judgeUpdate, writeSkipState, readSkipState, resolveSkipFilePath } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  // Use temp dir for skip file
  const tmpDir = path.join(os.tmpdir(), 'd1-31-test-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const skipPath = path.join(tmpDir, 'devkit-skip.json');
  
  // Step 1: Write skip state for version 1.1.2
  const dismissedVersion = '1.1.2';
  const writeResult = await writeSkipState(skipPath, dismissedVersion);
  
  // Read it back
  const readBack = await readSkipState(skipPath);
  const hasFields = readBack && readBack.dismissedVersion === dismissedVersion && readBack.dismissedAt && readBack.expireAt;
  
  // Check 3-day expiry
  const dismissedAt = new Date(readBack.dismissedAt);
  const expireAt = new Date(readBack.expireAt);
  const diffDays = (expireAt - dismissedAt) / (1000 * 60 * 60 * 24);
  const isThreeDays = Math.abs(diffDays - 3) < 0.01;
  
  // Step 2: judgeUpdate within cooldown (same version)
  const distTags = { latest: '1.1.2' };
  const resultInCooldown = await judgeUpdate('1.1.1', distTags, readBack);
  const isDismissed = resultInCooldown.result === 'dismissed' && resultInCooldown.dismissed === true;
  
  // Step 3: judgeUpdate with new version (1.1.3) - should re-remind
  const distTagsNew = { latest: '1.1.3' };
  const resultNewVersion = await judgeUpdate('1.1.1', distTagsNew, readBack);
  const reReminds = resultNewVersion.result === 'update_available';
  
  // Step 4: Simulate expired cooldown
  const expiredState = { ...readBack, expireAt: new Date(Date.now() - 1000).toISOString() };
  const resultExpired = await judgeUpdate('1.1.1', distTags, expiredState);
  const isExpired = resultExpired.result === 'update_available';
  
  // Cleanup
  try { fs.unlinkSync(skipPath); } catch {}
  try { fs.rmdirSync(tmpDir); } catch {}
  
  const status = (hasFields && isThreeDays && isDismissed && reReminds && isExpired) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? '冷却期3天，冷却内返回dismissed，新版本重新提醒，过期后返回update_available'
      : `部分检查失败: hasFields=${hasFields}, isThreeDays=${isThreeDays}, isDismissed=${isDismissed}, reReminds=${reReminds}, isExpired=${isExpired}`,
    executedAt: ts(),
    skipState: readBack,
    diffDays,
    resultInCooldown,
    resultNewVersion,
    resultExpired
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
