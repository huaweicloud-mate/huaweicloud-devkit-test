// tm-baseline 契约单测：基线更新的 fail-closed 与 dry-run
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { updateBaseline } from '../../test-manager/tm-baseline.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tm-baseline-'));
}

test('未人工确认 → 拒绝写入（fail-closed）', () => {
  const dir = tmpDir();
  const r = updateBaseline({ scenarioId: 's1', newRecording: [{ a: 1 }], approvedByUser: false, baselinesDir: dir });
  assert.equal(r.ok, false);
  assert.equal(r.wrote, false);
  assert.equal(fs.existsSync(path.join(dir, 's1.jsonl')), false);
});

test('approvedByUser 缺省（undefined）也拒绝', () => {
  const r = updateBaseline({ scenarioId: 's1', newRecording: [{ a: 1 }], baselinesDir: tmpDir() });
  assert.equal(r.ok, false);
});

test('确认后写入 JSONL，行数与内容正确', () => {
  const dir = tmpDir();
  const r = updateBaseline({
    scenarioId: 's2', newRecording: [{ tool: 'x' }, { tool: 'y' }], approvedByUser: true, baselinesDir: dir,
  });
  assert.equal(r.ok, true);
  assert.equal(r.wrote, true);
  assert.equal(r.lines, 2);
  const text = fs.readFileSync(path.join(dir, 's2.jsonl'), 'utf8');
  assert.equal(text.trim().split('\n').length, 2);
  assert.deepEqual(JSON.parse(text.trim().split('\n')[0]), { tool: 'x' });
});

test('dryRun → 只回报不落盘', () => {
  const dir = tmpDir();
  const r = updateBaseline({
    scenarioId: 's3', newRecording: [{ a: 1 }], approvedByUser: true, dryRun: true, baselinesDir: dir,
  });
  assert.equal(r.ok, true);
  assert.equal(r.dryRun, true);
  assert.equal(r.wrote, false);
  assert.equal(fs.existsSync(path.join(dir, 's3.jsonl')), false);
});

test('scenarioId 含路径分隔 → 拒绝（防路径穿越）', () => {
  const r = updateBaseline({ scenarioId: '../evil', newRecording: [{ a: 1 }], approvedByUser: true, baselinesDir: tmpDir() });
  assert.equal(r.ok, false);
  assert.match(r.reason, /路径穿越|只允许/);
});

test('空录制 → 拒绝', () => {
  const r = updateBaseline({ scenarioId: 's4', newRecording: [], approvedByUser: true, baselinesDir: tmpDir() });
  assert.equal(r.ok, false);
});

test('字符串录制（JSONL 文本）也可写入', () => {
  const dir = tmpDir();
  const r = updateBaseline({ scenarioId: 's5', newRecording: '{"tool":"z"}\n', approvedByUser: true, baselinesDir: dir });
  assert.equal(r.ok, true);
  assert.equal(r.lines, 1);
});
