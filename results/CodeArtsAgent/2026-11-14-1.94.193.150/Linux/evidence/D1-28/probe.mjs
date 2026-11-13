// case D1-28 每日测试探针（由统一 driver _probes/*.mjs 驱动执行并落盘结果）
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const d = dirname(fileURLToPath(import.meta.url));
try {
  const r = JSON.parse(readFileSync(join(d, 'stdout.log'), 'utf-8'));
  console.log('caseId=' + r.caseId + ' status=' + r.status);
} catch (e) {
  console.log('case D1-28 evidence stdout.log 读取失败: ' + e.message);
}
