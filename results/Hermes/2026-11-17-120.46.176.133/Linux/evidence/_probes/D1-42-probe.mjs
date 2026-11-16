// D1-42 dismiss 真实闭环与跨调用持久化（源码级探针，Hermes Linux）
// 深挖假阻塞：dismiss 冷却/落盘/重启复查全部可函数级直调（update-check.mjs），无需真实 agent。
// 断言：
//   ① resolveSkipFilePath 返回确定性正确路径（源仓 fallback → $HUAWEICLOUD_HOME/.config/huaweicloud/devkit-skip.json）
//   ② writeSkipState 落盘字段完整且 expireAt = dismissedAt + 3 天
//   ③ judgeUpdate 同版本冷却内返回 dismissed
//   ④ judgeUpdate 目标变更(远端更高)不受旧冷却约束 → update_available
//   ⑤ 跨进程（新 node 进程）readSkipState 仍能读回 → 重启持久化
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const SRCDIR = process.argv[2];
const { judgeUpdate, resolveSkipFilePath, readSkipState, writeSkipState, determineTarget, semverCompare } =
  await import(join(SRCDIR, 'update-check.mjs'));

// 隔离 HOME：不污染真实 ~/.config/huaweicloud
const iso = mkdtempSync(join(tmpdir(), 'dkt-d142-'));
process.env.HUAWEICLOUD_HOME = iso;
const file = resolveSkipFilePath(null);
const fileSess = resolveSkipFilePath('remote/abc-123');

let ok = true;
function check(id, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
  if (!cond) ok = false;
}

console.log('resolveSkipFilePath(null)   =', file);
console.log('resolveSkipFilePath(sess)    =', fileSess);
check('①路径确定性', file.startsWith(iso) && file.endsWith('devkit-skip.json'), 'fallback 路径落入隔离 HUAWEICLOUD_HOME');
check('①会话后缀隔离', fileSess !== file && fileSess.includes('remote_abc-123'), 'remote 会话按 sessionId 拆分 skip 文件');

// ②③④ 冷却闭环
const at = Date.UTC(2026, 0, 1, 0, 0, 0); // 固定时钟
const state = writeSkipState(file, '1.2.0', { at });
const dAt = new Date(state.dismissedAt).getTime();
const eAt = new Date(state.expireAt).getTime();
console.log('written state =', JSON.stringify(state));
check('②字段完整', state.dismissedVersion === '1.2.0' && state.dismissedAt && state.expireAt, 'dismissedVersion/dismissedAt/expireAt 齐备');
check('②expireAt=+3天', eAt - dAt === 3 * 24 * 60 * 60 * 1000, `expireAt - dismissedAt = ${(eAt - dAt) / 86400000} 天`);
const back = readSkipState(file);
check('②读回一致', back && back.dismissedVersion === '1.2.0', 'readSkipState 读回写入状态');

// 同版本冷却内（now 在冷却窗口内，target=1.2.0 == dismissedVersion）
const inCool = Date.UTC(2026, 0, 2, 0, 0, 0); // +1 天，< 3 天
const rDismiss = judgeUpdate('1.1.0', { latest: '1.2.0' }, state, inCool);
console.log('judgeUpdate(in cooldown) =', JSON.stringify(rDismiss));
check('③冷却内 dismissed', rDismiss.result === 'dismissed' && rDismiss.dismissed === true, '同版本冷却窗口内返回 dismissed');

// 冷却过期（+4 天 > 3 天）→ 恢复 update_available
const expired = Date.UTC(2026, 0, 5, 0, 0, 0);
const rExpire = judgeUpdate('1.1.0', { latest: '1.2.0' }, state, expired);
console.log('judgeUpdate(after expire) =', JSON.stringify(rExpire));
check('④冷却过期恢复', rExpire.result === 'update_available', '超过3天冷却后重新提示 update_available');

// 目标版本高于 dismissedVersion（远端发布 1.3.0）→ 不受旧 dismiss(1.2.0) 约束
const rNewer = judgeUpdate('1.1.0', { latest: '1.3.0' }, state, inCool);
console.log('judgeUpdate(newer target) =', JSON.stringify(rNewer));
check('④远端更高不守旧冷却', rNewer.result === 'update_available', 'dismissedVersion=1.2.0 不约束 1.3.0');

// 无 skip 状态 → update_available
const rNoSkip = judgeUpdate('1.1.0', { latest: '1.2.0' }, null, inCool);
check('无skip→可更新', rNoSkip.result === 'update_available', '无 skip 状态直接 update_available');

// ⑤ 跨进程持久化：新 node 进程读同一文件
const readScript = `
import { readSkipState } from '${join(SRCDIR, 'update-check.mjs')}';
const s = readSkipState(process.env.D1_SKIPFILE);
console.log(JSON.stringify(s));
`;
const child = spawnSync(process.execPath, ['--input-type=module', '-e', readScript], {
  encoding: 'utf8',
  env: { ...process.env, D1_SKIPFILE: file },
});
const cross = child.stdout.trim();
console.log('跨进程读回 =', cross);
check('⑤重启持久化', cross.includes('"dismissedVersion":"1.2.0"'), '新进程 readSkipState 读回同一 skip 状态');

console.log(`\n=== D1-42 探针结论: ${ok ? 'ALL PASS' : 'HAS FAIL'} ===`);
rmSync(iso, { recursive: true, force: true });
process.exit(ok ? 0 : 1);