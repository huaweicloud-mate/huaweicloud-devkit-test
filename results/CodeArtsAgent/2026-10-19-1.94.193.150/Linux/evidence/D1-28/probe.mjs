// D1-28 / D1-31 / D1-33 升级检测语义源码级探针（Hermes Linux 每日回归）
// 直调 update-check.mjs 导出函数：judgeUpdate / writeSkipState / resolveSkipFilePath / readSkipState。
import { pathToFileURL } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = process.argv[2];
const U = await import(pathToFileURL(`${SRC}/update-check.mjs`).href);
const COOLDOWN_DAYS = 3;

function ok(name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' | ' + detail : ''}`);
}

// ==== D1-28 检测语义-有新版本 ====
{
  const r = U.judgeUpdate('1.1.4', { latest: '1.1.5', next: '1.1.5' }, null);
  console.log(`[D1-28] judgeUpdate('1.1.4', {latest:1.1.5}) =>`, JSON.stringify(r));
  ok('D1-28 result=update_available', r.result === 'update_available');
  ok('D1-28 updateAvailable=true', r.updateAvailable === true);
  ok('D1-28 targetVersion=1.1.5', r.targetVersion === '1.1.5');
}

// ==== D1-31 dismiss 冷却期 ====
{
  const now = Date.now();
  const dir = mkdtempSync(join(tmpdir(), 'skip-'));
  const file = join(dir, 'skip.json');
  const state = U.writeSkipState(file, '1.2.0', { at: now, days: COOLDOWN_DAYS });
  console.log(`[D1-31] writeSkipState =>`, JSON.stringify(state));
  ok('D1-31 expireAt = dismissedAt + 3天', new Date(state.expireAt) - new Date(state.dismissedAt) === COOLDOWN_DAYS * 86400000);
  const inCooldown = U.judgeUpdate('1.1.4', { latest: '1.2.0' }, state, now + 60 * 1000);
  console.log(`[D1-31] 冷却期内 =>`, JSON.stringify(inCooldown));
  ok('D1-31 冷却期内 result=dismissed', inCooldown.result === 'dismissed' && inCooldown.dismissed === true);
  const expired = U.judgeUpdate('1.1.4', { latest: '1.2.0' }, state, now + (COOLDOWN_DAYS + 1) * 86400000);
  console.log(`[D1-31] 过期后 =>`, JSON.stringify(expired));
  ok('D1-31 过期后 result=update_available', expired.result === 'update_available');
  ok('D1-31 dismissExpiresAt 回填', Boolean(inCooldown.dismissExpiresAt));
  rmSync(dir, { recursive: true, force: true });
}

// ==== D1-33 skip 文件持久化与多路径 ====
{
  const dir = mkdtempSync(join(tmpdir(), 'skip2-'));
  const file = join(dir, 'skip.json');
  const state = U.writeSkipState(file, '1.3.0');
  const back = U.readSkipState(file);
  console.log(`[D1-33] write/read 回读 =>`, JSON.stringify(back));
  ok('D1-33 文件字段完整', back && back.dismissedVersion === '1.3.0' && back.dismissedAt && back.expireAt);
  ok('D1-33 结构仅含三字段', back && Object.keys(back).length === 3);
  // resolveSkipFilePath：插件目录(有 package.json) → skipFilePath；sessionId 细分
  const p1 = U.resolveSkipFilePath(null);
  const p2 = U.resolveSkipFilePath('sess-abc-123');
  console.log(`[D1-33] resolveSkipFilePath(null)=${p1}`);
  console.log(`[D1-33] resolveSkipFilePath('sess-abc-123')=${p2}`);
  // 契约：插件目录无 package.json 时回退共享路径（当前 npm 包 plugins/huaweicloud-core/ 仅 openclaw.plugin.json，无 package.json）
  ok('D1-33 无副本时回退共享路径(~/.config/huaweicloud/devkit-skip.json)', p1.endsWith('/huaweicloud/devkit-skip.json') || p1.endsWith('devkit-skip.json'));
  ok('D1-33 会话化路径按 sessionId 细分', p2 !== p1 && p2.startsWith(p1));
  ok('D1-33 sessionId 清洗(非法字符→_)', p2.endsWith('.sess-abc-123'));
  rmSync(dir, { recursive: true, force: true });
}

console.log('=== DONE ===');