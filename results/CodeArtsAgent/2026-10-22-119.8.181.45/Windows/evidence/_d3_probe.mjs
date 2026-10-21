import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceDir = __dirname;

const results = {};
const logs = [];

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = '[' + timestamp + '] ' + msg;
  logs.push(line);
  console.log(line);
}

log('=== D3 服务矩阵测试 ===');

// D3-C4: 服务规划冒烟测试
log('\n--- D3-C4 服务规划冒烟 ---');
try {
  const huaweicloud = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/index.mjs');
  const hasListOperations = typeof huaweicloud.huaweicloud_list_operations === 'function';
  const hasPlan = typeof huaweicloud.huaweicloud_plan === 'function';
  log('list_operations: ' + hasListOperations + ', plan: ' + hasPlan);
  results['D3-C4'] = { status: hasListOperations && hasPlan ? 'PASS' : 'FAIL' };
} catch (e) {
  log('D3-C4: ' + e.message);
  results['D3-C4'] = { status: 'BLOCKED', error: e.message };
}

// 写入结果
const stdoutLog = join(evidenceDir, 'stdout_d3.log');
const logContent = logs.join('\n') + '\n\n=== JSON RESULTS ===\n' + JSON.stringify(results, null, 2);
writeFileSync(stdoutLog, logContent, 'utf8');
console.log('\n=== RESULTS ===\n' + JSON.stringify(results, null, 2));
