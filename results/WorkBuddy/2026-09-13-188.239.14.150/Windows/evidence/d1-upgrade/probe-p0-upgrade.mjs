/**
 * P0 Upgrade Detection Chain Probe — D1-27/28/30/31/39/40 + D1-26/33/41/42/45
 * Tests update-check.mjs: judgeUpdate, semverCompare, writeSkipState, resolveSkipFilePath
 * SUT: huaweicloud-devkit@1.1.4-next.3
 */
import {
  judgeUpdate,
  semverCompare,
  semverParse,
  writeSkipState,
  resolveSkipFilePath,
  queryDistTags,
  queryDistTagsSync,
} from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';

import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0, spec = 0;
const results = [];

function assert(caseId, condition, detail) {
  const status = condition ? 'PASS' : 'FAIL';
  if (condition) pass++; else fail++;
  results.push({ caseId, status, detail });
  console.log(`[${status}] ${caseId}: ${detail}`);
}

function assertSpec(caseId, detail) {
  spec++;
  results.push({ caseId, status: 'SPEC-MISMATCH', detail });
  console.log(`[SPEC-MISMATCH] ${caseId}: ${detail}`);
}

// D1-27: Detection semantics - up to date
{
  const r = judgeUpdate('1.1.4-next.3', { latest: '1.1.4-next.3' }, null);
  assert('D1-27a', r.result === 'up_to_date', `current==latest → result=${r.result}, updateAvailable=${r.updateAvailable}`);
  assert('D1-27b', r.updateAvailable === false, `updateAvailable=${r.updateAvailable} [expected false]`);
}

// D1-28: Detection semantics - update available
{
  const r = judgeUpdate('1.1.3', { latest: '1.1.4' }, null);
  assert('D1-28a', r.result === 'update_available', `current<latest → result=${r.result}`);
  assert('D1-28b', r.updateAvailable === true, `updateAvailable=${r.updateAvailable} [expected true]`);
  assert('D1-28c', r.targetVersion === '1.1.4', `targetVersion=${r.targetVersion}`);
}

// D1-30: semver comparison correctness
{
  assert('D1-30a', semverCompare('1.1.2', '1.1.1') > 0, `1.1.2 > 1.1.1 → ${semverCompare('1.1.2', '1.1.1')}`);
  assert('D1-30b', semverCompare('1.1.0', '1.1.0-next.9') > 0, `1.1.0 > 1.1.0-next.9 → ${semverCompare('1.1.0', '1.1.0-next.9')}`);
  assert('D1-30c', semverCompare('1.1.2', '1.1.2') === 0, `1.1.2 == 1.1.2 → ${semverCompare('1.1.2', '1.1.2')}`);
  assert('D1-30d', semverCompare('1.1.1', '1.1.2') < 0, `1.1.1 < 1.1.2 → ${semverCompare('1.1.1', '1.1.2')}`);
  // Invalid string fallback
  const r = semverCompare('invalid', '1.1.2');
  assert('D1-30e', typeof r === 'number', `invalid vs valid → ${r} (should be a number, dictionary fallback)`);
}

// D1-31: dismiss cooldown period
{
  // resolveSkipFilePath() takes no args - it auto-detects plugin dir or falls back to global path
  const skipPath = resolveSkipFilePath();
  
  // Write skip state to the resolved path
  writeSkipState(skipPath, '1.1.4');
  
  if (existsSync(skipPath)) {
    const skipData = JSON.parse(readFileSync(skipPath, 'utf8'));
    assert('D1-31a', skipData.dismissedVersion === '1.1.4', `dismissedVersion=${skipData.dismissedVersion}`);
    assert('D1-31b', skipData.dismissedAt !== undefined, `dismissedAt exists: ${skipData.dismissedAt}`);
    assert('D1-31c', skipData.expireAt !== undefined, `expireAt exists: ${skipData.expireAt}`);
    
    // Check cooldown: judgeUpdate with dismiss
    const r = judgeUpdate('1.1.3', { latest: '1.1.4' }, { dismissedVersion: '1.1.4', dismissedAt: Date.now(), expireAt: Date.now() + 3*24*60*60*1000 });
    assert('D1-31d', r.result === 'dismissed' || r.dismissed === true, `cooldown → result=${r.result}, dismissed=${r.dismissed}`);
  } else {
    assert('D1-31a', false, `skip file not written at ${skipPath}`);
  }
  
  // Cleanup
  try { rmSync(skipPath, { force: true }); } catch {}
}

// D1-39: Windows upgrade detection chain - no EINVAL
{
  // Test queryDistTagsSync doesn't throw EINVAL on Windows
  try {
    const result = queryDistTagsSync();
    if (result && (result.latest || result.next)) {
      assert('D1-39a', true, `queryDistTagsSync → latest=${result.latest}, next=${result.next} [no EINVAL]`);
    } else {
      assert('D1-39a', true, `queryDistTagsSync returned (possibly network-restricted): ${JSON.stringify(result)}`);
    }
  } catch (e) {
    if (e.code === 'EINVAL') {
      assert('D1-39a', false, `queryDistTagsSync threw EINVAL: ${e.message}`);
    } else {
      assert('D1-39a', true, `queryDistTagsSync threw non-EINVAL error (acceptable): ${e.message}`);
    }
  }
}

// D1-40: Mirror lag detection - no version regression
{
  // When remote latest < local, should not suggest update
  const r = judgeUpdate('1.1.4-next.3', { latest: '1.1.3' }, null);
  assert('D1-40a', r.result !== 'update_available', `local>remote → result=${r.result} [no version regression alert]`);
  assert('D1-40b', r.updateAvailable === false, `updateAvailable=${r.updateAvailable} [no false alert when mirror lags]`);
}

// D1-26: Upgrade tools registered in MCP
{
  // Check tools.mjs for check_update and upgrade tool registration
  const fs = await import('node:fs');
  const toolsPath = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
  const content = fs.readFileSync(toolsPath, 'utf8');
  const hasCheckUpdate = /huaweicloud_check_update|check_update/i.test(content);
  const hasUpgrade = /huaweicloud_upgrade|upgrade/i.test(content);
  assert('D1-26a', hasCheckUpdate, `tools.mjs has check_update registration: ${hasCheckUpdate}`);
  assert('D1-26b', hasUpgrade, `tools.mjs has upgrade registration: ${hasUpgrade}`);
}

// D1-33: Skip file persistence and path resolution
{
  const skipPath = resolveSkipFilePath();
  
  // Write skip state to resolved path
  writeSkipState(skipPath, '1.1.4');
  
  assert('D1-33a', existsSync(skipPath), `skip file written at ${skipPath}`);
  
  if (existsSync(skipPath)) {
    const data = JSON.parse(readFileSync(skipPath, 'utf8'));
    assert('D1-33b', data.dismissedVersion === '1.1.4', `dismissedVersion=${data.dismissedVersion}`);
    assert('D1-33c', new Date(data.expireAt).getTime() > new Date(data.dismissedAt).getTime(), `expireAt > dismissedAt (3-day window)`);
  }
  
  // Cleanup
  try { rmSync(skipPath, { force: true }); } catch {}
}

// D1-41: check_update real MCP return contract (4 states)
{
  // Test via direct function calls simulating MCP response
  // up_to_date
  const r1 = judgeUpdate('1.1.4-next.3', { latest: '1.1.4-next.3' }, null);
  assert('D1-41a', r1.result === 'up_to_date' && r1.currentVersion !== undefined, `up_to_date state: result=${r1.result}, currentVersion=${r1.currentVersion}`);

  // update_available
  const r2 = judgeUpdate('1.1.3', { latest: '1.1.4' }, null);
  assert('D1-41b', r2.result === 'update_available' && r2.updateAvailable === true, `update_available state: result=${r2.result}`);

  // dismissed
  const r3 = judgeUpdate('1.1.3', { latest: '1.1.4' }, { dismissedVersion: '1.1.4', dismissedAt: Date.now(), expireAt: Date.now() + 3*24*60*60*1000 });
  assert('D1-41c', r3.result === 'dismissed' || r3.dismissed === true, `dismissed state: result=${r3.result}, dismissed=${r3.dismissed}`);

  // check_failed (null distTags)
  const r4 = judgeUpdate('1.1.4-next.3', null, null);
  assert('D1-41d', r4.result === 'check_failed', `check_failed state: result=${r4.result}`);
}

// D1-42: dismiss cross-process persistence
{
  const skipPath = resolveSkipFilePath();
  
  // First: write dismiss
  writeSkipState(skipPath, '1.1.4');
  assert('D1-42a', existsSync(skipPath), `skip file written (cross-process)`);
  
  // Read from "new process" (same file, simulating restart)
  if (existsSync(skipPath)) {
    const data = JSON.parse(readFileSync(skipPath, 'utf8'));
    const r = judgeUpdate('1.1.3', { latest: '1.1.4' }, data);
    assert('D1-42b', r.result === 'dismissed' || r.dismissed === true, `cross-process: judgeUpdate with skip data → result=${r.result}, dismissed=${r.dismissed}`);
  }
  
  try { rmSync(skipPath, { force: true }); } catch {}
}

// D1-45: fallback one-time consumption + prewarm race
{
  // This tests the MCP protocol layer's decorateResult logic + mcp-server prewarm
  const fs = await import('node:fs');
  const mcpProtocolPath = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-protocol.mjs';
  const mcpServerPath = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
  const protocolContent = fs.readFileSync(mcpProtocolPath, 'utf8');
  const serverContent = fs.readFileSync(mcpServerPath, 'utf8');
  
  const hasUpdateInfo = /_updateInfo|updateInfo/i.test(protocolContent);
  const hasOneTime = /once|one.?time|consumed|attached|decorate/i.test(protocolContent);
  const hasPrewarm = /prewarm|pre.?warm|updatePrewarm/i.test(serverContent);
  
  assert('D1-45a', hasUpdateInfo, `mcp-protocol has _updateInfo reference: ${hasUpdateInfo}`);
  assert('D1-45b', hasOneTime, `mcp-protocol has one-time consumption logic: ${hasOneTime}`);
  assert('D1-45c', hasPrewarm, `mcp-server has prewarm reference: ${hasPrewarm}`);
}

// Summary
console.log(`\n=== SUMMARY ===`);
console.log(`PASS: ${pass}, FAIL: ${fail}, SPEC-MISMATCH: ${spec}`);
console.log(JSON.stringify(results, null, 2));
