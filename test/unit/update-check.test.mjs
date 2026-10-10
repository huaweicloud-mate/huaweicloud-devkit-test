// Layer 2 契约单测：update-check.mjs
// 覆盖：semverCompare/semverParse/hasPrerelease、judgeUpdate 状态机（up_to_date/update_available/
// dismissed/降级 target）、determineTarget prerelease 跟随。复用 daily 用例 D1-30/31/40 的契约。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importHdk } from './helpers/hdk-path.mjs';

const { module: uc } = await importHdk('update-check.mjs');

test('semverCompare: 基础大小比较', () => {
  assert.equal(uc.semverCompare('1.1.3', '1.1.4'), -1);
  assert.equal(uc.semverCompare('1.1.4', '1.1.4'), 0);
  assert.equal(uc.semverCompare('1.2.0', '1.1.9'), 1);
});

test('semverCompare: prerelease 升序', () => {
  assert.equal(Math.sign(uc.semverCompare('1.1.4-next.2', '1.1.4-next.3')), -1);
});

test('hasPrerelease: 正确识别预发布', () => {
  assert.equal(uc.hasPrerelease('1.1.4-next.3'), true);
  assert.equal(uc.hasPrerelease('1.1.4'), false);
});

test('judgeUpdate: 当前=最新 → up_to_date', () => {
  assert.equal(uc.judgeUpdate('1.1.4', { latest: '1.1.4' }, null).result, 'up_to_date');
});

test('judgeUpdate: 当前<最新 → update_available + targetVersion', () => {
  const r = uc.judgeUpdate('1.1.3', { latest: '1.1.4' }, null);
  assert.equal(r.result, 'update_available');
  assert.equal(r.targetVersion, '1.1.4');
});

test('judgeUpdate: 冷却期内 → dismissed', () => {
  const skip = { expireAt: new Date(Date.now() + 60000).toISOString(), dismissedVersion: '1.1.4' };
  assert.equal(uc.judgeUpdate('1.1.3', { latest: '1.1.4' }, skip).result, 'dismissed');
});

test('judgeUpdate: 冷却期过后 → update_available', () => {
  const skip = { expireAt: new Date(Date.now() - 60000).toISOString(), dismissedVersion: '1.1.4' };
  assert.equal(uc.judgeUpdate('1.1.3', { latest: '1.1.4' }, skip).result, 'update_available');
});

test('judgeUpdate: SKIP_UPDATE=1 兜底 up_to_date', () => {
  process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE = '1';
  try {
    assert.equal(uc.judgeUpdate('1.1.3', { latest: '1.1.4' }, null).result, 'up_to_date');
  } finally {
    delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
  }
});

test('determineTarget: prerelease 跟随更高 next', () => {
  assert.equal(uc.determineTarget('1.1.4-next.1', { latest: '1.1.4', next: '1.1.5-next.0' }), '1.1.5-next.0');
});

test('determineTarget: 稳定版只跟 latest', () => {
  assert.equal(uc.determineTarget('1.1.4', { latest: '1.1.5', next: '1.1.5-next.0' }), '1.1.5');
});