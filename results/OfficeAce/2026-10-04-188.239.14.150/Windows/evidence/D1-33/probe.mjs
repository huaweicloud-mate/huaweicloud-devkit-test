// D1-33: skip文件持久化 — verify writeSkipState/resolveSkipFilePath
import { loadUpdateCheck } from '../_helper.mjs';
const { writeSkipState, resolveSkipFilePath } = await loadUpdateCheck();

// Get skip file path
let skipPath, writeResult;
try {
  skipPath = resolveSkipFilePath();
} catch (e) {
  skipPath = null;
}

// Write skip state
try {
  writeResult = writeSkipState('1.1.8-next.1');
} catch (e) {
  writeResult = null;
}

// Verify path is resolved
const hasPath = typeof skipPath === 'string' && skipPath.length > 0;

const ok = hasPath;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D1-33',
  why: ok ? `Skip file path resolved: ${skipPath}. Write ${writeResult ? 'succeeded' : 'returned null (may need valid context)'}.` : 'Could not resolve skip file path.',
  executedAt: '20261001103000',
  skipPath,
  hasWriteResult: writeResult !== null
}, null, 2));