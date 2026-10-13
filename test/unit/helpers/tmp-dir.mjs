// 临时目录工具：为契约测试创建隔离的项目目录 / 文件。
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function makeTempDir(prefix = 'devkit-unit-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function writeFixture(root, relPath, content) {
  const full = join(root, relPath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content, 'utf8');
  return full;
}

export function cleanupTempDir(root) {
  if (root) rmSync(root, { recursive: true, force: true });
}

export async function withTempDir(fn) {
  const dir = makeTempDir();
  try {
    return await fn(dir);
  } finally {
    cleanupTempDir(dir);
  }
}